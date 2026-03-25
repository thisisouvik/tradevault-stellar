'use client'

import { WalletProvider } from '@txnlab/use-wallet-react'
import { getWalletManager } from '@/lib/wallet'

export function Providers({ children }: { children: React.ReactNode }) {
  const manager = getWalletManager()
  
  return (
    <WalletProvider manager={manager}>
      {children}
    </WalletProvider>
  )
}
