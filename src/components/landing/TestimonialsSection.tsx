'use client'

import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'

const testimonials = [
  {
    quote: "TradeVault has completely transformed how we handle international shipments. The smart contract ensures we never worry about delayed payments again.",
    author: "Sarah Jenkins",
    role: "Logistics Director, GlobalFreight",
    initials: "SJ",
    color: "#05445E"
  },
  {
    quote: "As a buyer, the atomic transaction feature is a game-changer. I know my USDC is safe until the tracking number proves delivery.",
    author: "Michael Chen",
    role: "CEO, TechImport Solutions",
    initials: "MC",
    color: "#189AB4"
  },
  {
    quote: "We're settling trades in seconds instead of days. The Stellar integration is smooth and cost-efficient.",
    author: "Elena Rodriguez",
    role: "Head of Trading, EuroTradeHub",
    initials: "ER",
    color: "#0EA5E9"
  }
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 sm:py-32 relative overflow-hidden bg-[#EAF6FB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-wide mb-6 bg-[#189AB4]/10 border border-[#189AB4]/20 text-[#05445E]"
          >
            TESTIMONIALS
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold text-[#05445E] mb-5 tracking-tight"
          >
            Trusted by traders <span className="text-[#189AB4]">worldwide.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="max-w-xl mx-auto text-[#3a7fa0] text-lg font-medium"
          >
            Don't just take our word for it. See how TradeVault is securing cross-border deals every single day.
          </motion.p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.author}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-white rounded-3xl p-8 border border-[#189AB4]/15 shadow-sm hover:shadow-[0_15px_40px_-10px_rgba(24,154,180,0.15)] transition-all flex flex-col justify-between"
            >
              <div>
                <Quote className="w-10 h-10 text-[#189AB4]/20 mb-6" fill="currentColor" />
                <p className="text-[#05445E] leading-relaxed mb-8 font-semibold text-base sm:text-lg">"{t.quote}"</p>
              </div>
              <div className="flex items-center gap-4 mt-auto">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold tracking-wider"
                  style={{ backgroundColor: t.color }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="font-bold text-[#05445E] text-sm">{t.author}</p>
                  <p className="text-xs text-[#3a7fa0] mt-0.5 font-medium">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
