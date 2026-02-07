import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Note: Static export (output: 'export') is not compatible with Clerk auth
  // Capacitor will load from the live server URL instead
}

export default nextConfig
