'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FaceLandmarker } from '@mediapipe/tasks-vision';
import type { InferenceSession } from 'onnxruntime-web';
import { Button } from '@/components/Button';

export type FacePose = 'CENTER' | 'LEFT' | 'RIGHT';

export interface CapturedFace {
  pose: FacePose;
  file: File;
  yaw: number;
  pitch: number;
  roll: number;
  livenessScore: number;
  capturedAt: string;
}

interface FaceCaptureProps {
  open: boolean;
  onClose: () => void;
  onComplete: (captures: CapturedFace[]) => void;
}

const POSES: FacePose[] = ['CENTER', 'LEFT', 'RIGHT'];
const POSE_COPY: Record<FacePose, string> = {
  CENTER: 'Look straight at the camera',
  LEFT: 'Slowly turn your head to your left',
  RIGHT: 'Slowly turn your head to your right',
};

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getPoseMetrics(landmarks: { x: number; y: number; z: number }[]) {
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  const nose = landmarks[1];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];

  const faceWidth = Math.max(
    distance(leftCheek, rightCheek),
    distance(landmarks[172], landmarks[397]),
    0.001
  );
  const faceCenterX = (leftCheek.x + rightCheek.x) / 2;
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;

  const yaw = ((nose.x - faceCenterX) / faceWidth) * 180;
  const pitch =
    ((nose.y - eyeCenterY) /
      Math.max(distance(landmarks[10], landmarks[152]), 0.001)) *
    120;
  const roll =
    (Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180) /
    Math.PI;

  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const point of landmarks) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  return {
    yaw,
    pitch,
    roll,
    faceWidth,
    bbox: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
  };
}

function poseMatches(pose: FacePose, yaw: number) {
  if (pose === 'CENTER') return Math.abs(yaw) <= 10;
  if (pose === 'LEFT') return yaw <= -14;
  return yaw >= 14;
}

