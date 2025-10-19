/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prisma client should be bundled externally
  serverExternalPackages: ['@prisma/client'],
  
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yahoofantasysports.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's.yimg.com',
        pathname: '/**',
      }
    ],
  },
  
  // Optimize package imports
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
  
  // Production optimizations
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'chart.js', 'react-chartjs-2'],
  },
}

module.exports = nextConfig
