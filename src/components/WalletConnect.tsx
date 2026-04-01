'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, LogOut, Copy, CheckCheck, QrCode, X, Monitor } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { setAllowed, isAllowed, getAddress, isConnected } from '@stellar/freighter-api'

interface WalletConnectProps {
  onConnect?: (address: string) => void
  showBalance?: boolean
}

export function WalletConnect({ onConnect, showBalance = true }: WalletConnectProps) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [balances, setBalances] = useState<{ xlm: string, usdc: string }>({ xlm: '0', usdc: '0' })

  // Modal states
  const [showModal, setShowModal] = useState(false)

  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => { setMounted(true) }, [])

  const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`
  const fetchBalances = async (addr: string) => {
    try {
      const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${addr}`)
      if (!res.ok) return
      const data = await res.json()
      let xlm = '0'
      let usdc = '0'
      
      data.balances?.forEach((b: any) => {
        if (b.asset_type === 'native') xlm = Number(b.balance).toFixed(2)
        else if (b.asset_code === 'USDC') usdc = Number(b.balance).toFixed(2)
      })
      setBalances({ xlm, usdc })
    } catch (e) {
      console.error("Failed to fetch balance", e)
    }
  }
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
        fetchBalances(profile.wallet_address)
        onConnect?.(profile.wallet_address)
      }
    })()
    return () => { ignore = true }
  }, [supabase, onConnect])

  async function handleFreighterConnect() {
    setError('')
    try {
      if (typeof window === 'undefined') return

      const isFreighterInstalled = await isConnected()
      if (!isFreighterInstalled) {
        setError('Freighter extension not installed. Install from https://www.freighter.app')
        return
      }

      await setAllowed()
      const publicKeyObj = await getAddress()
      const publicKey = typeof publicKeyObj === 'string' ? publicKeyObj : (publicKeyObj as any).address

      if (!publicKey || !/^G[A-Z2-7]{20,}$/.test(publicKey)) {
        setError('Invalid Stellar wallet returned from Freighter.')
        return
      }

      await saveWalletToProfile(publicKey)
      setWalletAddress(publicKey)
      fetchBalances(publicKey)
      onConnect?.(publicKey)
      
      // Close modal on success
      setShowModal(false)
    } catch (err: any) {
      setError(err?.message || 'Failed to connect Freighter. Make sure it\'s unlocked.')
    }
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

  function closeModal() {
    setShowModal(false)
    setTimeout(() => {
      setError('')
    }, 200)
  }

  // Already connected view
  if (mounted && walletAddress) {
    return (
      <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 rounded-xl min-w-0" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
        {showBalance && (
          <div className="hidden sm:flex items-center gap-2 pr-3 border-r border-[#4ade80]/20">
            <div className="flex flex-col text-[10px] sm:text-xs">
              <span className="text-[#05445E] font-semibold">{balances.xlm} XLM</span>
              <span className="text-slate-500 font-medium">{balances.usdc} USDC</span>
            </div>
          </div>
        )}
        <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />     
        <span className="text-xs sm:text-sm font-mono text-[#4ade80] font-medium truncate max-w-[88px] sm:max-w-none">{shortAddr(walletAddress)}</span>
        <div className="flex items-center gap-1 ml-0.5 sm:ml-1">
          <button onClick={copyAddress} className="p-1.5 rounded-lg text-[#8ca0b3] hover:text-[#4ade80] hover:bg-[#4ade80]/10 transition-colors" title="Copy address">
            {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <button onClick={handleDisconnect} className="p-1.5 rounded-lg text-[#8ca0b3] hover:text-red-400 hover:bg-red-400/10 transition-colors" title="Disconnect">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // Connect wallet UI (Modern Modal)
  return (
    <>
      <motion.button
        onClick={() => setShowModal(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white transition-all shadow-md hover:shadow-xl"
        style={{ background: 'linear-gradient(135deg, #189AB4, #05445E)' }}
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </motion.button>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-[#04101f]/40 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-sm mx-3 sm:mx-0 rounded-2xl sm:rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
                <h3 className="font-bold text-lg text-[#05445E]">
                  Connect Wallet
                </h3>
                <button
                  onClick={closeModal}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-6">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs font-medium rounded-xl border border-red-100">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={handleFreighterConnect}
                    className="w-full flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-slate-100 hover:border-[#189AB4] hover:bg-teal-50/30 transition-all group text-left"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#189AB4] group-hover:text-white transition-colors text-[#05445E]">
                      <Monitor className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                        <div className="font-bold text-slate-900 group-hover:text-[#05445E] transition-colors">
                          Browser Extension
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          Freighter Chrome Extension
                        </div>
                      </div>
                    </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default WalletConnect
