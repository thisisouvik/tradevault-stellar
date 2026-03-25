'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Truck, Hash, AlertCircle, CheckCircle2, Upload, X, Image as ImageIcon } from 'lucide-react'
import { COURIERS } from '@/lib/tracking'
import { createClient } from '@/lib/supabase/client'

interface SubmitDeliveryProps {
  dealId: string
  onSuccess: () => void
}

export function SubmitDelivery({ dealId, onSuccess }: SubmitDeliveryProps) {
  const [courier, setCourier] = useState('')
  const [trackingId, setTrackingId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [trackingHash, setTrackingHash] = useState('')
  const [images, setImages] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const selected = Array.from(e.target.files)
      // Check limits
      if (images.length + selected.length > 3) {
        setError('Maximum 3 images allowed')
        return
      }
      
      const validFiles: File[] = []
      for (const file of selected) {
        if (!file.type.startsWith('image/')) {
          setError('Only image files are allowed')
          return
        }
        if (file.size > 5 * 1024 * 1024) {
          setError('Each image must be less than 5MB')
          return
        }
        validFiles.push(file)
      }
      
      setError('')
      setImages(prev => [...prev, ...validFiles])
    }
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (images.length === 0) {
        throw new Error('Please upload at least 1 proof image.')
      }

      // Upload images to Supabase 'evidence' bucket
      const evidenceUrls: string[] = []
      for (const file of images) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${dealId}-${Math.random().toString(36).slice(2)}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('evidence')
          .upload(fileName, file)
          
        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`)
        
        const { data: { publicUrl } } = supabase.storage.from('evidence').getPublicUrl(fileName)
        evidenceUrls.push(publicUrl)
      }

      const res = await fetch('/api/submit-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, courier, trackingId, evidenceUrls }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit delivery')

      setTrackingHash(data.trackingHash || '')
      setDone(true)
      setTimeout(() => onSuccess(), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-4 rounded-xl text-green-700 bg-green-50 border border-green-200">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Delivery submitted! Dispute window started.</p>
            <p className="text-xs text-green-600 mt-1">Buyer has been notified via email.</p>
          </div>
        </div>
        {trackingHash && (
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Hash className="w-3 h-3" />On-chain tracking hash:</p>
            <p className="text-xs font-mono text-gray-800 break-all">{trackingHash}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">
        Enter your shipment tracking details. We'll verify the tracking number via TrackingMore API
        and store the SHA256 hash permanently on Algorand.
      </p>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Delivery Method *</label>
        <select
          value={courier}
          onChange={e => {
            const val = e.target.value;
            setCourier(val);
            if (val === 'INSTANT') {
              setTrackingId(`INSTANT_HANDOVER_${Date.now().toString().slice(-6)}`);
            } else if (trackingId.startsWith('INSTANT_HANDOVER')) {
              setTrackingId('');
            }
          }}
          required
          className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 bg-white border border-gray-200 outline-none focus:ring-2 focus:ring-[#189AB4] transition-all"
        >
          <option value="" disabled>Select delivery method...</option>
          <option value="INSTANT" className="font-bold text-green-700">⚡ Instant Delivery / In-Person Handover</option>
          <optgroup label="Courier Services">
            {COURIERS.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </optgroup>
        </select>
      </div>

      {courier !== 'INSTANT' && (
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tracking number *</label>
          <div className="relative">
            <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={trackingId}
              onChange={e => setTrackingId(e.target.value.trim())}
              placeholder="e.g. DHL-994821BOM"
              required={courier !== 'INSTANT'}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-gray-900 bg-white border border-gray-200 font-mono placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#189AB4] transition-all"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          {courier === 'INSTANT' ? "Proof of Handover/Delivery (Max 3) *" : "Proof of Shipping (Max 3, up to 5MB each) *"}
        </label>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          multiple 
          className="hidden" 
        />
        
        {images.length < 3 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-[#189AB4] hover:bg-blue-50 transition-colors group"
          >
            <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#189AB4] mb-2" />
            <span className="text-sm font-medium text-gray-500 group-hover:text-[#189AB4]">
              Click to browse files
            </span>
          </button>
        )}

        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            {images.map((file, idx) => (
              <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                <img 
                  src={URL.createObjectURL(file)} 
                  alt="Proof" 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !courier || !trackingId}
        className="w-full py-4 rounded-xl font-bold text-sm text-white bg-[#05445E] hover:bg-[#043346] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Verifying & Submitting...' : courier === 'INSTANT' ? 'Submit Instant Handover' : 'Submit Tracking Proof'}
      </button>
    </form>
  )
}
