import HoverGradientNavBar from '@/components/ui/hover-gradient-nav-bar'
import { Footer } from '@/components/landing/Footer'
import { Zap, Coins, ShieldCheck, Cpu, Layers, Globe } from 'lucide-react'

const reasons = [
  {
    icon: Zap,
    title: 'Instant Finality in Under 5 Seconds',
    description:
      'Traditional payment rails and many chains introduce long confirmation windows or uncertainty. Stellar settles quickly with strong finality, so once a buyer confirms receipt, USDC release can complete without long waiting periods.',
    color: '#05445E',
  },
  {
    icon: Coins,
    title: 'Near-Zero Transaction Fees',
    description:
      'Cross-border bank wires often cost $15-$50 and take several days. Stellar transaction costs are designed to stay extremely low, making escrow operations affordable at global scale.',
    color: '#189AB4',
  },
  {
    icon: ShieldCheck,
    title: 'Native USDC Without Bridge Risk',
    description:
      'USDC on TradeVault is not wrapped or synthetic. It is native on Stellar, reducing bridge-related risk and keeping escrow settlement straightforward.',
    color: '#0EA5E9',
  },
  {
    icon: Cpu,
    title: 'Auditable Soroban Smart Contracts',
    description:
      'TradeVault escrow logic runs as on-chain Soroban contract code. Every state transition is auditable on-chain with no hidden admin override path for deal outcomes.',
    color: '#8B5CF6',
  },
  {
    icon: Layers,
    title: 'Deterministic Contract Execution',
    description:
      'Stellar provides deterministic transaction processing and composable contract execution, enabling secure funding flows where state updates and value movement are coordinated safely.',
    color: '#0EA5E9',
  },
  {
    icon: Globe,
    title: 'Global Access by Design',
    description:
      'A seller in Lagos, a buyer in Toronto, and an arbitrator in Singapore can complete an on-chain deal without relying on traditional banking intermediaries.',
    color: '#059669',
  },
]

export default function WhyStellarPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <HoverGradientNavBar />

      <section className="bg-[#D6EFF9] pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-20 lg:pb-24 relative overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-wide mb-6 bg-[#189AB4]/10 border border-[#189AB4]/20 text-[#05445E]">
            TECHNOLOGY DEEP-DIVE
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#05445E] leading-tight mb-5 sm:mb-6 tracking-tight">
            Why we built TradeVault on <span className="text-[#189AB4]">Stellar.</span>
          </h1>
          <p className="text-[#3a7fa0] text-base sm:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            We evaluated major blockchain options before committing. Stellar won on global payments focus, low fees, native USDC support, and reliable settlement.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 bg-[#EAF6FB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 lg:gap-10">
            {reasons.map((reason, index) => {
              const Icon = reason.icon
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 border border-[#189AB4]/15 shadow-sm hover:shadow-[0_15px_40px_-10px_rgba(24,154,180,0.15)] transition-all"
                >
                  <div
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-5 sm:mb-8"
                    style={{ backgroundColor: `${reason.color}15` }}
                  >
                    <Icon className="w-7 h-7" style={{ color: reason.color }} strokeWidth={2} />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#05445E] mb-3 sm:mb-4">{reason.title}</h3>
                  <p className="text-[#3a7fa0] leading-relaxed text-[15px] font-medium">{reason.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
