'use client'

import Link from 'next/link'
import { Shield } from 'lucide-react'

function CustomArrow() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/70 flex-shrink-0">
      <path d="M9 1L13 5M13 5L9 9M13 5H1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-[#05445E] text-white pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header - Logo and subtitle */}
        <div className="flex flex-col mb-10">
          <Link href="/" className="inline-flex items-center gap-3 font-bold text-3xl tracking-wide text-white mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#189AB4] flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            TradeVault
          </Link>
          <p className="text-white/80 max-w-sm leading-relaxed text-sm">
            Start trading globally with zero counterparty risk.<br/>Escrow-backed, no banks needed.
          </p>
        </div>

        {/* Horizontal Divider */}
        <div className="w-full h-px bg-[#189AB4]/30 mb-12"></div>

        {/* Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          
          <div className="col-span-1 md:col-span-3">
            <h4 className="text-[13px] font-bold mb-6 text-white uppercase tracking-widest">PRODUCTS</h4>
            <ul className="space-y-4">
              <li><Link href="#features" className="text-sm text-white/90 hover:text-white transition-colors flex items-center gap-3"><CustomArrow /> Features</Link></li>
              <li><Link href="#" className="text-sm text-white/90 hover:text-white transition-colors flex items-center gap-3"><CustomArrow /> Integration</Link></li>
              <li><Link href="#" className="text-sm text-white/90 hover:text-white transition-colors flex items-center gap-3"><CustomArrow /> Roadmap</Link></li>
            </ul>
          </div>
          
          <div className="col-span-1 md:col-span-4">
            <h4 className="text-[13px] font-bold mb-6 text-white uppercase tracking-widest">COMPANY</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-sm text-white/90 hover:text-white transition-colors flex items-center gap-3"><CustomArrow /> About</Link></li>
              <li><Link href="#" className="text-sm text-white/90 hover:text-white transition-colors flex items-center gap-3"><CustomArrow /> Term Of Services</Link></li>
              <li><Link href="#" className="text-sm text-white/90 hover:text-white transition-colors flex items-center gap-3"><CustomArrow /> Privacy Policy</Link></li>
              <li><Link href="#" className="text-sm text-white/90 hover:text-white transition-colors flex items-center gap-3"><CustomArrow /> Licensed & Regulation</Link></li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-4 lg:col-span-5">
            <h4 className="text-[13px] font-bold mb-3 text-white uppercase tracking-widest">STAY IN TOUCH</h4>
            <p className="text-xs text-white/80 mb-5 font-medium">Keep Updated with the latest news!</p>
            <form className="flex w-full" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter Your Email" 
                className="bg-white border-y border-l border-transparent text-sm text-[#05445E] placeholder:text-slate-400 px-4 py-3.5 w-full rounded-l-lg outline-none transition-colors"
                required
              />
              <button 
                type="submit" 
                className="bg-[#189AB4] hover:bg-[#158197] text-white font-bold text-sm px-6 py-3.5 rounded-r-lg transition-colors"
              >
                Submit
              </button>
            </form>
          </div>
          
        </div>
      </div>
      
      {/* Bottom Footer */}
      <div className="bg-[#03202C] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-sm text-[#A0DFF0] gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white font-bold text-sm tracking-tighter">N</div>
            <p>© 2026 TradeVault. All Rights Reserved.</p>
          </div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Term Of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
