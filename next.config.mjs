/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
    serverComponentsExternalPackages: [
      '@prisma/client',
      'ioredis',
      'bcryptjs',
    ],
  },
};

export default nextConfig;
