import HoverGradientNavBar from '@/components/ui/hover-gradient-nav-bar'
import { HeroSection } from '@/components/landing/HeroSection'
import { PartnersSection } from '@/components/landing/PartnersSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { StatsSection } from '@/components/landing/StatsSection'
import { TestimonialsSection } from '@/components/landing/TestimonialsSection'
import { Footer } from '@/components/landing/Footer'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <HoverGradientNavBar />
      <HeroSection />
      <PartnersSection />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <TestimonialsSection />
      <Footer />
    </main>
  )
}
