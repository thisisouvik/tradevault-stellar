'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Wallet, LogOut, Copy, CheckCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface WalletConnectProps {
  onConnect?: (address: string) => void
}

export function WalletConnect({ onConnect }: WalletConnectProps) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [inputValue, setInputValue] = useState('')
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

  // Load existing wallet from profile
  useEffect(() => {
    let ignore = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || ignore) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('id', user.id)
        .single()
      if (profile?.wallet_address && !ignore) {
        setWalletAddress(profile.wallet_address)
        onConnect?.(profile.wallet_address)
      }
    })()

    return () => { ignore = true }
  }, [supabase, onConnect])

  async function handleConnect() {
    setError('')
    const addr = inputValue.trim()
    if (!/^G[A-Z2-7]{20,}$/.test(addr)) {
      setError('Enter a valid Stellar wallet address.')
      return
    }

    await saveWalletToProfile(addr)
    setWalletAddress(addr)
    onConnect?.(addr)
    setInputValue('')
    setShowInput(false)
  }

  async function handleDisconnect() {
    setError('')
    await saveWalletToProfile('')
    setWalletAddress('')
  }

  function copyAddress() {
    if (!walletAddress) return
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Already connected view (only render after client mount to avoid hydration mismatch)
  if (mounted && walletAddress) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
        <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
        <span className="text-sm font-mono text-[#4ade80] font-medium">{shortAddr(walletAddress)}</span>

        <div className="flex items-center gap-1 ml-2">
          <button onClick={copyAddress} className="p-1 rounded-lg text-[#8ca0b3] hover:text-[#4ade80] transition-colors" title="Copy address">
            {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleDisconnect} className="p-1 rounded-lg text-[#8ca0b3] hover:text-red-400 transition-colors" title="Disconnect">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  // Manual wallet connect
  return (
    <div className="relative">
      <motion.button
        onClick={() => setShowInput(!showInput)}
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

      {showInput && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl shadow-gray-200/50 border border-gray-100 p-2 z-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2 mt-2">Enter Stellar Wallet</p>
          <div className="space-y-2 px-2 pb-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="G..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
            />
            <button
              onClick={handleConnect}
              className="w-full px-3 py-2 rounded-lg bg-[#05445E] text-white text-sm font-semibold hover:bg-[#189AB4]"
            >
              Save Wallet
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
    </div>
  )
}
