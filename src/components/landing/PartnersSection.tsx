'use client'

import { motion } from 'framer-motion'

const logos = [
  { name: 'Stellar', color: '#05445E' },
  { name: 'USDC', color: '#189AB4' },
  { name: 'TrackingMore', color: '#8B5CF6' },
  { name: 'Supabase', color: '#10B981' },
  { name: 'Vercel', color: '#05445E' },
]

export function PartnersSection() {
  return (
    <section className="py-12 relative overflow-hidden bg-white border-b border-[#189AB4]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-[#189AB4] mb-8">
          Powered by
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {logos.map((logo, i) => (
            <motion.div
              key={logo.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide"
              style={{
                background: `${logo.color}10`,
                border: `1px solid ${logo.color}25`,
                color: logo.color,
              }}
            >
              {logo.name}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

