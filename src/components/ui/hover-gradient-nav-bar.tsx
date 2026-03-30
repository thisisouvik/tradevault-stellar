'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

const menuItems = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "About", href: "/about" },
  { label: "Why Stellar?", href: "/why-stellar" },
];

function HoverGradientNavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Auth state
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<any>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    // Handle scroll
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    // Fetch user
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to log out');
    } else {
      toast.success('Logged out successfully');
      setProfileMenuOpen(false);
    }
  };

  return (
    <header
      className="fixed top-0 left-0 w-full z-50 transition-all duration-300"
      style={{
        background: scrolled || mobileMenuOpen ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: scrolled || mobileMenuOpen ? 'blur(16px)' : 'none',
        boxShadow: scrolled || mobileMenuOpen ? '0 1px 24px rgba(5,68,94,0.08)' : 'none',
        borderBottom: scrolled || mobileMenuOpen ? '1px solid rgba(24,154,180,0.12)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">

        {/* Logo */}
        <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 font-extrabold text-2xl tracking-tighter text-[#05445E] hover:text-[#189AB4] transition-colors relative z-50">
          <img src="/logo.png" alt="TradeVault Logo" className="w-8 h-8 object-contain" />
          TradeVault
        </Link>

        {/* Desktop Navigation Items */}
        <nav className="hidden md:flex items-center gap-8">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-bold text-[#05445E] hover:text-[#189AB4] transition-colors duration-200 relative group"
            >
              {item.label}
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-[#189AB4] rounded-full transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* Auth Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-5">
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="w-10 h-10 rounded-full bg-[#D6EFF9] text-[#05445E] flex items-center justify-center font-bold relative transition-colors border border-[#189AB4]/30 hover:bg-[#189AB4] hover:text-white"
              >
                {user.user_metadata?.name?.charAt(0)?.toUpperCase() || <User className="w-5 h-5" />}
              </button>
              
              <AnimateProfileDropdown 
                isOpen={profileMenuOpen} 
                onClose={() => setProfileMenuOpen(false)} 
                user={user} 
                onLogout={handleLogout} 
              />
            </div>
          ) : (
            <Link href="/auth/signup">
              <button className="rounded-full bg-[#05445E] hover:bg-[#189AB4] text-white px-6 py-2 text-sm font-semibold transition-all duration-200 shadow-md hover:-translate-y-px">
                Join Us
              </button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="md:hidden flex items-center gap-3 relative z-50">
          {user ? (
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="sm:hidden">
              <button className="rounded-full bg-[#D6EFF9] text-[#05445E] px-4 py-1.5 text-xs font-bold border border-[#189AB4]/30 flex items-center gap-1.5">
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
              </button>
            </Link>
          ) : (
            <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)} className="sm:hidden">
              <button className="rounded-full bg-[#05445E] text-white px-5 py-1.5 text-xs font-semibold shadow-sm">
                Join Us
              </button>
            </Link>
          )}

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-[#05445E] p-1.5 rounded-md hover:bg-[#189AB4]/10 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div 
        className={`md:hidden absolute top-16 left-0 w-full bg-white border-b border-[#189AB4]/10 shadow-xl transition-all duration-300 ease-in-out overflow-hidden z-40 ${
          mobileMenuOpen ? 'max-h-[600px] opacity-100 py-6' : 'max-h-0 opacity-0 py-0'
        }`}
      >
        <div className="px-6 space-y-6">
          <nav className="flex flex-col gap-5">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-bold text-[#05445E] hover:text-[#189AB4] transition-colors border-b border-[#189AB4]/10 pb-3"
              >
                {item.label}
              </Link>
            ))}
            
            {user && (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-bold text-[#05445E] hover:text-[#189AB4] transition-colors border-b border-[#189AB4]/10 pb-3 flex items-center gap-2"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-lg font-bold text-red-600 hover:text-red-700 transition-colors border-b border-[#189AB4]/10 pb-3 flex items-center gap-2 text-left w-full"
                >
                  <LogOut className="w-5 h-5" />
                  Log out
                </button>
              </>
            )}
          </nav>
          
        </div>
      </div>

    </header>
  );
}

// Separate component to keep things clean
function AnimateProfileDropdown({ isOpen, onClose, user, onLogout }: { isOpen: boolean, onClose: () => void, user: any, onLogout: () => void }) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose}></div>
      <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-[0_10px_40px_rgba(5,68,94,0.1)] border border-[#189AB4]/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <p className="text-sm font-extrabold text-[#05445E] truncate">{user?.user_metadata?.name || 'TradeVault User'}</p>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{user?.email}</p>
        </div>
        <div className="p-1.5 flex flex-col gap-0.5">
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-bold text-[#05445E] hover:text-[#189AB4] hover:bg-[#D6EFF9]/50 transition-colors">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors text-left">
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </div>
    </>
  );
}

export default HoverGradientNavBar;
