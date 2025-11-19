const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Allow CommonJS in API routes
  webpack: (config, { isServer, webpack }) => {
    // Add path resolution for absolute imports from project root
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.resolve(__dirname),
    ];
    
    // Add alias for easier imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    
    if (isServer) {
      // Handle better-sqlite3 native module
      config.externals = config.externals || [];
      config.externals.push({
        'better-sqlite3': 'commonjs better-sqlite3',
      });
      
      // Ignore native modules that can't be bundled
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Ignore warnings about native modules
    config.ignoreWarnings = [
      { module: /better-sqlite3/ },
      { file: /better-sqlite3/ },
    ];
    
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
  // Serverless function configuration
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

module.exports = nextConfig;

