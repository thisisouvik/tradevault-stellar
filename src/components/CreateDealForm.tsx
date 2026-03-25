'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { PackagePlus, DollarSign, Clock, Mail, FileText, AlertCircle, CheckCircle2, Shield, AlertTriangle, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWallet } from '@txnlab/use-wallet-react'
import { algodClient } from '@/lib/algorand'
import algosdk from 'algosdk'

export default function CreateDealForm() {
  const router = useRouter()
  const supabase = createClient()
  const { activeAddress, signTransactions } = useWallet()

  const [form, setForm] = useState({
    itemName: '',
    itemDescription: '',
    amountUSDC: '',
    deliveryDays: '10',
    disputeWindowDays: '7',
    buyerEmail: '',
    buyerWallet: ''
  })
  
  const [step, setStep] = useState<'form' | 'deploying' | 'bootstrapping' | 'saving' | 'done'>('form')
  const [error, setError] = useState('')
  const [txId, setTxId] = useState('')
  const [appId, setAppId] = useState('')

  function updateForm(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.buyerWallet || !algosdk.isValidAddress(form.buyerWallet)) {
      setError('Please enter a valid Algorand wallet address for the buyer.')
      return
    }
    const amount = parseInt(form.amountUSDC)
    if (isNaN(amount) || amount < 10 || amount > 50000) {
      setError('USDC amount must be between $10 and $50,000.')
      return
    }

    try {
      setStep('deploying')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('id', user.id)
        .single()

      if (!profile?.wallet_address || !activeAddress) {
        throw new Error('Please connect your Wallet from the dashboard first.')
      }

      // Build contract creation transaction
      const sellerAddress = activeAddress
      const params = await algodClient.getTransactionParams().do()
      params.flatFee = true
      params.fee = BigInt(1000) // explicit minimum fee
      const amountMicro = amount * 1_000_000

      // Approval program compiled from approval.teal
      // bootstrap() in this version allows platform wallet (anyone) to call it
      // so sellers only need ONE wallet approval — the platform handles opt-in automatically
      const APPROVAL_PROGRAM = new Uint8Array([10,32,9,1,0,4,189,174,254,4,232,7,3,5,2,100,38,8,5,115,116,97,116,101,6,115,101,108,108,101,114,5,98,117,121,101,114,6,97,109,111,117,110,116,11,100,105,115,112,117,116,101,95,101,110,100,8,100,101,97,100,108,105,110,101,12,100,101,108,105,118,101,114,101,100,95,97,116,13,116,114,97,99,107,105,110,103,95,104,97,115,104,49,24,35,18,64,0,31,49,25,35,18,64,0,72,49,25,34,18,64,0,9,49,25,33,6,18,64,0,3,0,34,67,49,0,50,9,18,67,40,35,103,41,49,0,103,42,54,26,0,103,43,54,26,1,23,103,39,5,50,7,54,26,2,23,129,128,163,5,11,8,103,39,4,35,103,39,6,35,103,39,7,128,0,103,34,67,54,26,0,128,6,97,99,99,101,112,116,18,64,0,191,54,26,0,128,4,102,117,110,100,18,64,0,200,54,26,0,128,15,115,117,98,109,105,116,95,100,101,108,105,118,101,114,121,18,64,0,193,54,26,0,128,7,99,111,110,102,105,114,109,18,64,0,217,54,26,0,128,15,116,105,109,101,111,117,116,95,114,101,108,101,97,115,101,18,64,0,230,54,26,0,128,7,100,105,115,112,117,116,101,18,64,0,252,54,26,0,128,15,114,101,115,111,108,118,101,95,100,105,115,112,117,116,101,18,64,0,253,54,26,0,128,9,98,111,111,116,115,116,114,97,112,18,64,0,1,0,41,100,50,3,19,68,50,4,33,7,18,68,51,0,16,34,18,68,51,0,7,50,10,18,68,51,0,8,129,192,154,12,15,68,177,36,178,16,37,178,17,50,10,178,20,35,178,18,33,4,178,1,179,34,67,49,0,42,100,18,68,40,100,35,18,68,41,100,50,3,19,68,40,34,103,34,67,49,0,42,100,18,68,40,100,34,18,68,40,33,7,103,34,67,40,100,33,7,18,68,50,7,39,5,100,14,68,39,7,54,26,1,103,39,6,50,7,103,39,4,50,7,129,128,245,36,8,103,40,33,5,103,34,67,49,0,42,100,18,68,40,100,33,5,18,68,177,36,178,16,37,178,17,41,100,178,20,43,100,178,18,33,4,178,1,179,40,36,103,34,67,40,100,33,5,18,68,50,7,39,4,100,13,68,177,36,178,16,37,178,17,41,100,178,20,43,100,178,18,33,4,178,1,179,40,36,103,34,67,49,0,42,100,18,68,40,100,33,5,18,68,50,7,39,4,100,14,68,40,33,6,103,34,67,40,100,33,6,18,68,54,26,1,23,54,26,2,23,8,33,8,18,68,43,100,54,26,1,23,11,33,8,10,53,0,43,100,52,0,9,53,1,52,0,35,13,65,0,20,177,36,178,16,37,178,17,41,100,178,20,52,0,178,18,33,4,178,1,179,52,1,35,13,65,0,20,177,36,178,16,37,178,17,42,100,178,20,52,1,178,18,33,4,178,1,179,40,129,6,103,34,67])
      const CLEAR_PROGRAM = new Uint8Array([10, 129, 1, 67])

      const appCreateTxn = algosdk.makeApplicationCreateTxnFromObject({
        sender: sellerAddress,
        suggestedParams: params,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        approvalProgram: APPROVAL_PROGRAM,
        clearProgram: CLEAR_PROGRAM,
        numLocalInts: 0,
        numLocalByteSlices: 0,
        numGlobalInts: 6,
        numGlobalByteSlices: 3,
        // propose() args: buyer_addr (32 bytes), amount_micro, deadline_days
        appArgs: [
          algosdk.decodeAddress(form.buyerWallet).publicKey,  // arg1: buyer address
          algosdk.encodeUint64(amountMicro),                  // arg2: amount in micro-USDC
          algosdk.encodeUint64(parseInt(form.deliveryDays)),  // arg3: deadline days
        ],
        note: new TextEncoder().encode(
          JSON.stringify({ buyer: form.buyerWallet, item: form.itemName })
        ),
      })

      // Sign & submit — pass Transaction objects (not raw bytes) so Pera shows the signing popup
      const signedCreate = await signTransactions([appCreateTxn])
      const validCreate = signedCreate.filter((tx): tx is Uint8Array => tx !== null)
      const { txid } = await algodClient.sendRawTransaction(validCreate).do()
      setTxId(txid)

      const confirmation = await algosdk.waitForConfirmation(algodClient, txid, 4)
      const newAppId = confirmation.applicationIndex?.toString() || `demo-${Date.now()}`
      setAppId(newAppId)

      const appAddress = newAppId !== `demo-${Date.now()}`
        ? algosdk.getApplicationAddress(parseInt(newAppId)).toString()
        : `APP_ADDR_${newAppId}`

      // ── Step 2: Seller pays MBR + opts contract into USDC ──────────────
      // Algorand requires every account to opt into an ASA before receiving it.
      // Seller signs an atomic group:
      //   txn[0] → Pay 0.202 ALGO → app address  (covers MBR + inner tx fee)
      //   txn[1] → bootstrap() app call           (inner tx opts app into USDC)
      if (newAppId && !newAppId.startsWith('demo')) {
        setStep('bootstrapping')
        const freshParams = await algodClient.getTransactionParams().do()
        freshParams.flatFee = true
        freshParams.fee = BigInt(1000)

        const mbrPayTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          sender: sellerAddress,
          receiver: appAddress,
          amount: 202_000, // 0.202 ALGO: base MBR(100k) + ASA MBR(100k) + fees
          suggestedParams: freshParams,
          note: new TextEncoder().encode('TradeVault:MBR'),
        })

        const bootstrapTxn = algosdk.makeApplicationCallTxnFromObject({
          sender: sellerAddress,
          appIndex: parseInt(newAppId),
          onComplete: algosdk.OnApplicationComplete.NoOpOC,
          appArgs: [new TextEncoder().encode('bootstrap')],
          foreignAssets: [10458941],
          suggestedParams: freshParams,
        })

        algosdk.assignGroupID([mbrPayTxn, bootstrapTxn])

        const signedBootstrap = await signTransactions([mbrPayTxn, bootstrapTxn])
        const validBootstrap = signedBootstrap.filter((tx): tx is Uint8Array => tx !== null)
        const { txid: bootstrapTxid } = await algodClient.sendRawTransaction(validBootstrap).do()
        await algosdk.waitForConfirmation(algodClient, bootstrapTxid, 4)
      }

      setStep('saving')

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
          contractAppId: newAppId,
          contractAddress: appAddress,
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

  if (step === 'deploying' || step === 'bootstrapping' || step === 'saving') {
    const stepMessages = {
      deploying: {
        title: 'Deploying Contract...',
        subtitle: 'Approve in your wallet — deploys the escrow smart contract with your deal terms on-chain.',
        step: '1 of 3',
      },
      bootstrapping: {
        title: 'Activate Escrow Account...',
        subtitle: 'Approve in your wallet — pays a small deposit (0.202 ALGO) to activate the escrow so it can hold USDC.',
        step: '2 of 3',
      },
      saving: {
        title: 'Saving Deal...',
        subtitle: 'All done on-chain. Saving deal and sending buyer invite...',
        step: '3 of 3',
      },
    }
    const msg = stepMessages[step]
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
              <a href={`https://lora.algokit.io/testnet/transaction/${txId}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-green-900 underline">
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
                <input
                  type="text"
                  value={form.buyerWallet}
                  onChange={e => updateForm('buyerWallet', e.target.value)}
                  placeholder="Stellar wallet address..."
                  required
                  className="w-full px-3 py-2 rounded-md text-sm font-mono text-gray-900 border border-gray-300 outline-none focus:ring-1 focus:border-[#189AB4]"
                />
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
