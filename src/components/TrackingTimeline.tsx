'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Package, MapPin, CheckCircle2, Clock, Truck, RefreshCw, ExternalLink, Hash } from 'lucide-react'

interface Checkpoint {
  time: string
  location: string
  status: string
  details: string
}

interface TrackingTimelineProps {
  dealId: string
  trackingId: string
  courier: string
  trackingHash?: string
  appId?: number
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  'Delivered': <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />,
  'In Transit': <Truck className="w-4 h-4 text-[#3b91e8]" />,
  'Pending': <Clock className="w-4 h-4 text-[#8ca0b3]" />,
}

export function TrackingTimeline({ dealId, trackingId, courier, trackingHash, appId }: TrackingTimelineProps) {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function fetchStatus() {
    if (courier === 'INSTANT') {
      setStatus('Delivered');
      setLoading(false);
      setCheckpoints([{
        time: new Date().toISOString(),
        location: 'Handover Location',
        status: 'Delivered In-Person',
        details: 'Seller initiated an instant handover.',
      }]);
      return;
    }

    setRefreshing(true)
    try {
      const res = await fetch(`/api/tracking-status?dealId=${dealId}`)
      const data = await res.json()
      if (data.checkpoints) {
        setCheckpoints(data.checkpoints)
        setStatus(data.status || 'In Transit')
        setLastUpdated(new Date())
      }
    } catch (e) {
      console.error('Failed to fetch tracking', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    if (courier === 'INSTANT') return;
    // Polling every 2 hours in production, every 30s in dev
    const interval = setInterval(fetchStatus, process.env.NODE_ENV === 'development' ? 30000 : 7200000)
    return () => clearInterval(interval)
  }, [dealId, courier]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {courier === 'INSTANT' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Package className="w-4 h-4 text-[#189AB4]" />}
          <span className="text-sm font-bold text-gray-900">
             {courier === 'INSTANT' ? "Instant Handover Details" : "Shipment Tracking"}
          </span>
        </div>
        
        {courier !== 'INSTANT' && (
          <button
            onClick={fetchStatus}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      {/* Tracking info */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl text-xs bg-gray-50 border border-gray-200 shadow-sm">
        <span className="text-gray-500 font-semibold uppercase">{courier === 'INSTANT' ? 'Method:' : 'Carrier:'}</span>
        <span className="text-gray-900 font-bold uppercase">{courier === 'INSTANT' ? 'In-Person Handover' : courier}</span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500 font-semibold uppercase">{courier === 'INSTANT' ? 'Handover ID:' : 'Tracking:'}</span>
        <span className="text-gray-900 font-mono font-bold bg-white px-2 py-1 rounded border border-gray-200">{trackingId}</span>
        
        {lastUpdated && courier !== 'INSTANT' && (
          <span className="text-gray-400 font-medium ml-auto">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* On-chain proof */}
      {trackingHash && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="w-4 h-4 text-green-600" />
            <span className="text-xs font-bold uppercase tracking-wide text-green-700">On-chain cryptographic proof</span>
            {appId && (
              <a
                href={`https://stellar.expert/explorer/testnet/contract/${appId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 px-2 py-1 bg-white border border-green-200 rounded text-[10px] font-bold text-green-600 hover:bg-green-100 transition-colors"
              >
                Verify on Lora <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <p className="text-xs font-mono font-bold text-slate-700 break-all bg-white p-2 rounded border border-green-100">{trackingHash}</p>
            <p className="text-[10px] uppercase tracking-widest text-green-600/70 font-bold mt-2">SHA256 Hash stored permanently on Stellar</p>
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-4 h-4 rounded-full bg-slate-200 flex-shrink-0 mt-1" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-2 bg-slate-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : checkpoints.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
          <Clock className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600">Tracking info not yet available from carrier API</p>
          <p className="text-xs font-medium text-slate-400 mt-1">Updates usually appear within 2 hours of pickup.</p>
        </div>
      ) : (
        <div className="relative space-y-0 pl-1">
          {/* Vertical line */}
          <div className="absolute left-[10px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-green-400 to-slate-200 rounded-full" />
          {checkpoints.map((cp, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-5 pb-6 relative group"
            >
              <div 
                className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 z-10 border-2 bg-white transition-colors duration-300 ${i === 0 ? 'border-green-500 ring-4 ring-green-100' : 'border-slate-300 group-hover:border-slate-400'}`}
              >
                {i === 0 && <div className="w-2 h-2 rounded-full bg-green-500" />}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className={`text-sm font-bold ${i === 0 ? 'text-slate-800' : 'text-slate-500'}`}>{cp.status}</p>
                {cp.location && (
                  <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />{cp.location}
                  </p>
                )}
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mt-1 bg-slate-50 inline-block px-1.5 py-0.5 rounded">
                  {new Date(cp.time).toLocaleString()}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
