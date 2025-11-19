/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Allow CommonJS in API routes
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't externalize better-sqlite3 for Vercel deployment
      // Vercel will handle native module compilation
    }
    return config;
  },
  // Allow external images
  images: {
    domains: ['images.unsplash.com', 'unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

module.exports = nextConfig;

