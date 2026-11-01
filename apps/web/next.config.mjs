/** @type {import('next').NextConfig} */
const API_URL = process.env.API_URL || 'http://localhost:4000';

const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['node:sqlite'],
  async rewrites() {
    return [
      {
        source: '/v1/:path*',
        destination: `${API_URL}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
