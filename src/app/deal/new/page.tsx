import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CreateDealForm from '@/components/CreateDealForm'
import { ArrowLeft, Shield } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Create New Contract' }

export default async function NewDealPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin?redirectTo=/deal/new')

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto h-full px-6 flex items-center justify-between">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="TradeVault" className="w-6 h-6 object-contain" />
            <span className="text-[#05445E] font-bold text-lg tracking-tight hidden sm:block">TradeVault</span>
          </Link>
          <div className="w-[124px] hidden sm:block" />{/* Spacer to keep center alignment */}
        </div>
      </header>

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-10">
        {/* Title */}
        <div className="mb-8 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Create new contract</h1>
          <p className="text-gray-500 text-sm">
            Fill in the trade terms below. Once deployed, all terms are locked securely on the Algorand blockchain and cannot be modified.
          </p>
        </div>

        <CreateDealForm />
      </main>
    </div>
  )
}
