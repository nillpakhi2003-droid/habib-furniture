/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const rawOrigins =
  process.env.NEXT_ALLOWED_ORIGINS ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (isProd ? '' : 'http://localhost:10000');

const allowedOrigins = rawOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0 && isProd) {
  console.warn('NEXT_ALLOWED_ORIGINS is not set; server actions will reject requests.');
}

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Allow large image uploads (up to 50MB)
      allowedOrigins,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
    unoptimized: false,
  },
};

module.exports = nextConfig;
