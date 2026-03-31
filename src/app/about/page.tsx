'use client'

import HoverGradientNavBar from '@/components/ui/hover-gradient-nav-bar'
import { Footer } from '@/components/landing/Footer'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Shield, Zap, Users, Globe, Lock, Scale, Camera,
  CheckCircle2, ArrowRight, Truck, ExternalLink,
  BarChart3, FileText, Wallet, Star
} from 'lucide-react'

const values = [
  {
    icon: Shield,
    color: '#05445E',
    bg: '#EAF6FB',
    title: 'Trust by Default',
    desc: 'We don\'t ask you to trust us — we make the technology itself trustworthy. Every contract lives entirely on-chain where no human, including us, can intervene.',
  },
  {
    icon: Globe,
    color: '#189AB4',
    bg: '#D6EFF9',
    title: 'Borderless Access',
    desc: 'TradeVault works for a freelancer in Lagos, a manufacturer in Shenzhen, and a buyer in Toronto. No bank account. No credit card. Just a Stellar wallet.',
  },
  {
    icon: BarChart3,
    color: '#8B5CF6',
    bg: '#F5F3FF',
    title: 'Radical Transparency',
    desc: 'Every state change — from deal creation to fund release — is a verifiable on-chain event. Anyone can audit any contract at any time on Stellar Explorer.',
  },
  {
    icon: Scale,
    color: '#F59E0B',
    bg: '#FFFBEB',
    title: 'Fair Dispute Resolution',
    desc: 'When things go wrong, independent arbitrators review evidence submitted by both parties and issue a split verdict that the smart contract executes automatically.',
  },
]

const features = [
  {
    icon: FileText,
    title: 'Smart Contract Escrow',
    desc: 'Sellers deploy tamper-proof Stellar contracts. Funds only move when cryptographic conditions are met.',
  },
  {
    icon: Wallet,
    title: 'Atomic Fund Locking',
    desc: 'Buyer\'s three-step acceptance, fund lock, and USDC transfer are grouped atomically — all succeed or none do.',
  },
  {
    icon: Truck,
    title: 'Courier or Instant Delivery',
    desc: 'Submit tracking numbers with proof images, or choose Instant Delivery for in-person handovers with auto-generated verifiable IDs.',
  },
  {
    icon: Camera,
    title: 'Photo Evidence Uploads',
    desc: 'Sellers and buyers upload up to 3 proof images. Evidence is stored securely in Supabase and surfaced during disputes.',
  },
  {
    icon: Scale,
    title: 'On-chain Arbitration',
    desc: 'Neutral arbitrators review all evidence and issue a proportional verdict. The smart contract splits the USDC accordingly.',
  },
  {
    icon: Lock,
    title: 'SHA-256 Tracking Hash',
    desc: 'Tracking IDs are permanently hashed on the Stellar blockchain — cryptographic proof of delivery that can\'t be altered.',
  },
  {
    icon: CheckCircle2,
    title: 'Buyer Dispute Window',
    desc: 'Buyers have a configurable window (set by the seller) to confirm or dispute after delivery. Funds auto-release on timeout.',
  },
  {
    icon: BarChart3,
    title: 'Reputation System',
    desc: 'Every completed deal writes an immutable reputation note on-chain, building verifiable trader profiles that anyone can check.',
  },
]

