import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
};

export default nextConfig;
