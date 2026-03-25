import HoverGradientNavBar from '@/components/ui/hover-gradient-nav-bar'
import { Footer } from '@/components/landing/Footer'
import { Zap, Coins, ShieldCheck, Cpu, Layers, Globe } from 'lucide-react'

const reasons = [
  {
    icon: Zap,
    title: "Instant Finality in Under 4 Seconds",
    description: "Bitcoin takes 60+ minutes for finality; Ethereum averages 12 seconds with only probabilistic guarantees. Stellar settles quickly with strong finality, so once a buyer confirms receipt, the USDC release can complete without long waiting periods. No re-org anxiety, no uncertainty.",
    color: "#05445E"
  },
  {
    icon: Coins,
    title: "Near-Zero Transaction Fees",
    description: "Cross-border bank wires cost $15–$50 and take 3–5 business days. PayPal cross-border fees reach 4–5% of the transaction value. On Stellar, transaction costs are designed to stay extremely low, making escrow operations affordable at global scale.",
    color: "#189AB4"
  },
  {
    icon: ShieldCheck,
    title: "Native USDC — Zero Bridge Risk",
    description: "USDC on TradeVault is not bridged, wrapped, or synthetic. It is native USDC on Stellar, issued directly by Circle, which removes bridge risk and keeps escrow settlement straightforward and stable.",
    color: "#0EA5E9"
  },
  {
    icon: Cpu,
    title: "Auditable AVM Smart Contracts",
    description: "TradeVault's escrow logic runs as on-chain smart contract code on Stellar. Every state transition — PROPOSED → ACCEPTED → FUNDED → DELIVERED → COMPLETED — is auditable on-chain. There are no admin backdoors overriding contract rules once deployed.",
    color: "#8B5CF6"
  },
  {
    icon: Layers,
    title: "Atomic Transaction Groups",
    description: "Stellar provides deterministic transaction processing and composable contract execution, enabling secure funding flows where state updates and value movement can be coordinated safely.",
    color: "#0EA5E9"
  },
  {
    icon: Globe,
    title: "Carbon-Negative & Truly Borderless",
    description: "Stellar is built for global payments and access. A seller in Lagos, a buyer in Toronto, and an arbitrator in Singapore can complete a fully on-chain deal without relying on traditional banking intermediaries.",
    color: "#059669"
  },
]

export default function WhyAlgorandPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <HoverGradientNavBar />
      
      {/* Hero Section */}
      <section className="bg-[#D6EFF9] pt-32 pb-24 relative overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-wide mb-6 bg-[#189AB4]/10 border border-[#189AB4]/20 text-[#05445E]">
            TECHNOLOGY DEEP-DIVE
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-[#05445E] leading-tight mb-6 tracking-tight">
            Why we built TradeVault on <span className="text-[#189AB4]">Stellar.</span>
          </h1>
          <p className="text-[#3a7fa0] text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            We evaluated major blockchain options before committing. Stellar won on global payments focus, low fees, native USDC support, and reliable settlement — the four things that matter most for peer-to-peer trade at any scale.
          </p>
        </div>
      </section>

      {/* Content Grid */}
      <section className="py-24 bg-[#EAF6FB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {reasons.map((reason, index) => {
              const Icon = reason.icon;
              return (
                <div key={index} className="bg-white rounded-3xl p-10 border border-[#189AB4]/15 shadow-sm hover:shadow-[0_15px_40px_-10px_rgba(24,154,180,0.15)] transition-all">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8"
                    style={{ backgroundColor: `${reason.color}15` }}
                  >
                    <Icon className="w-7 h-7" style={{ color: reason.color }} strokeWidth={2} />
                  </div>
                  <h3 className="text-2xl font-bold text-[#05445E] mb-4">
                    {reason.title}
                  </h3>
                  <p className="text-[#3a7fa0] leading-relaxed text-[15px] font-medium">
                    {reason.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  )
}