const timeline = [
  { year: '2024', label: 'Concept', desc: 'Identified the core problem: peer-to-peer trade has no trust layer without a bank.' },
  { year: '2025 Q1', label: 'v0.1 Launch', desc: 'First escrow contract deployed on Stellar Testnet. Core accept/fund/confirm flow live.' },
  { year: '2025 Q2', label: 'Dispute Engine', desc: 'Added dispute raises, photo evidence uploads, and arbitrator dashboard with split verdicts.' },
  { year: '2025 Q3', label: 'Delivery Proof', desc: 'Integrated courier tracking, SHA-256 on-chain hashing, and Instant Delivery for in-person trades.' },
  { year: '2025 Q4', label: 'Reputation Layer', desc: 'Added on-chain trader reputation notes and the public trader profile explorer.' },
  { year: '2026 →', label: 'Mainnet & Beyond', desc: 'Mainnet launch, real USDC, expanded arbitration network, and multi-asset support.' },
]

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <HoverGradientNavBar />

      {/* Hero */}
      <section className="relative pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-20 lg:pb-24 overflow-hidden bg-[#F7F9FC]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full opacity-[0.05]"
            style={{ background: 'radial-gradient(circle, #189AB4, transparent)' }} />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-6 bg-[#189AB4]/10 border border-[#189AB4]/20 text-[#189AB4] uppercase tracking-widest"
          >
            About TradeVault
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#05445E] leading-tight mb-5 sm:mb-6 tracking-tight max-w-4xl"
          >
            Peer-to-peer trade,{' '}
            <span className="text-[#189AB4]">secured by math — not middlemen.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[#3a7fa0] text-base sm:text-lg font-medium max-w-2xl leading-relaxed mb-8 sm:mb-10"
          >
            TradeVault is a blockchain-native escrow platform built for the global economy. We eliminate the need for banks, payment processors, or blind trust in strangers — replacing them with cryptographically enforced smart contracts on Stellar.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            <Link href="/auth/signup" className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#05445E] text-white font-bold text-sm hover:bg-[#189AB4] transition-all shadow-lg">
              Start Trading Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/why-stellar" className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-white border border-[#189AB4]/30 text-[#05445E] font-bold text-sm hover:border-[#189AB4] transition-all">
              Why Stellar?
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="bg-white border-y border-slate-100 py-10 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center">
          {[
            { value: '100%', label: 'On-Chain Contracts', icon: Shield },
            { value: '$0.001', label: 'Avg. Trade Fee', icon: Zap },
            { value: '< 4s', label: 'Settlement Time', icon: CheckCircle2 },
            { value: '0', label: 'Platform Custodians', icon: Lock },
          ].map((s) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-10 h-10 rounded-xl bg-[#EAF6FB] flex items-center justify-center mb-1">
                  <Icon className="w-5 h-5 text-[#189AB4]" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-[#05445E]">{s.value}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 sm:py-20 lg:py-24 bg-[#F7F9FC]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-[#189AB4] mb-4">Our Mission</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#05445E] mb-5 sm:mb-6 leading-tight">
              Make international trade as safe as trading with a neighbor.
            </h2>
            <p className="text-[#3a7fa0] leading-relaxed font-medium mb-4">
              Every year, billions of dollars are lost to trade fraud, payment disputes, and broken trust in peer-to-peer markets. The existing solutions — escrow lawyers, PayPal, bank wire holds — are expensive, slow, and still rely on trusting a centralized institution.
            </p>
            <p className="text-[#3a7fa0] leading-relaxed font-medium mb-6">
              We built TradeVault to invert this completely. Instead of trusting a company, you trust code — open, verifiable, and immutable code running on the Stellar blockchain. The rules of the trade are locked in at creation and cannot be changed by anyone, including us.
            </p>
            <a
              href="https://stellar.expert/explorer/testnet"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#189AB4] hover:text-[#05445E] transition-colors"
            >
              View live contracts on Stellar Explorer <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {[
              'No platform holds your funds — ever.',
              'Smart contracts enforce all payment conditions.',
              'No KYC, no credit card, no bank account needed.',
              'Every dispute resolved by neutral arbitrators.',
              'Full trade history permanently on-chain.',
              'Open to every country and currency via USDC.',
            ].map((point) => (
              <div key={point} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-[#189AB4] flex-shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-[#05445E]">{point}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-[#189AB4] mb-3">Core Values</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#05445E]">What we stand for</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl p-6 border border-slate-200 bg-white hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: v.bg }}>
                    <Icon className="w-6 h-6" style={{ color: v.color }} />
                  </div>
                  <h3 className="text-base font-extrabold text-[#05445E] mb-2">{v.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">{v.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Full Feature List */}
      <section className="py-16 sm:py-20 lg:py-24 bg-[#F7F9FC]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-[#189AB4] mb-3">Platform Features</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#05445E]">
              Everything you need for{' '}
              <span className="text-[#189AB4]">safe, verifiable trade.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#EAF6FB] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#189AB4]" />
                  </div>
                  <h3 className="text-sm font-extrabold text-[#05445E] mb-1.5">{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{f.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-[#189AB4] mb-3">Our Journey</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#05445E]">Built in the open, shipped fast.</h2>
          </div>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#189AB4] to-[#D6EFF9]" />
            <div className="space-y-6 sm:space-y-8 pl-10 sm:pl-14">
              {timeline.map((t, i) => (
                <motion.div
                  key={t.year}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative"
                >
                  <div className="absolute -left-9 top-1.5 w-4 h-4 rounded-full bg-[#189AB4] border-4 border-white shadow-md" />
                  <div className="bg-[#F7F9FC] rounded-xl p-5 border border-slate-200/80">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-black text-[#189AB4] uppercase tracking-widest bg-[#D6EFF9] px-3 py-1 rounded-full">{t.year}</span>
                      <span className="text-sm font-extrabold text-[#05445E]">{t.label}</span>
                    </div>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{t.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, #05445E 0%, #189AB4 100%)' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-6 bg-white/15 border border-white/20 text-white uppercase tracking-widest"
          >
            <Star className="w-3.5 h-3.5" />
            Free to start
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-black text-white mb-4"
          >
            Ready to trade with confidence?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/70 font-medium mb-8 text-lg"
          >
            Create your first escrow deal in under 2 minutes. No bank account, no credit card, no KYC required.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link href="/auth/signup" className="flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[#05445E] font-black text-sm hover:bg-[#D6EFF9] transition-all shadow-xl">
              Create your free account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/#how-it-works" className="flex items-center gap-2 px-8 py-4 rounded-full bg-white/15 text-white font-bold text-sm border border-white/20 hover:bg-white/25 transition-all">
              See how it works
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
