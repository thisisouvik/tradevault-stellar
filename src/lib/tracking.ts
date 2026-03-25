/**
 * TrackingMore API wrapper
 * Free tier: 1700+ carriers
 */

const TRACKINGMORE_BASE = 'https://api.trackingmore.com/v4'

interface TrackingCheckpoint {
  time: string
  location: string
  status: string
  details: string
}

interface TrackingInfo {
  trackingNumber: string
  carrier: string
  status: string
  estimatedDelivery?: string
  checkpoints: TrackingCheckpoint[]
  isDelivered: boolean
}

export async function verifyTrackingNumber(
  trackingNumber: string,
  carrierCode: string
): Promise<{ valid: boolean; error?: string }> {
  const apiKey = process.env.TRACKINGMORE_API_KEY
  if (!apiKey) {
    // Dev mode: accept any tracking number
    console.warn('TRACKINGMORE_API_KEY not set — accepting any tracking number in dev mode')
    return { valid: true }
  }

  try {
    const res = await fetch(`${TRACKINGMORE_BASE}/trackings/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Tracking-Api-Key': apiKey,
      },
      body: JSON.stringify({ tracking_number: trackingNumber }),
    })

    const data = await res.json()
    if (data.code === 200 && data.data) {
      const detected = data.data.find(
        (d: { courier_code: string }) => d.courier_code === carrierCode
      )
      return detected ? { valid: true } : { valid: false, error: 'Tracking number not found for this carrier' }
    }
    return { valid: false, error: 'Invalid tracking number' }
  } catch (error) {
    console.error('TrackingMore verify error:', error)
    return { valid: true } // Fail open in dev
  }
}

export async function getTrackingStatus(
  trackingNumber: string,
  carrierCode: string
): Promise<TrackingInfo | null> {
  const apiKey = process.env.TRACKINGMORE_API_KEY
  if (!apiKey) {
    return {
      trackingNumber,
      carrier: carrierCode,
      status: 'In Transit',
      checkpoints: [
        {
          time: new Date().toISOString(),
          location: 'Mumbai, India',
          status: 'In Transit',
          details: 'Package is in transit (demo mode)',
        },
      ],
      isDelivered: false,
    }
  }

  try {
    const res = await fetch(
      `${TRACKINGMORE_BASE}/trackings/${carrierCode}/${trackingNumber}`,
      {
        headers: {
          'Tracking-Api-Key': apiKey,
        },
        next: { revalidate: 7200 }, // Cache for 2 hours
      }
    )

    const data = await res.json()
    if (data.code !== 200 || !data.data) return null

    const tracking = data.data
    const checkpoints: TrackingCheckpoint[] = (tracking.origin_info?.trackinfo || []).map(
      (t: { TimeISO: string; location: string; Details: string; StatusDescription: string }) => ({
        time: t.TimeISO,
        location: t.location || '',
        status: t.StatusDescription || t.Details,
        details: t.Details,
      })
    )

    return {
      trackingNumber,
      carrier: carrierCode,
      status: tracking.package_status,
      estimatedDelivery: tracking.expected_delivery,
      checkpoints,
      isDelivered: tracking.package_status === 'Delivered',
    }
  } catch (error) {
    console.error('TrackingMore status error:', error)
    return null
  }
}

// Common courier codes
export const COURIERS = [
  { code: 'dhl', name: 'DHL Express' },
  { code: 'fedex', name: 'FedEx' },
  { code: 'ups', name: 'UPS' },
  { code: 'usps', name: 'USPS' },
  { code: 'royalmail', name: 'Royal Mail' },
  { code: 'indiapost', name: 'India Post' },
  { code: 'dtdc', name: 'DTDC (India)' },
  { code: 'bluedart', name: 'Blue Dart (India)' },
  { code: 'aramex', name: 'Aramex' },
  { code: 'sfexpress', name: 'SF Express' },
  { code: 'ems', name: 'EMS' },
  { code: 'tnt', name: 'TNT' },
]
