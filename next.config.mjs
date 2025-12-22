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
  // Log at build time so deployments notice missing config
  console.warn('NEXT_ALLOWED_ORIGINS is not set; server actions will reject requests.');
}

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increased for image uploads
      // Explicitly list allowed origins; configure NEXT_ALLOWED_ORIGINS (comma-separated) in production
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
    // Allow local images
    unoptimized: false,
  },
};

export default nextConfig;
