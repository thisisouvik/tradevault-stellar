import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: {
    default: 'TradeVault — Trustless Trade on Stellar',
    template: '%s | TradeVault',
  },
  description:
    'Replace a $240 bank letter of credit with a low-fee Stellar smart contract. Trade cross-border with zero trust required — the contract holds the money.',
  keywords: ['escrow', 'stellar', 'blockchain', 'trade', 'USDC', 'DeFi', 'smart contract'],
  openGraph: {
    title: 'TradeVault — Trustless Trade on Stellar',
    description: 'Decentralized escrow for cross-border trade. No banks. No middlemen.',
    type: 'website',
  },
  icons: {
    icon: '/logo.png',
  },
}

import { Providers } from '@/components/Providers'
import { Toaster } from 'react-hot-toast'
import { assertProductionEnv } from '@/lib/env'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  assertProductionEnv()

  return (
    <html lang="en" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#F0F2F5] text-[#6B7280]">
        <Providers>
          {children}
        </Providers>
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '8px',
              fontWeight: 500,
            },
            success: {
              style: {
                background: '#10B981',
                color: '#fff',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#10B981',
              },
            },
            error: {
              style: {
                background: '#EF4444',
                color: '#fff',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#EF4444',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
