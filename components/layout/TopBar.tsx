'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, LogOut, User, Settings, Mail, MapPin } from 'lucide-react';
import { useStore, selectUnreadCount } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { getCurrencyForCountry } from '@/lib/currencies';
import { createClient } from '@/lib/supabase/client';
import Badge from '@/components/ui/Badge';
import { useRouter } from 'next/navigation';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const user = useStore(s => s.user);
  const notifications = useStore(s => s.notifications);
  const unread = useStore(selectUnreadCount);
  const { markNotificationRead, clearAllNotifications, reset } = useStore();
  const router = useRouter();

  const currency = user?.currency ?? 'USD';
  const currencyInfo = getCurrencyForCountry(user?.country ?? 'US');

  const notifTypeStyle: Record<string, string> = {
    due_soon: 'text-orange-400',
    due_today: 'text-red-400',
    overdue: 'text-red-500',
    milestone: 'text-emerald-400',
    tip: 'text-indigo-400',
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    reset();
    router.replace('/login');
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06] flex-shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Budget pill */}
        {user && user.monthlyIncome > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 glass rounded-full text-xs">
            <span className="text-slate-500">Monthly budget:</span>
            <span className="text-emerald-400 font-semibold">
              {formatCurrency(Math.max(0, user.monthlyIncome - user.monthlyExpenses), currency)}
            </span>
          </div>
        )}

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl glass hover:bg-white/8 transition-colors text-slate-400 hover:text-white"
          >
            <Bell className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 z-20 w-80 bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                    <h3 className="text-white font-medium text-sm">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {unread > 0 && (
                        <button onClick={() => {
                          notifications.filter(n => !n.read).forEach(n => markNotificationRead(n.id));
                        }} className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                      <button onClick={() => setNotifOpen(false)} className="text-slate-500 hover:text-white p-0.5">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto scrollbar-thin">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-sm">No notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`px-4 py-3 border-b border-white/[0.04] cursor-pointer hover:bg-white/4 transition-colors ${!n.read ? 'bg-indigo-600/5' : ''}`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-indigo-400' : 'bg-transparent'}`} />
                            <div>
                              <p className={`text-xs font-medium ${notifTypeStyle[n.type] || 'text-white'}`}>
                                {n.title}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-white/[0.06]">
                      <button onClick={clearAllNotifications} className="text-xs text-slate-500 hover:text-red-400 transition-colors">
                        Clear all
                      </button>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar + profile dropdown */}
        {user && (
          <div className="relative">
            <button
              onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold hover:ring-2 hover:ring-indigo-400/50 transition-all"
            >
              {user.name.charAt(0).toUpperCase()}
            </button>

            <AnimatePresence>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 z-20 w-64 bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                  >
                    {/* Header */}
                    <div className="px-4 py-4 border-b border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{user.name}</p>
                          <p className="text-slate-400 text-xs truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="px-4 py-3 space-y-2 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span>{user.country}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-slate-500 text-[11px] font-medium">Currency:</span>
                        <span className="text-indigo-300 font-medium">
                          {currencyInfo.symbol} — {currencyInfo.name} ({currencyInfo.code})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-slate-500 text-[11px] font-medium">Member since:</span>
                        <span>{new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-2">
                      <button
                        onClick={() => { setProfileOpen(false); router.push('/settings'); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/6 transition-colors text-left"
                      >
                        <Settings className="w-4 h-4 text-slate-500" />
                        Settings
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
}
