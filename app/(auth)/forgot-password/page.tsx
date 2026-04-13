'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { TrendingDown, Mail, Lock, ArrowRight, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

type Step = 'email' | 'sent' | 'reset' | 'done';
const VALID_STEPS: Step[] = ['email', 'sent', 'reset', 'done'];

export default function ForgotPasswordPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const urlStep      = searchParams.get('step') as Step;
  const [step, setStep] = useState<Step>(VALID_STEPS.includes(urlStep) ? urlStep : 'email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Please enter your email'); return; }

    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/forgot-password?step=reset`,
    });
    setLoading(false);

    if (resetError) { setError(resetError.message); return; }
    setStep('sent');
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newPassword) { setError('Please enter a new password'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (updateError) { setError(updateError.message); return; }
    setStep('done');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-mesh pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <TrendingDown className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-white">DebtOptimizer</span>
        </div>

        <div className="glass-bright rounded-2xl p-8">
          <AnimatePresence mode="wait">

            {step === 'email' && (
              <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-white mb-1">Reset password</h1>
                  <p className="text-slate-400 text-sm">Enter the email address linked to your account and we'll send you a reset link.</p>
                </div>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs">{error}</motion.p>}
                  <Button type="submit" loading={loading} className="w-full" size="lg">
                    Send Reset Link <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              </motion.div>
            )}

            {step === 'sent' && (
              <motion.div key="sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-indigo-500/15 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-indigo-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
                <p className="text-slate-400 text-sm mb-2">We sent a password reset link to</p>
                <p className="text-indigo-300 font-medium text-sm mb-6">{email}</p>
                <p className="text-slate-500 text-xs">Click the link in the email to set a new password. Check your spam folder if you don't see it.</p>
              </motion.div>
            )}

            {step === 'reset' && (
              <motion.div key="reset" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-white mb-1">Set new password</h1>
                  <p className="text-slate-400 text-sm">Choose a strong password for your account.</p>
                </div>
                <form onSubmit={handleReset} className="space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      placeholder="New password (min. 8 chars)"
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setError(''); }}
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 pl-11 pr-11 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 pl-11 pr-11 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword.length > 0 && (
                    <div className="flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                          newPassword.length >= [4, 6, 8, 12][i]
                            ? ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'][i]
                            : 'bg-white/10'
                        }`} />
                      ))}
                    </div>
                  )}
                  {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs">{error}</motion.p>}
                  <Button type="submit" loading={loading} className="w-full" size="lg">
                    Reset Password <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              </motion.div>
            )}

            {step === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Password updated!</h1>
                <p className="text-slate-400 text-sm mb-6">Your password has been reset successfully. You can now sign in with your new password.</p>
                <Button onClick={() => router.push('/login')} className="w-full" size="lg">
                  Sign In <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

          </AnimatePresence>

          {step !== 'done' && step !== 'sent' && (
            <div className="mt-5 text-center">
              <Link href="/login" className="text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1 transition-colors">
                <ArrowLeft className="w-3 h-3" /> Back to sign in
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
