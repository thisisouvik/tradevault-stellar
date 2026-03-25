'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, DollarSign, Package } from 'lucide-react'

interface Deal {
  id: string
  item_name: string
  amount_usdc: number
  status: string
  buyer_email: string
  delivery_days: number
  created_at: string
  contract_app_id?: string
}

interface DealCardProps {
  deal: Deal
  isSeller?: boolean
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PROPOSED: { label: 'Proposed', color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
  ACCEPTED: { label: 'Accepted', color: '#3b91e8', bg: 'rgba(59,145,232,0.1)' },
  FUNDED: { label: 'Funded', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  DELIVERED: { label: 'Delivered', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  COMPLETED: { label: 'Completed', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  DISPUTED: { label: 'Disputed', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  RESOLVED: { label: 'Resolved', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  CANCELLED: { label: 'Cancelled', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
}

export function DealCard({ deal, isSeller = true }: DealCardProps) {
  const status = STATUS_CONFIG[deal.status] || STATUS_CONFIG.PROPOSED
  const date = new Date(deal.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="group relative rounded-2xl p-5 transition-all cursor-default"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Hover border */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ border: `1px solid ${status.color}30` }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: status.bg }}
          >
            <Package className="w-4 h-4" style={{ color: status.color }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white line-clamp-1">{deal.item_name}</h3>
            <p className="text-xs text-[#8ca0b3] mt-0.5">
              {isSeller ? `To: ${deal.buyer_email}` : 'As buyer'}
            </p>
          </div>
        </div>

        {/* Status */}
        <span
          className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
          style={{ background: status.bg, color: status.color }}
        >
          {status.label}
        </span>
      </div>

      {/* Details row */}
      <div className="flex items-center gap-4 text-xs text-[#8ca0b3] mb-4">
        <span className="flex items-center gap-1">
          <DollarSign className="w-3.5 h-3.5" />
          {deal.amount_usdc} USDC
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {deal.delivery_days}d delivery
        </span>
        <span className="ml-auto">{date}</span>
      </div>

      {/* App ID */}
      {deal.contract_app_id && (
        <p className="text-xs text-[#8ca0b3] font-mono mb-4">
          App ID: {deal.contract_app_id}
        </p>
      )}

      {/* View button */}
      <Link
        href={`/deal/${deal.id}`}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold transition-all"
        style={{
          background: `${status.color}15`,
          color: status.color,
          border: `1px solid ${status.color}25`,
        }}
      >
        View deal
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </motion.div>
  )
}
