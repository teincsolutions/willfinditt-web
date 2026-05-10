import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.willfind8.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/reset-password',
        destination: '/auth/reset-password',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/cms-api/:path*',
        destination: 'https://directus.willfind8.com/:path*',
      },
    ];
  },
};

export default nextConfig;
