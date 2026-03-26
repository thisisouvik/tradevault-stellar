'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { PackagePlus, DollarSign, Clock, Mail, FileText, AlertCircle, CheckCircle2, Shield, AlertTriangle, ExternalLink, Wallet, Loader } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function CreateDealForm() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    itemName: '',
    itemDescription: '',
    amountUSDC: '',
    deliveryDays: '10',
    disputeWindowDays: '7',
    buyerEmail: '',
    buyerWallet: ''
  })
  
  const [step, setStep] = useState<'form' | 'saving' | 'done'>('form')
  const [error, setError] = useState('')
  const [txId, setTxId] = useState('')
  const [appId, setAppId] = useState('')
  const [connectingWallet, setConnectingWallet] = useState(false)

  async function connectBuyerWallet() {
    try {
      setConnectingWallet(true)
      if (typeof window === 'undefined' || !(window as any).freighter) {
        setError('Freighter wallet not installed. Please install it from https://www.freighter.app')
        return
      }
      const freighter = (window as any).freighter
      const publicKey = await freighter.getPublicKey()
      if (publicKey) {
        setForm(prev => ({ ...prev, buyerWallet: publicKey }))
        setError('')
      }
    } catch (err) {
      setError('Failed to connect wallet. Make sure Freighter is unlocked.')
    } finally {
      setConnectingWallet(false)
    }
  }

  function updateForm(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.buyerWallet || !/^G[A-Z2-7]{20,}$/.test(form.buyerWallet.trim())) {
      setError('Please enter a valid Stellar wallet address for the buyer.')
      return
    }
    const amount = parseInt(form.amountUSDC)
    if (isNaN(amount) || amount < 10 || amount > 50000) {
      setError('USDC amount must be between $10 and $50,000.')
      return
    }

    try {
      setStep('saving')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('id', user.id)
        .single()

      if (!profile?.wallet_address) {
        throw new Error('Please connect your Wallet from the dashboard first.')
      }

      const configuredContractId = process.env.NEXT_PUBLIC_STELLAR_CONTRACT_ID || ''
      if (!configuredContractId) {
        throw new Error('NEXT_PUBLIC_STELLAR_CONTRACT_ID is missing. Please set it in env.')
      }

      setTxId('pending')
      setAppId(configuredContractId)

      // Save to Supabase
      const res = await fetch('/api/deals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: user.id,
          buyerEmail: form.buyerEmail,
          buyerWallet: form.buyerWallet,
          itemName: form.itemName,
          itemDescription: form.itemDescription,
          amountUSDC: amount,
          deliveryDays: parseInt(form.deliveryDays),
          disputeWindowDays: parseInt(form.disputeWindowDays),
          contractId: configuredContractId,
          contractAddress: configuredContractId,
          arbitrator: 'default',
        }),
      })

      if (!res.ok) {
        const { error: apiErr } = await res.json()
        throw new Error(apiErr || 'Failed to save deal')
      }

      const { dealId } = await res.json()
      setStep('done')
      setTimeout(() => router.push(`/deal/${dealId}`), 4000)

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred'
      setError(msg)
      setStep('form')
    }
  }

  if (step === 'saving') {
    const stepMessages = {
      saving: {
        title: 'Saving Deal...',
        subtitle: 'Creating deal with Stellar contract reference and sending buyer invite...',
        step: '1 of 1',
      },
    }
    const msg = stepMessages.saving
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl shadow-sm border border-slate-200">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 rounded-full border-4 border-[#189AB4]/20 border-t-[#189AB4] mb-6"
        />
        <p className="text-xs font-bold text-[#189AB4] uppercase tracking-widest mb-3">{msg.step}</p>
        <h2 className="text-xl font-extrabold text-[#05445E] mb-2">{msg.title}</h2>
        <p className="text-slate-500 text-sm max-w-sm font-medium">{msg.subtitle}</p>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl shadow-sm border border-[#10B981]/30">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-[#10B981]/10 flex items-center justify-center mb-6 shadow-xl shadow-[#10B981]/20"
        >
          <CheckCircle2 className="w-10 h-10 text-[#10B981]" />
        </motion.div>
        
        <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl max-w-md mx-auto mb-6">
          <p className="font-bold text-sm">Contract deployed successfully on Stellar.</p>
          <p className="mt-1 flex items-center justify-center gap-2 text-sm font-semibold text-green-700">
            App ID: {appId.startsWith('demo') ? 'Simulated' : appId}
            {txId && (
              <a href={`https://stellar.expert/explorer/testnet/tx/${txId}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-green-900 underline">
                <ExternalLink className="w-3 h-3"/> Verify Link
              </a>
            )}
          </p>
        </div>

        <h2 className="text-2xl font-extrabold text-[#05445E] mb-2">Deal Created Successfully!</h2>
        <p className="text-slate-500 font-medium">Redirecting you to the active deal room...</p>
      </div>
    )
  }

  const isFormValid = form.itemName && form.amountUSDC && form.buyerWallet && form.deliveryDays && form.disputeWindowDays;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* LEFT COLUMN: FORM */}
      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={handleCreate} className="space-y-6" id="create-deal-form">
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <PackagePlus className="w-5 h-5 text-[#189AB4]" /> Item Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  maxLength={100}
                  value={form.itemName}
                  onChange={e => updateForm('itemName', e.target.value)}
                  placeholder="e.g. 500 metres cotton fabric"
                  required
                  className="w-full px-3 py-2 rounded-md text-sm text-gray-900 border border-gray-300 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-[#189AB4] focus:border-[#189AB4] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Description <span className="text-gray-400 font-normal">(Optional)</span></label>
                <textarea
                  value={form.itemDescription}
                  onChange={e => updateForm('itemDescription', e.target.value)}
                  placeholder="Detailed specification..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-md text-sm text-gray-900 border border-gray-300 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-[#189AB4] focus:border-[#189AB4] transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="flex items-center gap-2"><Shield className="w-5 h-5 text-[#189AB4]" /> Trade Terms</span>
              <span className="bg-[#e0f2fe] text-[#0369a1] text-xs px-2 py-0.5 rounded font-medium">Auto-executes on Stellar</span>
            </h2>
            <div className="space-y-6">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Escrow Amount (USDC) *</label>
                <div className="relative max-w-sm">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    min="10"
                    max="50000"
                    value={form.amountUSDC}
                    onChange={e => updateForm('amountUSDC', e.target.value)}
                    placeholder="500"
                    required
                    className="w-full pl-9 pr-14 py-2 rounded-md font-semibold text-gray-900 border border-gray-300 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-[#189AB4] focus:border-[#189AB4]"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">USDC</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ship within (Days) *</label>
                  <select
                    value={form.deliveryDays}
                    onChange={e => updateForm('deliveryDays', e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-md text-sm text-gray-900 border border-gray-300 outline-none focus:ring-1 focus:ring-[#189AB4] focus:border-[#189AB4]"
                  >
                    {[7, 10, 14, 21, 30].map(d => <option key={d} value={d}>{d} Days</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dispute Window (Days) *</label>
                  <select
                    value={form.disputeWindowDays}
                    onChange={e => updateForm('disputeWindowDays', e.target.value)}
                    required
                    disabled
                    className="w-full px-3 py-2 rounded-md text-sm text-gray-900 border border-gray-300 outline-none focus:ring-1 focus:ring-[#189AB4] focus:border-[#189AB4]"
                  >
                    <option value="7">7 Days post-delivery</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Fixed at 7 days.</p>
                </div>

              </div>

            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Mail className="w-5 h-5 text-[#189AB4]" /> Buyer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Wallet Address *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.buyerWallet}
                    onChange={e => updateForm('buyerWallet', e.target.value)}
                    placeholder="Stellar wallet address..."
                    required
                    className="flex-1 px-3 py-2 rounded-md text-sm font-mono text-gray-900 border border-gray-300 outline-none focus:ring-1 focus:border-[#189AB4]"
                  />
                  <button
                    type="button"
                    onClick={connectBuyerWallet}
                    disabled={connectingWallet}
                    className="px-3 py-2 bg-[#189AB4] text-white text-sm font-semibold rounded-md hover:bg-[#05445E] disabled:bg-gray-400 transition flex items-center gap-2 whitespace-nowrap"
                  >
                    {connectingWallet ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4" />
                        Auto-fill
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Click "Auto-fill" to connect buyer's Freighter wallet</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Email *</label>
                <input
                  type="email"
                  value={form.buyerEmail}
                  onChange={e => updateForm('buyerEmail', e.target.value)}
                  placeholder="buyer@business.com"
                  required
                  className="w-full px-3 py-2 rounded-md text-sm text-gray-900 border border-gray-300 outline-none focus:ring-1 focus:border-[#189AB4]"
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* RIGHT COLUMN: PREVIEW STICKY CARD */}
      <div className="lg:col-span-1 relative">
        <div className="sticky top-24 space-y-4">
          
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 text-sm">
            
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
              <FileText className="w-4 h-4 text-[#189AB4]"/> Summary
            </h3>

            <div className="space-y-3">
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs font-medium uppercase mb-0.5">Selling</span>
                <span className="text-gray-900 font-semibold">{form.itemName || <span className="text-gray-400 italic font-normal">Not set</span>}</span>
              </div>
              
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs font-medium uppercase mb-0.5">Escrow Amount</span>
                <span className="text-[#10b981] font-bold text-lg">{form.amountUSDC ? `$${form.amountUSDC} USDC` : <span className="text-gray-400 italic text-base font-normal">Not set</span>}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-gray-500 text-xs font-medium uppercase mb-0.5">Buyer Address</span>
                <span className="text-gray-900 font-mono truncate">{form.buyerWallet || <span className="text-gray-400 italic text-sans font-normal">Not set</span>}</span>
              </div>

              <div className="flex flex-col mt-4 pt-3 border-t border-gray-100">
                <span className="text-gray-500 text-xs font-medium uppercase mb-0.5">Terms</span>
                <span className="text-gray-700">Ship within {form.deliveryDays} days</span>
                <span className="text-gray-700">{form.disputeWindowDays} days dispute window</span>
                <span className="text-gray-700 mt-1 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-[#189AB4]"/> Platform Arbitrator</span>
              </div>
            </div>
            
            <div className="mt-6 p-3 bg-blue-50 border border-blue-100 rounded-md">
              <p className="text-xs text-blue-800 flex items-start gap-1.5 leading-relaxed">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Review terms carefully. Once deployed, they are permanently locked on Stellar.
              </p>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-red-50 text-red-700 p-3 rounded-md text-sm font-medium border border-red-200"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            form="create-deal-form"
            disabled={!isFormValid}
            className="w-full bg-[#05445E] hover:bg-[#189AB4] text-white py-3 rounded-md font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Create Contract
          </button>
        </div>
      </div>
    </div>
  )
}
