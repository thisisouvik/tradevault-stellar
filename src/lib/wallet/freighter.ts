export const FREIGHTER_DEEPLINK_BASE = 'freighter://sign-message'

export function buildFreighterChallengeMessage(nonce: string, origin: string, issuedAt: string) {
  return `TradeVault Wallet Connect
Origin: ${origin}
Nonce: ${nonce}
IssuedAt: ${issuedAt}
Purpose: Link this Freighter wallet to your TradeVault account.`
}

export function buildFreighterDeeplink(params: {
  message: string
  callbackUrl: string
  sessionId: string
}) {
  const sp = new URLSearchParams({
    message: params.message,
    callback_url: params.callbackUrl,
    session_id: params.sessionId,
  })
  return `${FREIGHTER_DEEPLINK_BASE}?${sp.toString()}`
}
