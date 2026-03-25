'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Menu, X, ChevronRight, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<{ email: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ email: data.user.email || '' })
    })

    return () => window.removeEventListener('scroll', handleScroll)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const navLinks = [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'Why Stellar', href: '#algorand' },
  ]

  return (
    <>
      <nav
        className="fixed top-0 left-0 w-full z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(255,255,255,0.90)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center group-hover:shadow-[0_0_16px_rgba(37,99,235,0.4)] transition-all">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-[#111827]">
                Trade<span className="text-[#2563EB]">Vault</span>
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#111827] rounded-lg hover:bg-gray-100 transition-all flex items-center gap-1"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#2563EB] bg-blue-50 hover:bg-blue-100 transition-all border border-blue-100"
                >
                  <Wallet className="w-4 h-4 text-[#2563EB]" />
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 transition-all shadow-sm focus:ring-2 focus:ring-[#2563EB]/20 focus:outline-none"
                  >
                    Get started
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-gray-100 transition-all"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 md:hidden"
            style={{
              background: 'rgba(255,255,255,0.98)',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-sm font-medium text-[#6B7280] hover:text-[#111827] rounded-xl hover:bg-gray-100 transition-all"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 pb-2 border-t border-gray-100 flex flex-col gap-2 mt-2">
                {user ? (
                  <Link
                    href="/dashboard"
                    className="block text-center px-4 py-3 rounded-lg text-sm font-semibold text-white bg-[#2563EB]"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/auth/signin"
                      className="block text-center px-4 py-3 rounded-lg text-sm font-medium text-[#111827] bg-gray-50 border border-gray-200"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="block text-center px-4 py-3 rounded-lg text-sm font-semibold text-white bg-[#2563EB]"
                    >
                      Get started free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

