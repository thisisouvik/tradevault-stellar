'use client'

import { motion } from 'framer-motion'
import { WalletConnect } from '@/components/WalletConnect'
import { ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  isOpen: boolean
}

export function WalletRequiredModal({ isOpen }: Props) {
  const router = useRouter()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop (strong blur to obscure background content) */}
      <div className="absolute inset-0 bg-[#04101f]/60 backdrop-blur-md" />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white max-w-sm w-full rounded-[24px] shadow-2xl relative z-10 overflow-hidden flex flex-col items-center p-8 text-center"
      >
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <h3 className="text-xl font-bold text-slate-900 mb-2">Connect Your Wallet</h3>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          You need to connect an active Stellar wallet (like Freighter) before you can proceed and use the dashboard.
        </p>

        <div className="w-full flex justify-center mb-4">
          <WalletConnect onConnect={(address) => {
            // Once connected, refresh the page to remove the modal
            router.refresh()
          }} />
        </div>
      </motion.div>
    </div>
  )
}
