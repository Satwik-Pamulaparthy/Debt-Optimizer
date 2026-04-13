'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingDown, LayoutDashboard, CreditCard, Zap, Calendar,
  Lightbulb, Settings, Bell, LogOut, Menu, X, ChevronRight,
} from 'lucide-react';
import { useStore, selectUnreadCount } from '@/lib/store';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/accounts', label: 'Accounts & Debts', icon: CreditCard },
  { href: '/strategy', label: 'Strategy', icon: Zap },
  { href: '/payments', label: 'Payment Plan', icon: Calendar },
  { href: '/insights', label: 'Insights', icon: Lightbulb },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useStore(s => s.user);
  const unread = useStore(selectUnreadCount);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    useStore.getState().reset();
    router.push('/login');
  };

  const NavLink = ({ href, label, icon: Icon }: typeof NAV_ITEMS[0]) => {
    const active = pathname === href || pathname.startsWith(href + '/');
    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
          active
            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20'
            : 'text-slate-400 hover:text-white hover:bg-white/5',
        )}
      >
        <Icon className={cn('w-4.5 h-4.5 flex-shrink-0', active ? 'text-indigo-400' : '')} style={{ width: 18, height: 18 }} />
        <span>{label}</span>
        {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-indigo-400/60" />}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
          <TrendingDown className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-white text-sm tracking-tight">DebtOptimizer</span>
          <p className="text-[10px] text-slate-600 leading-none mt-0.5">Financial Freedom Tool</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">Menu</p>
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
        <div className="pt-4 mt-4 border-t border-white/[0.06]">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">Account</p>
          <Link
            href="/settings"
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              pathname === '/settings' ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-400 hover:text-white hover:bg-white/5',
            )}
          >
            <Settings style={{ width: 18, height: 18 }} />
            <span>Settings</span>
          </Link>
        </div>
      </nav>

      {/* User */}
      {user && (
        <div className="px-3 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors group">
            <Link href="/settings" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 flex-1 min-w-0" title="Go to Profile">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate group-hover:text-indigo-300 transition-colors">{user.name}</p>
                <p className="text-slate-500 text-[10px] truncate">{user.email}</p>
              </div>
            </Link>
            <button onClick={handleSignOut} className="text-slate-600 hover:text-red-400 transition-colors p-1" title="Sign out">
              <LogOut style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 bg-[#0a0b15] border-r border-white/[0.06] h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-[#0a0b15]/90 backdrop-blur border-b border-white/[0.06] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <TrendingDown className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-white text-sm">DebtOptimizer</span>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <Link href="/settings" className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold mr-1">
              {user.name.charAt(0).toUpperCase()}
            </Link>
          )}
          {unread > 0 && (
            <div className="relative">
              <Bell className="w-5 h-5 text-slate-400" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">{unread}</span>
            </div>
          )}
          <button onClick={() => setMobileOpen(true)} className="p-1 text-slate-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-64 bg-[#0a0b15] border-r border-white/[0.06]"
            >
              <button onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