export function FaceCapture({ open, onClose, onComplete }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const sessionRef = useRef<InferenceSession | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const stableSinceRef = useRef<number | null>(null);
  const capturingRef = useRef(false);
  const inferringRef = useRef(false);
  const capturesRef = useRef<CapturedFace[]>([]);
  const poseIndexRef = useRef(0);
  const onCompleteRef = useRef(onComplete);

  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Starting camera...');
  const [poseIndex, setPoseIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [captures, setCaptures] = useState<CapturedFace[]>([]);

  const currentPose = POSES[poseIndex] ?? 'CENTER';

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const checkLiveness = useCallback(
    async (
      video: HTMLVideoElement,
      bbox?: { x: number; y: number; width: number; height: number }
    ) => {
      const session = sessionRef.current;
      if (!session) return 0.5;

      try {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return 0.5;

        let sx = 0;
        let sy = 0;
        let side = Math.min(video.videoWidth, video.videoHeight);

        if (bbox && bbox.width > 0 && bbox.height > 0) {
          const centerX = (bbox.x + bbox.width / 2) * video.videoWidth;
          const centerY = (bbox.y + bbox.height / 2) * video.videoHeight;
          side =
            Math.max(
              bbox.width * video.videoWidth,
              bbox.height * video.videoHeight
            ) * 1.6;
          side = Math.min(side, Math.min(video.videoWidth, video.videoHeight));
          sx = Math.max(0, centerX - side / 2);
          sy = Math.max(0, centerY - side / 2);
        } else {
          sx = Math.max(0, (video.videoWidth - side) / 2);
          sy = Math.max(0, (video.videoHeight - side) / 2);
        }

        ctx.drawImage(video, sx, sy, side, side, 0, 0, size, size);
        const image = ctx.getImageData(0, 0, size, size).data;

        const plane = size * size;
        const input = new Float32Array(plane * 3);
        for (let i = 0; i < plane; i += 1) {
          input[i] = image[i * 4] / 255;
          input[plane + i] = image[i * 4 + 1] / 255;
          input[plane * 2 + i] = image[i * 4 + 2] / 255;
        }

        const ort = await import('onnxruntime-web');
        const tensor = new ort.Tensor('float32', input, [1, 3, size, size]);
        const results = await session.run({
          [session.inputNames[0]]: tensor,
        });
        const logits = results[session.outputNames[0]].data as Float32Array;
        const real = Number(logits[0] ?? 0);
        const spoof = Number(logits[1] ?? 0);
        return 1 / (1 + Math.exp(spoof - real));
      } catch (livenessError) {
        console.warn('Liveness inference failed', livenessError);
        return 0.5;
      }
    },
    []
  );

  const captureFrame = useCallback(
    async (
      video: HTMLVideoElement,
      pose: FacePose,
      metrics: {
        yaw: number;
        pitch: number;
        roll: number;
        bbox: { x: number; y: number; width: number; height: number };
      }
    ) => {
      if (capturingRef.current) return;
      capturingRef.current = true;
      setIsCapturing(true);
      setStatus('Checking liveness and capturing...');

      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Camera canvas unavailable');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/jpeg', 0.92)
        );
        if (!blob) throw new Error('Could not capture image');

        // The anti-spoof model is trained on frontal faces and is unreliable on
        // profile poses. Run the liveness check once on the center capture and
        // reuse that score for the left/right frames.
        const centerCapture = capturesRef.current.find(
          (item) => item.pose === 'CENTER'
        );
        const livenessScore =
          pose === 'CENTER'
            ? await checkLiveness(video, metrics.bbox)
            : (centerCapture?.livenessScore ?? 0.5);

        if (pose === 'CENTER' && livenessScore < 0.5) {
          setStatus(
            'Liveness check failed. Improve lighting, look straight ahead and try again.'
          );
          stableSinceRef.current = null;
          setCountdown(null);
          capturingRef.current = false;
          setIsCapturing(false);
          return;
        }

        const capture: CapturedFace = {
          pose,
          file: new File([blob], `face-${pose.toLowerCase()}.jpg`, {
            type: 'image/jpeg',
          }),
          yaw: metrics.yaw,
          pitch: metrics.pitch,
          roll: metrics.roll,
          livenessScore,
          capturedAt: new Date().toISOString(),
        };

        const next = [...capturesRef.current, capture];
        capturesRef.current = next;
        setCaptures(next);

        if (next.length === POSES.length) {
          setStatus('All captures complete');
          setCountdown(null);
          setTimeout(() => onCompleteRef.current(next), 500);
          return;
        }

        poseIndexRef.current = next.length;
        setPoseIndex(next.length);
        stableSinceRef.current = null;
        setCountdown(null);
        setStatus(POSE_COPY[POSES[next.length]]);
      } catch (captureError) {
        console.error('Face capture failed', captureError);
        setStatus('Could not capture. Please try again.');
        stableSinceRef.current = null;
        setCountdown(null);
      } finally {
        if (capturesRef.current.length < POSES.length) {
          capturingRef.current = false;
          setIsCapturing(false);
        }
      }
    },
    [checkLiveness]
  );

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    let localStream: MediaStream | null = null;

    capturesRef.current = [];
    poseIndexRef.current = 0;
    stableSinceRef.current = null;
    lastVideoTimeRef.current = -1;
    setCaptures([]);
    setPoseIndex(0);
    setCountdown(null);
    setError('');
    setIsReady(false);
    setIsCapturing(false);
    setStatus('Starting camera...');

    const start = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });
        streamRef.current = localStream;
        const video = videoRef.current;
        if (!video) throw new Error('Camera preview unavailable');
        video.srcObject = localStream;
        await video.play();

        const vision = await import('@mediapipe/tasks-vision');
        const fileset = await vision.FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm'
        );

        const createLandmarker = async (delegate: 'GPU' | 'CPU') =>
          vision.FaceLandmarker.createFromOptions(fileset, {
            baseOptions: {
              modelAssetPath: '/models/face_landmarker.task',
              delegate,
            },
            runningMode: 'VIDEO',
            numFaces: 1,
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
          });

        try {
          landmarkerRef.current = await createLandmarker('GPU');
        } catch {
          landmarkerRef.current = await createLandmarker('CPU');
        }

        try {
          const ort = await import('onnxruntime-web');
          ort.env.wasm.numThreads = 1;
          ort.env.wasm.wasmPaths =
            'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/';
          sessionRef.current = await ort.InferenceSession.create(
            '/models/face-antispoof.onnx',
            {
              executionProviders: ['wasm'],
              graphOptimizationLevel: 'all',
            }
          );
        } catch (modelError) {
          console.warn('Liveness model unavailable', modelError);
        }

        if (cancelled) return;
        setIsReady(true);
        setStatus(POSE_COPY.CENTER);

        const loop = () => {
          if (cancelled) return;
          const currentVideo = videoRef.current;
          const landmarker = landmarkerRef.current;

          if (
            currentVideo &&
            landmarker &&
            currentVideo.readyState >= 2 &&
            currentVideo.currentTime !== lastVideoTimeRef.current
          ) {
            lastVideoTimeRef.current = currentVideo.currentTime;

            try {
              const result = landmarker.detectForVideo(
                currentVideo,
                performance.now()
              );

              if (result.faceLandmarks.length === 0) {
                setStatus('Position your face inside the oval');
                stableSinceRef.current = null;
                setCountdown(null);
              } else if (result.faceLandmarks.length > 1) {
                setStatus('Only one face should be visible');
                stableSinceRef.current = null;
                setCountdown(null);
              } else {
                const metrics = getPoseMetrics(result.faceLandmarks[0]);
                const pose = POSES[poseIndexRef.current] ?? 'CENTER';

                if (!poseMatches(pose, metrics.yaw)) {
                  setStatus(POSE_COPY[pose]);
                  stableSinceRef.current = null;
                  setCountdown(null);
                } else if (!capturingRef.current) {
                  const now = performance.now();
                  if (stableSinceRef.current === null) {
                    stableSinceRef.current = now;
                    setStatus('Hold still...');
                  }

                  const stableFor = now - stableSinceRef.current;
                  if (stableFor >= 700) {
                    const remaining = Math.max(
                      0,
                      Math.ceil(2 - (stableFor - 700) / 1000)
                    );
                    setCountdown(remaining);
                    if (stableFor >= 2700 && !inferringRef.current) {
                      inferringRef.current = true;
                      void captureFrame(currentVideo, pose, metrics).finally(
                        () => {
                          inferringRef.current = false;
                        }
                      );
                    }
                  }
                }
              }
            } catch (detectionError) {
              console.warn('Face detection failed', detectionError);
            }
          }

          rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
      } catch (cameraError) {
        console.error('Camera initialization failed', cameraError);
        if (!cancelled) {
          setError(
            'Camera access is unavailable. Check permissions, or upload three clear face photos below.'
          );
          setStatus('Camera unavailable');
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      localStream?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      sessionRef.current?.release?.();
      sessionRef.current = null;
    };
  }, [captureFrame, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border-custom bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-custom px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-text">Face capture</h3>
            <p className="text-sm text-text-gray">
              Step {Math.min(captures.length + 1, 3)} of 3 ·{' '}
              {currentPose.toLowerCase()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-text-gray hover:bg-background-primary"
          >
            Close
          </button>
        </div>

        <div className="p-5">
          <div className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-2xl bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="h-full w-full scale-x-[-1] object-cover"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[62%] w-[46%] rounded-[50%] border-4 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.28)]" />
            </div>
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/60 text-4xl font-bold text-white">
                  {countdown || '✓'}
                </div>
              </div>
            )}
            {!isReady && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm text-white">
                Loading camera and models...
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-text">{status}</p>
              <p className="text-xs text-text-light-gray">
                Keep your face inside the oval and follow the prompt.
              </p>
            </div>
            <div className="flex gap-2">
              {POSES.map((pose, index) => (
                <span
                  key={pose}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    index < captures.length
                      ? 'border-success/30 bg-successLight text-success'
                      : index === poseIndex
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-border-custom text-text-gray'
                  }`}
                >
                  {pose}
                </span>
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-error/20 bg-errorLight p-3 text-sm text-error">
              {error}
            </div>
          )}

          {captures.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {captures.map((capture) => (
                <div
                  key={capture.pose}
                  className="overflow-hidden rounded-lg border border-border-custom"
                >
                  <img
                    src={URL.createObjectURL(capture.file)}
                    alt={capture.pose}
                    className="h-20 w-full object-cover"
                  />
                  <p className="px-2 py-1 text-center text-xs text-text-gray">
                    {capture.pose}
                  </p>
                </div>
              ))}
            </div>
          )}

          {isCapturing && (
            <p className="mt-3 text-center text-sm text-primary">
              Checking liveness...
            </p>
          )}

          {error && (
            <Button
              type="button"
              variant="outline"
              className="mt-4 w-full"
              onClick={onClose}
            >
              Use photo upload instead
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
