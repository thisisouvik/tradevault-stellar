import DeploymentChecker from '@/components/DeploymentChecker'
import HoverGradientNavBar from '@/components/ui/hover-gradient-nav-bar'
import { Footer } from '@/components/landing/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contract Deployment Status - TradeVault',
}

export default function StatusPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <HoverGradientNavBar />
      <DeploymentChecker />
      <Footer />
    </main>
  )
}
