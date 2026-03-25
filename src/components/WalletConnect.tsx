'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Wallet, LogOut, Copy, CheckCheck, ExternalLink } from 'lucide-react'
import { useWallet } from '@txnlab/use-wallet-react'
import { createClient } from '@/lib/supabase/client'

interface WalletConnectProps {
  onConnect?: (address: string) => void
}

export function WalletConnect({ onConnect }: WalletConnectProps) {
  const { wallets, activeWallet, activeAddress } = useWallet()
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [balance, setBalance] = useState<{ algo: string; usdc: string } | null>(null)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  // Prevent SSR/client hydration mismatch — wallet state is client-only
  useEffect(() => { setMounted(true) }, [])

  const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  const saveWalletToProfile = useCallback(async (addr: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ wallet_address: addr }).eq('id', user.id)
  }, [supabase])

  // Call onConnect and save to DB when a wallet connects
  useEffect(() => {
    if (activeAddress) {
      saveWalletToProfile(activeAddress)
      onConnect?.(activeAddress)
      setShowPicker(false)

      // Fetch balances
      fetch(`https://testnet-api.algonode.cloud/v2/accounts/${activeAddress}`)
        .then(res => res.json())
        .then(data => {
          let algo = '0.00'
          let usdc = '0.00'
          if (data.amount !== undefined) {
            algo = (data.amount / 1_000_000).toFixed(2)
          }
          if (data.assets) {
            const usdcAsset = data.assets.find((a: any) => a['asset-id'] === 10458941)
            if (usdcAsset) {
              usdc = (usdcAsset.amount / 1_000_000).toFixed(2)
            }
          }
          setBalance({ algo, usdc })
        })
        .catch(console.error)
    } else {
      setBalance(null)
    }
  }, [activeAddress, saveWalletToProfile, onConnect])

  function copyAddress() {
    if (!activeAddress) return
    navigator.clipboard.writeText(activeAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Already connected view (only render after client mount to avoid hydration mismatch)
  if (mounted && activeAddress) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
        <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
        <span className="text-sm font-mono text-[#4ade80] font-medium">{shortAddr(activeAddress)}</span>

        {balance && (
          <div className="flex items-center gap-2 ml-2 pl-3 border-l border-[#4ade80]/30 text-xs font-bold text-[#4ade80]">
            <span>{balance.usdc} USDC</span>
            <span className="opacity-60">|</span>
            <span className="opacity-80">{balance.algo} ALGO</span>
          </div>
        )}

        <div className="flex items-center gap-1 ml-2">
          <button onClick={copyAddress} className="p-1 rounded-lg text-[#8ca0b3] hover:text-[#4ade80] transition-colors" title="Copy address">
            {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <a href={`https://lora.algokit.io/testnet/account/${activeAddress}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded-lg text-[#8ca0b3] hover:text-[#4ade80] transition-colors" title="View on explorer">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button onClick={() => activeWallet?.disconnect()} className="p-1 rounded-lg text-[#8ca0b3] hover:text-red-400 transition-colors" title="Disconnect">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  // Picker Modal
  return (
    <div className="relative">
      <motion.button
        onClick={() => setShowPicker(!showPicker)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#04101f] transition-all"
        style={{
          background: 'linear-gradient(135deg, #4ade80, #22c55e)',
          boxShadow: '0 0 20px rgba(74,222,128,0.25)',
        }}
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </motion.button>

      {showPicker && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl shadow-gray-200/50 border border-gray-100 p-2 z-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2 mt-2">Select a Wallet</p>
          <div className="space-y-1">
            {wallets.map(wallet => (
              <button
                key={wallet.id}
                onClick={() => {
                  wallet.connect()
                  setShowPicker(false)
                }}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shadow-sm p-1">
                    <img src={wallet.metadata.icon} alt={wallet.metadata.name} className="w-full h-full object-contain" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{wallet.metadata.name}</span>
                </div>
                {wallet.isActive && <div className="w-2 h-2 rounded-full bg-green-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
    </div>
  )
}
