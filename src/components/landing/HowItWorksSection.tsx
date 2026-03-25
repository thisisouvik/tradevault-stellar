'use client'

import { motion } from 'framer-motion'
import {
  FileText, Wallet, Truck, CheckCircle2, AlertTriangle, Scale,
  Zap, Camera, ShieldCheck, ArrowRight
} from 'lucide-react'

const steps = [
  {
    number: '01',
    actor: 'Seller',
    actorColor: '#05445E',
    accentColor: '#189AB4',
    icon: FileText,
    title: 'Create the smart contract',
    description:
      'Fill in trade terms — item name, price in USDC, delivery deadline, dispute window, and the buyer\'s email or wallet. One click deploys a tamper-proof escrow directly to the Stellar blockchain. Terms are cryptographically sealed from this moment.',
    tag: 'PROPOSED',
    tagColor: '#64748b',
    highlights: ['Item details & USDC amount', 'Delivery & dispute window', 'Deployed to Stellar'],
  },
  {
    number: '02',
    actor: 'Buyer',
    actorColor: '#7C3AED',
    accentColor: '#8B5CF6',
    icon: Wallet,
    title: 'Accept & lock funds atomically',
    description:
      'Open the contract link, connect your Stellar wallet, and click "Accept & Fund." Three coordinated actions execute together — your signed acceptance, a deal lock confirmation, and the USDC transfer to escrow. All three succeed together, or none do.',
    tag: 'FUNDED',
    tagColor: '#8B5CF6',
    highlights: ['Three atomic transactions', 'USDC locked in contract', 'Funds 100% protected'],
  },
  {
    number: '03',
    actor: 'Seller',
    actorColor: '#05445E',
    accentColor: '#0EA5E9',
    icon: Truck,
    title: 'Ship goods & submit proof',
    description:
      'Ship the goods and submit delivery proof from your dashboard. Choose between a standard courier (enter tracking number + carrier name + up to 3 photo evidence images) or select "Instant Delivery" for in-person handovers — which auto-generates a unique handover ID, skipping courier validation entirely.',
    tag: 'DELIVERED',
    tagColor: '#F59E0B',
    highlights: ['Courier tracking or Instant Delivery', 'Up to 3 proof images', 'SHA256 hash stored on-chain'],
    specialBadge: { label: '⚡ Instant Delivery available', color: '#F59E0B' },
  },
  {
    number: '04',
    actor: 'Buyer',
    actorColor: '#7C3AED',
    accentColor: '#10B981',
    icon: CheckCircle2,
    title: 'Confirm receipt & release payment',
    description:
      'Goods arrived in agreed condition? Click "Confirm Receipt." The smart contract instantly transfers the full USDC amount to the seller\'s wallet. Stellar network fees are minimal, and the contract is permanently archived on-chain as immutable proof of trade.',
    tag: 'COMPLETED',
    tagColor: '#10B981',
    highlights: ['One-click USDC release', 'Instant on-chain settlement', 'Permanent trade record'],
  },
]

