'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Incorrect email or password. Please try again.')
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Please verify your email address before signing in.')
      } else {
        toast.error(error.message)
      }
      setLoading(false)
      return
    }

    toast.success('Welcome back! Redirecting...')
    setTimeout(() => window.location.href = redirectTo, 1000)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">

      {/* ── Left Panel — Illustration (Desktop) ── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-[#D6EFF9]"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative z-10 flex flex-col items-center px-8 max-w-2xl w-full"
        >
          <img
            src="/logistics-illustration.png"
            alt="TradeVault secure trading"
            className="drop-shadow-2xl object-contain"
            style={{ width: '130%', maxWidth: 'none' }}
          />
        </motion.div>
      </div>

      {/* ── Mobile Illustration ── */}
      <div className="lg:hidden relative overflow-hidden flex flex-col items-center justify-center px-6 pt-10 pb-6 bg-[#D6EFF9]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center mt-6"
        >
          <img
            src="/logistics-illustration.png"
            alt="TradeVault secure trading"
            className="drop-shadow-lg"
            style={{ width: '90%', maxWidth: '360px' }}
          />
          <h2 className="mt-6 text-2xl font-extrabold text-[#05445E] text-center">Welcome Back</h2>
          <p className="mt-2 text-[#189AB4] font-medium text-center max-w-xs leading-relaxed">
            Sign in to manage your cross-border deals securely.
          </p>
        </motion.div>
      </div>

      {/* ── Right Panel — Sign In Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-[#05445E]">Sign in to your account</h1>
            <p className="mt-2 text-slate-500 font-medium">Please enter your credentials to access your vault.</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <form onSubmit={handleSignIn} className="space-y-5">
              
              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-[#05445E] mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-[#05445E] bg-slate-50 border border-slate-200 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#189AB4]/20 focus:border-[#189AB4] transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold text-[#05445E] mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-12 py-3 rounded-xl text-sm text-[#05445E] bg-slate-50 border border-slate-200 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#189AB4]/20 focus:border-[#189AB4] transition-all"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#05445E] transition-colors p-1">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button type="button" className="text-xs text-[#189AB4] font-bold hover:text-[#05445E] transition-colors">
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#05445E] hover:bg-[#189AB4] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 mt-4"
              >
                {loading ? 'Authenticating...' : 'Sign In Now'}
              </button>
            </form>

            <div className="border-t border-slate-100 mt-8 pt-6">
              <p className="text-center text-sm text-slate-500 font-medium">
                Don't have an account yet?{' '}
                <Link href="/auth/signup" className="text-[#189AB4] hover:text-[#05445E] font-bold transition-colors">
                  Create one now
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  )
}
