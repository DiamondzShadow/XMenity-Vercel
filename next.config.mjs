/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Enable experimental features
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },

  // Environment variables that should be exposed to the browser
  env: {
    THIRDWEB_CLIENT_ID: process.env.THIRDWEB_CLIENT_ID,
    FACTORY_CONTRACT_ADDRESS: process.env.FACTORY_CONTRACT_ADDRESS,
    ARBITRUM_RPC_URL: process.env.ARBITRUM_RPC_URL,
    CHAIN_ID: process.env.CHAIN_ID,
    FRONTEND_URL: process.env.FRONTEND_URL,
  },

  // Image domains for external images
  images: {
    domains: [
      'pbs.twimg.com', // Twitter profile images
      'abs.twimg.com', // Twitter images
      'api.insightiq.ai', // InsightIQ images
      'staging.insightiq.ai', // InsightIQ staging
      'avatars.githubusercontent.com', // GitHub avatars
      'images.unsplash.com', // Unsplash images
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.twimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.insightiq.ai',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' blob:; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: wss:;",
          },
        ],
      },
    ];
  },

  // Webpack configuration for Web3 compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Handle ESM modules
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };

    return config;
  },

  // Transpile packages that need it
  transpilePackages: [
    'thirdweb',
    '@thirdweb-dev/sdk',
    '@thirdweb-dev/chains',
    '@rainbow-me/rainbowkit',
  ],

  // Compiler options
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Output configuration for deployment
  output: 'standalone',
  
  // PoweredByHeader
  poweredByHeader: false,

  // Redirects for better UX
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Rewrites for API routes
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

export default nextConfig;