const disputeFlow = [
  {
    icon: AlertTriangle,
    color: '#EF4444',
    bg: '#FEF2F2',
    border: '#FECACA',
    label: 'Buyer raises dispute',
    desc: 'Within the dispute window, buyer freezes funds and submits photo evidence (up to 3 images).',
  },
  {
    icon: Camera,
    color: '#F59E0B',
    bg: '#FFFBEB',
    border: '#FDE68A',
    label: 'Both parties submit evidence',
    desc: 'Seller\'s shipping proof is already on record. Buyer supplements with their own images showing the issue.',
  },
  {
    icon: Scale,
    color: '#8B5CF6',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    label: 'Arbitrator reviews & rules',
    desc: 'An independent arbitrator reviews all evidence and enters a proportional split verdict (e.g. 70/30).',
  },
  {
    icon: ShieldCheck,
    color: '#10B981',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    label: 'Smart contract executes split',
    desc: 'The contract atomically distributes USDC to both wallets per the verdict, on-chain and irreversible.',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 relative overflow-hidden bg-white border-b border-[#189AB4]/10">

      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #189AB4, transparent)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #05445E, transparent)' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-5 bg-[#189AB4]/10 border border-[#189AB4]/20 text-[#189AB4] uppercase tracking-wider"
          >
            Complete Trade Flow
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold text-[#05445E] mb-5 leading-tight"
          >
            From proposal to payment{' '}
            <span className="text-[#189AB4]">in 4 steps.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-[#3a7fa0] text-lg leading-relaxed"
          >
            No banks. No wire transfers. No trust required. Every step is cryptographically verified and permanently recorded on the Stellar blockchain.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="relative max-w-5xl mx-auto">

          {/* Vertical connector line */}
          <div className="hidden sm:block absolute left-[27px] top-14 bottom-14 w-0.5 bg-gradient-to-b from-[#189AB4]/30 via-[#8B5CF6]/20 to-[#10B981]/30" />

          <div className="space-y-5">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative flex flex-col sm:flex-row gap-5 items-start bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#189AB4]/30 transition-all group"
                >
                  {/* Step number circle */}
                  <div className="flex-shrink-0 relative z-10">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm transition-transform group-hover:scale-105"
                      style={{ background: `${step.actorColor}12`, color: step.actorColor, border: `1.5px solid ${step.actorColor}20` }}
                    >
                      {step.number}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span
                        className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                        style={{ background: `${step.actorColor}12`, color: step.actorColor }}
                      >
                        {step.actor}
                      </span>
                      <span
                        className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                        style={{ background: `${step.tagColor}12`, color: step.tagColor, border: `1px solid ${step.tagColor}30` }}
                      >
                        → {step.tag}
                      </span>
                      {step.specialBadge && (
                        <span
                          className="text-xs font-bold px-3 py-1 rounded-full"
                          style={{ background: `${step.specialBadge.color}15`, color: step.specialBadge.color, border: `1px solid ${step.specialBadge.color}30` }}
                        >
                          {step.specialBadge.label}
                        </span>
                      )}
                    </div>

                    {/* Title + icon */}
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="w-5 h-5 flex-shrink-0" style={{ color: step.accentColor }} />
                      <h3 className="text-xl font-extrabold text-[#05445E]">{step.title}</h3>
                    </div>

                    {/* Description */}
                    <p className="text-[#3a7fa0] leading-relaxed text-sm mb-4">{step.description}</p>

                    {/* Highlights */}
                    <div className="flex flex-wrap gap-2">
                      {step.highlights.map((h) => (
                        <span key={h} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                          <ArrowRight className="w-3 h-3 text-[#189AB4]" />
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Dispute Path Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-20 max-w-5xl mx-auto"
        >
          {/* Title */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-4 bg-red-50 border border-red-100 text-red-600 uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              Alternative Path — Dispute Resolution
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#05445E] mb-2">
              Buyer raises a dispute?{' '}
              <span className="text-red-500">We've got it covered.</span>
            </h3>
            <p className="text-[#3a7fa0] max-w-xl mx-auto text-sm">
              If the goods arrive damaged, wrong, or not at all — the buyer can freeze funds and trigger a fully transparent, on-chain arbitration process.
            </p>
          </div>

          {/* Dispute flow grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {disputeFlow.map((d, i) => {
              const Icon = d.icon
              return (
                <motion.div
                  key={d.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative rounded-2xl p-5 flex flex-col gap-3 border transition-all hover:shadow-md"
                  style={{ background: d.bg, borderColor: d.border }}
                >
                  {/* Step number */}
                  <span className="absolute top-4 right-4 text-xs font-black opacity-20" style={{ color: d.color }}>
                    0{i + 1}
                  </span>

                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${d.color}15`, color: d.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Label */}
                  <p className="text-sm font-extrabold text-[#05445E]">{d.label}</p>

                  {/* Desc */}
                  <p className="text-xs text-[#3a7fa0] leading-relaxed">{d.desc}</p>

                  {/* Connector arrow (except last) */}
                  {i < disputeFlow.length - 1 && (
                    <div className="hidden lg:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 w-5 h-5 bg-white border border-slate-200 rounded-full items-center justify-center shadow-sm">
                      <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Bottom guarantee banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-8 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5 bg-gradient-to-r from-[#05445E] to-[#189AB4]"
          >
            <div className="w-12 h-12 flex-shrink-0 rounded-2xl bg-white/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-white font-extrabold text-base mb-1">
                Every path is protected by the Stellar blockchain.
              </p>
              <p className="text-white/70 text-sm font-medium">
                Whether a deal completes normally or goes through arbitration, the smart contract autonomously executes the final verdict. No human can intervene, override, or steal funds.
              </p>
            </div>
          </motion.div>
        </motion.div>

      </div>
    </section>
  )
}
