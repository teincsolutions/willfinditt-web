pipeline {
    agent { node { label 'willfind8-agent' } }

    environment {
        DOCKER_IMAGE = 'teincsolutions/willfind8-web'
        NEXT_PUBLIC_API_URL = 'https://api.willfind8.com/api/v1'
        NEXT_PUBLIC_SITE_URL = 'https://willfind8.com'
    }

    stages {
        stage('Checkout') {
            steps {
                echo '🔄 Checking out code from SCM...'
                checkout scm
                script {
                    env.GIT_COMMIT = sh(returnStdout: true, script: 'git rev-parse HEAD').trim()
                    env.GIT_BRANCH = sh(returnStdout: true, script: 'git rev-parse --abbrev-ref HEAD').trim()
                    env.GIT_AUTHOR = sh(returnStdout: true, script: 'git log -1 --pretty=format:"%an"').trim()
                    env.DOCKER_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
                    echo "Branch: ${env.GIT_BRANCH}, Commit: ${env.GIT_COMMIT.take(7)}, Author: ${env.GIT_AUTHOR}, Tag: ${env.DOCKER_TAG}"
                }
            }
        }

        stage('Setup Environment') {
            steps {
                script {
                    // Set up environment file using envsubst
                    withCredentials([usernamePassword(credentialsId: 'google-client-credentials', usernameVariable: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID', passwordVariable: 'GOOGLE_CLIENT_SECRET')]) {
                        sh '''
                            echo "Setting up environment variables..."
                            envsubst < .env.template > .env
                            echo "Environment file created successfully"
                        '''
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Build Docker image with retry and host network for reliable external access
                    retry(3) {
                        sh """
                            echo "Building Docker image with docker build..."
                            docker build --network host -t ${DOCKER_IMAGE}:${DOCKER_TAG} .
                            docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest
                        """
                    }
                }
            }
        }

        stage('Test Docker Image') {
            steps {
                script {
                    // Test the Docker image by running it briefly
                    sh """
                        echo "Testing Docker image..."
                        docker stop willfinditt-web-test || true
                        docker rm willfinditt-web-test || true
                        docker run -d --name willfinditt-web-test --network wf8-internal-net --env-file .env ${DOCKER_IMAGE}:${DOCKER_TAG}
                        sleep 30
                        if curl -f http://willfinditt-web-test:3000 > /dev/null 2>&1; then
                            echo "Image test passed!"
                        else
                            echo "ERROR: Image test failed"
                            exit 1
                        fi
                        docker stop willfinditt-web-test || true
                    """
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                script {
                    // Login to Docker Hub
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                        sh """
                            echo "Logging into Docker Hub..."
                            echo \$DOCKER_PASSWORD | docker login -u \$DOCKER_USERNAME --password-stdin
                        """
                    }

                    // Push Docker image to Docker Hub
                    sh """
                        echo "Pushing Docker image to Docker Hub..."
                        docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
                        docker push ${DOCKER_IMAGE}:latest
                    """
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    // Deploy using docker compose production file
                    sh """
                        echo "Deploying application..."
                        export DOCKER_TAG=${DOCKER_TAG}
                        docker compose -f docker-compose.prod.yml down || true
                        docker compose -f docker-compose.prod.yml pull
                        docker compose -f docker-compose.prod.yml up -d
                    """
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    // Wait for application to be healthy
                    sh '''
                        echo "Performing health check..."
                        for i in {1..30}; do
                            if curl -f http://willfinditt-web-prod:3000 > /dev/null 2>&1; then
                                echo "Application is healthy!"
                                break
                            fi
                            echo "Waiting for application to be healthy... (attempt $i/30)"
                            sleep 10
                        done

                        # Final health check
                        if ! curl -f http://willfinditt-web-prod:3000 > /dev/null 2>&1; then
                            echo "ERROR: Application failed health check"
                            exit 1
                        fi
                    '''
                }
            }
        }

        stage('Cleanup') {
            steps {
                script {
                    // Clean up old Docker images
                    sh '''
                        echo "Cleaning up old Docker images..."
                        docker image prune -f
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline succeeded! Application deployed successfully.'
            script {
                withCredentials([string(credentialsId: 'slack-webhook', variable: 'SLACK_WEBHOOK_URL')]) {
                    sh """
                        curl -X POST -H 'Content-type: application/json' --data '{
                            "username": "Jenkins",
                            "icon_emoji": ":white_check_mark:",
                            "attachments": [{
                                "color": "good",
                                "text": "✅ WillFindIT Web deployed successfully!",
                                "fields": [
                                    {
                                        "title": "Build",
                                        "value": "${env.BUILD_NUMBER}",
                                        "short": true
                                    },
                                    {
                                        "title": "Job",
                                        "value": "${env.JOB_NAME}",
                                        "short": true
                                    },
                                    {
                                        "title": "Branch",
                                        "value": "${env.GIT_BRANCH}",
                                        "short": true
                                    },
                                    {
                                        "title": "Commit",
                                        "value": "${env.GIT_COMMIT.take(7)}",
                                        "short": true
                                    }
                                ]
                            }]
                        }' \$SLACK_WEBHOOK_URL
                    """
                }
            }
        }
        failure {
            echo 'Pipeline failed! Check the logs for details.'
            script {
                withCredentials([string(credentialsId: 'slack-webhook', variable: 'SLACK_WEBHOOK_URL')]) {
                    sh """
                        curl -X POST -H 'Content-type: application/json' --data '{
                            "username": "Jenkins",
                            "icon_emoji": ":x:",
                            "attachments": [{
                                "color": "danger",
                                "text": "❌ WillFindIT Web deployment failed!",
                                "fields": [
                                    {
                                        "title": "Build",
                                        "value": "${env.BUILD_NUMBER}",
                                        "short": true
                                    },
                                    {
                                        "title": "Job",
                                        "value": "${env.JOB_NAME}",
                                        "short": true
                                    },
                                    {
                                        "title": "Build URL",
                                        "value": "${env.BUILD_URL}",
                                        "short": false
                                    }
                                ]
                            }]
                        }' \$SLACK_WEBHOOK_URL
                    """
                }
            }
        }
        always {
            // Clean up workspace
            deleteDir()
        }
    }
}
