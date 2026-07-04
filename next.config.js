/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  // Bakes env vars from .env.local at build time → available in Cloud Function at runtime
  // Firebase runs `next build` locally, so .env.local IS read during deploy
  env: {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
    // Auto-detect prod vs local — next build always runs with NODE_ENV=production
    GOOGLE_REDIRECT_URI:
      process.env.GOOGLE_REDIRECT_URI ||
      (process.env.NODE_ENV === 'production'
        ? 'https://flow.rankerize.com/api/auth/google/callback'
        : 'http://localhost:1015/api/auth/google/callback'),
    SESSION_SECRET: process.env.SESSION_SECRET || 'rankerize-flow-dev-secret',
    DASHBOARD_PASSWORD: process.env.DASHBOARD_PASSWORD || '',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    META_CLIENT_ID: process.env.META_CLIENT_ID || '',
    META_CLIENT_SECRET: process.env.META_CLIENT_SECRET || '',
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  },
  async rewrites() {
    return {
      fallback: [
        {
          source: '/:path*',
          destination: `https://wp.rankerize.com/:path*`,
        },
      ],
    };
  },
}

module.exports = nextConfig
