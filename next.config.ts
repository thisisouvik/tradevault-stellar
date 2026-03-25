import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Stub out Web3Auth packages we don't use.
    // @txnlab/use-wallet includes lazy imports for many wallet providers;
    // without this, Next.js fails to compile even for wallets we don't enable.
    const stub = path.resolve(__dirname, 'src/lib/emptyModule.js')
    config.resolve.alias = {
      ...config.resolve.alias,
      '@web3auth/base': stub,
      '@web3auth/base-provider': stub,
      '@web3auth/modal': stub,
      '@web3auth/single-factor-auth': stub,
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

export default nextConfig

