'use client'

import { motion } from 'framer-motion'
import { Shield, Zap, Globe, Lock, Eye, Clock } from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Non-Custodial Security',
    description:
      'Funds are locked in the Stellar smart contract — not on our servers. Nobody, including us, can access the money outside the agreed rules.',
    color: '#05445E',
    bg: 'rgba(5,68,94,0.07)',
  },
  {
    icon: Zap,
    title: 'Atomic Transactions',
    description:
      'Accept and fund happen in a single atomic group. Either both succeed or neither does. No intermediate state where either party is exposed.',
    color: '#189AB4',
    bg: 'rgba(24,154,180,0.07)',
  },
  {
    icon: Globe,
    title: 'Cross-Border Ready',
    description:
      'USDC is native on Stellar — no wrapping, no bridging, no slippage. Trade between Mumbai and Berlin the same way you trade locally.',
    color: '#0EA5E9',
    bg: 'rgba(14,165,233,0.07)',
  },
  {
    icon: Lock,
    title: 'Immutable Terms',
    description:
      'Every deal term — price, deadline, dispute window — is baked permanently into the contract at creation. No one can change them after.',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.07)',
  },
  {
    icon: Eye,
    title: 'On-Chain Proof',
    description:
      'SHA256 hash of the tracking number is stored on Stellar permanently. Anyone can verify delivery proof on the blockchain — forever.',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.07)',
  },
  {
    icon: Clock,
    title: 'Auto-Release Timeout',
    description:
      "Seller protected from silent buyers: if the buyer doesn't confirm or dispute within 7 days, funds auto-release to seller. No action needed.",
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.07)',
  },
]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-24 lg:py-32 relative overflow-hidden bg-[#EAF6FB] border-b border-[#189AB4]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-4 bg-[#189AB4]/10 border border-[#189AB4]/20 text-[#05445E]"
          >
            Why TradeVault
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#05445E] mb-4"
          >
            Built differently.{' '}
            <span className="text-[#189AB4]">Secured by math.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="max-w-xl mx-auto text-[#3a7fa0] text-base sm:text-lg"
          >
            Every safeguard is enforced by the Stellar smart contract runtime — not by policy, not by trust in us.
          </motion.p>
        </div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          {features.map(feature => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative rounded-2xl p-5 sm:p-8 cursor-default bg-white border border-[#189AB4]/15 shadow-sm hover:shadow-md transition-all"
              >
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: feature.bg }}
                />
                <div
                  className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4 sm:mb-6"
                  style={{ background: feature.bg, border: `1px solid ${feature.color}25` }}
                >
                  <Icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <h3 className="relative text-base sm:text-lg font-bold text-[#05445E] mb-3">{feature.title}</h3>
                <p className="relative text-sm text-[#3a7fa0] leading-relaxed">{feature.description}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

