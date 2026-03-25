/**
 * Email helper using Resend API
 * Falls back to console.log in development
 */

interface EmailPayload {
  to: string
  subject: string
  html: string
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY) {
    console.log('📧 [DEV EMAIL]', payload.to, '|', payload.subject)
    return
  }

  if (process.env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'TradeVault <noreply@TradeVault.app>',
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    })
    if (!res.ok) {
      const err = await res.json()
      console.error('Email send error:', err)
    }
  }
}

// Email templates
export const emailTemplates = {
  dealInvite: (
    buyerName: string,
    sellerName: string,
    dealLink: string,
    itemName: string,
    amountUSDC: number
  ) => ({
    subject: `${sellerName} wants to trade with you — TradeVault`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#04101f;color:#f0f4f8;padding:40px;border-radius:16px">
        <div style="margin-bottom:32px">
          <span style="font-size:24px;font-weight:800;color:#4ade80">TradeVault</span>
        </div>
        <h1 style="font-size:24px;font-weight:700;margin-bottom:16px">New Trade Proposal</h1>
        <p style="color:#8ca0b3;margin-bottom:24px">
          Hi ${buyerName || 'there'}, <strong style="color:#f0f4f8">${sellerName}</strong> has proposed a trade with you on TradeVault.
        </p>
        <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:24px;margin-bottom:24px">
          <p style="margin-bottom:8px"><strong>Item:</strong> ${itemName}</p>
          <p style="margin-bottom:0"><strong>Amount:</strong> ${amountUSDC} USDC</p>
        </div>
        <a href="${dealLink}" style="display:inline-block;background:#4ade80;color:#04101f;font-weight:700;padding:14px 28px;border-radius:50px;text-decoration:none;font-size:16px">
          Review &amp; Fund Deal &rarr;
        </a>
      </div>
    `,
  }),

  dealFunded: (sellerName: string, itemName: string, amountUSDC: number, dealLink: string) => ({
    subject: `Escrow funded — ship safely! ($${amountUSDC} USDC locked)`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#04101f;color:#f0f4f8;padding:40px;border-radius:16px">
        <div style="margin-bottom:32px">
          <span style="font-size:24px;font-weight:800;color:#4ade80">TradeVault</span>
        </div>
        <h1 style="font-size:24px;font-weight:700;margin-bottom:16px">&#x1F389; Your Escrow is Funded!</h1>
        <p style="color:#8ca0b3;margin-bottom:24px">
          Hi ${sellerName}, the buyer has locked <strong style="color:#4ade80">$${amountUSDC} USDC</strong> into the smart contract for <strong style="color:#f0f4f8">${itemName}</strong>. You can now ship safely.
        </p>
        <a href="${dealLink}" style="display:inline-block;background:#4ade80;color:#04101f;font-weight:700;padding:14px 28px;border-radius:50px;text-decoration:none;font-size:16px">
          Submit Tracking Number &rarr;
        </a>
      </div>
    `,
  }),

  deliverySubmitted: (
    buyerName: string,
    trackingId: string,
    courier: string,
    dealLink: string,
    disputeDays: number
  ) => ({
    subject: `Your shipment is on the way — ${trackingId}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#04101f;color:#f0f4f8;padding:40px;border-radius:16px">
        <div style="margin-bottom:32px">
          <span style="font-size:24px;font-weight:800;color:#4ade80">TradeVault</span>
        </div>
        <h1 style="font-size:24px;font-weight:700;margin-bottom:16px">&#x1F4E6; Your Shipment is On the Way!</h1>
        <p style="color:#8ca0b3;margin-bottom:24px">Hi ${buyerName}, the seller has shipped your item.</p>
        <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:24px;margin-bottom:24px">
          <p style="margin-bottom:8px"><strong>Carrier:</strong> ${courier.toUpperCase()}</p>
          <p style="margin-bottom:0"><strong>Tracking:</strong> ${trackingId}</p>
        </div>
        <p style="color:#8ca0b3;margin-bottom:24px">You have <strong style="color:#f59e0b">${disputeDays} days</strong> from delivery to confirm or raise a dispute.</p>
        <a href="${dealLink}" style="display:inline-block;background:#4ade80;color:#04101f;font-weight:700;padding:14px 28px;border-radius:50px;text-decoration:none;font-size:16px">
          Track Shipment &rarr;
        </a>
      </div>
    `,
  }),

  dealCompleted: (name: string, itemName: string, amountUSDC: number) => ({
    subject: `Deal completed — ${itemName}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#04101f;color:#f0f4f8;padding:40px;border-radius:16px">
        <div style="margin-bottom:32px">
          <span style="font-size:24px;font-weight:800;color:#4ade80">TradeVault</span>
        </div>
        <h1 style="font-size:24px;font-weight:700;margin-bottom:16px">&#x2705; Deal Completed</h1>
        <p style="color:#8ca0b3">Hi ${name}, your deal for <strong style="color:#f0f4f8">${itemName}</strong> worth <strong style="color:#4ade80">$${amountUSDC} USDC</strong> has been completed successfully.</p>
      </div>
    `,
  }),

  disputeOpened: (name: string, dealLink: string) => ({
    subject: `Dispute opened — submit evidence within 48 hours`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#04101f;color:#f0f4f8;padding:40px;border-radius:16px">
        <div style="margin-bottom:32px">
          <span style="font-size:24px;font-weight:800;color:#4ade80">TradeVault</span>
        </div>
        <h1 style="font-size:24px;font-weight:700;margin-bottom:16px">&#x26A0;&#xFE0F; Dispute Opened</h1>
        <p style="color:#8ca0b3;margin-bottom:24px">Hi ${name}, a dispute has been opened on your deal. Please submit evidence within 48 hours.</p>
        <a href="${dealLink}" style="display:inline-block;background:#ef4444;color:#fff;font-weight:700;padding:14px 28px;border-radius:50px;text-decoration:none;font-size:16px">
          Submit Evidence &rarr;
        </a>
      </div>
    `,
  }),
}
