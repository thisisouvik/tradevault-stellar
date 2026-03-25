'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, User, Shield, CheckCircle2, KeyRound, ShoppingBag, Package, Scale } from 'lucide-react'
import toast from 'react-hot-toast'

type Role = 'seller' | 'buyer' | 'arbitrator'

const ROLES: { value: Role; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'seller',
    label: 'Seller',
    icon: <Package className="w-5 h-5" />,
    description: 'I ship goods and get paid when delivered',
  },
  {
    value: 'buyer',
    label: 'Buyer',
    icon: <ShoppingBag className="w-5 h-5" />,
    description: 'I fund deals and confirm receipt of goods',
  },
  {
    value: 'arbitrator',
    label: 'Arbitrator',
    icon: <Scale className="w-5 h-5" />,
    description: 'I resolve disputes between parties',
  },
]

export default function SignUpPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('seller')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [loading, setLoading] = useState(false)

  // Step 1: Sign up
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
      },
    })

    if (error) {
      toast.error(error.message.includes('rate limit')
        ? 'Too many requests. Please wait a moment and try again.'
        : error.message)
      setLoading(false)
      return
    }

    toast.success('Verification code sent to your email!')
    setStep(2)
    setLoading(false)
  }

  // Step 2: Verify OTP
  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)

    // Verify token type: 'signup' for email confirmations
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup',
    })

    if (verifyError || !verifyData.session) {
      toast.error(verifyError?.message || 'Invalid or expired token. Please try again.')
      setLoading(false)
      return
    }

    toast.success('Account created successfully! Redirecting...')
    setTimeout(() => { window.location.href = '/dashboard' }, 1500)
  }

  const passwordStrength = (pw: string) => {
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    return score
  }

  const strength = passwordStrength(password)
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b91e8', '#10B981'][strength]

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
            src="/signin-illustration.png"
            alt="TradeVault platform details"
            className="drop-shadow-2xl"
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
            src="/signin-illustration.png"
            alt="TradeVault illustration"
            className="drop-shadow-lg"
            style={{ width: '90%', maxWidth: '360px' }}
          />
          <h2 className="mt-6 text-2xl font-extrabold text-[#05445E] text-center">Join TradeVault</h2>
          <p className="mt-2 text-[#189AB4] font-medium text-center max-w-xs leading-relaxed">
            Start trading globally with zero counterparty risk.
          </p>
        </motion.div>
      </div>

      {/* ── Right Panel — Sign Up Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-[#05445E]">Create your account</h1>
            <p className="mt-2 text-slate-500 font-medium">Join the next generation of global trade.</p>
          </div>

          {/* Clean Step Indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-4">
              <div className={`flex flex-col items-center gap-1.5 ${step >= 1 ? 'text-[#05445E]' : 'text-slate-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= 1 ? 'bg-[#05445E] text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
                  {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">Account</span>
              </div>
              <div className={`w-12 h-[2px] mb-5 transition-all duration-300 ${step >= 2 ? 'bg-[#05445E]' : 'bg-slate-200'}`} />
              <div className={`flex flex-col items-center gap-1.5 ${step >= 2 ? 'text-[#05445E]' : 'text-slate-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= 2 ? 'bg-[#05445E] text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
                  2
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">Security</span>
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSignUp}
                  className="space-y-4"
                >
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-bold text-[#05445E] mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Jane Smith"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-[#05445E] bg-slate-50 border border-slate-200 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#189AB4]/20 focus:border-[#189AB4] transition-all"
                      />
                    </div>
                  </div>

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
                    <label className="block text-sm font-bold text-[#05445E] mb-2">Create Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        required
                        className="w-full pl-10 pr-12 py-3 rounded-xl text-sm text-[#05445E] bg-slate-50 border border-slate-200 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#189AB4]/20 focus:border-[#189AB4] transition-all"
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#05445E]">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {password.length > 0 && (
                      <div className="mt-2 pl-1">
                        <div className="flex gap-1 mb-1.5">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ background: i <= strength ? strengthColor : '#E5E7EB' }} />
                          ))}
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: strengthColor }}>{strengthLabel}</p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-bold text-[#05445E] mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showConfirmPw ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repeat your password"
                        required
                        className={`w-full pl-10 pr-12 py-3 rounded-xl text-sm text-[#05445E] bg-slate-50 border outline-none focus:ring-2 transition-all ${
                          confirmPassword && password !== confirmPassword
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-slate-200 focus:border-[#189AB4] focus:ring-[#189AB4]/20'
                        }`}
                      />
                      <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#05445E]">
                        {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Role Dropdown */}
                  <div>
                    <label className="block text-sm font-bold text-[#05445E] mb-2">I am registering as a...</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        {role === 'seller' ? <Package className="w-4 h-4 text-slate-400" />
                          : role === 'buyer' ? <ShoppingBag className="w-4 h-4 text-slate-400" />
                          : <Scale className="w-4 h-4 text-slate-400" />}
                      </div>
                      <select
                        value={role}
                        onChange={e => setRole(e.target.value as Role)}
                        className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-[#05445E] font-medium bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-[#189AB4]/20 focus:border-[#189AB4] transition-all appearance-none cursor-pointer"
                      >
                        {ROLES.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-[#189AB4] font-medium mt-2 ml-1">
                      {ROLES.find(r => r.value === role)?.description}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email || !name || password.length < 8 || password !== confirmPassword}
                    className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#05445E] hover:bg-[#189AB4] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 mt-6"
                  >
                    {loading ? 'Sending Code...' : 'Continue to Verification'}
                  </button>
                  
                </motion.form>
              ) : (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleVerifyOTP}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <p className="text-sm font-semibold text-[#05445E] mb-2">Check your email</p>
                    <p className="text-sm text-slate-500">
                      We've sent an 8-digit confirmation code to <span className="font-bold text-[#05445E]">{email}</span>.
                    </p>
                  </div>

                  {/* Selected role display */}
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#D6EFF9]/50 border border-[#189AB4]/20">
                    <div className="flex items-center gap-2">
                      <span className="text-[#05445E]">{ROLES.find(r => r.value === role)?.icon}</span>
                      <span className="text-sm font-bold text-[#05445E] capitalize">{role} Account</span>
                    </div>
                    <button type="button" onClick={() => setStep(1)} className="text-xs text-[#189AB4] hover:text-[#05445E] font-bold">
                      Edit details
                    </button>
                  </div>

                  {/* OTP Token */}
                  <div>
                    <label className="block text-sm font-bold text-[#05445E] mb-2">Verification Code</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        placeholder="••••••••"
                        required
                        maxLength={8}
                        inputMode="numeric"
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl text-xl text-[#05445E] bg-slate-50 border border-slate-200 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#189AB4]/20 focus:border-[#189AB4] tracking-[0.3em] font-mono text-center transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length < 8}
                    className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#05445E] hover:bg-[#189AB4] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 mt-6"
                  >
                    {loading ? 'Verifying...' : 'Verify & Setup Account'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-center text-sm text-slate-500 font-medium">
                Already have an account?{' '}
                <Link href="/auth/signin" className="text-[#189AB4] hover:text-[#05445E] font-bold transition-colors">
                  Sign in instead
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
