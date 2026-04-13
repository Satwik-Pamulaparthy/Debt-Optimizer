'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingDown, Mail, Lock, User, Globe, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { COUNTRIES, getCurrencyForCountry } from '@/lib/currencies';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', country: 'US' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password || !form.country) {
      setError('All fields are required');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const currency = getCurrencyForCountry(form.country);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          country: form.country,
          currency: currency.code,
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes('already registered') || signUpError.message.toLowerCase().includes('already exists')) {
        setError('409: This email is already registered. Please sign in instead.');
      } else {
        setError(signUpError.message);
      }
      return;
    }

    // If email enumeration protection is on, Supabase returns a fake user object with empty identities if the email is already taken
    if (signUpData?.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
      setError('409: This email is already registered. Please sign in instead.');
      return;
    }

    router.push('/onboarding');
  };

  const selectedCurrency = getCurrencyForCountry(form.country);

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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
            <p className="text-slate-400 text-sm">Start your journey to financial freedom today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="password"
                placeholder="Password (min. 8 chars)"
                value={form.password}
                onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">
                Country <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <select
                  value={form.country}
                  onChange={e => setForm(prev => ({ ...prev, country: e.target.value }))}
                  required
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code} className="bg-[#0f1117] text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {form.country && (
                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                  <span className="text-indigo-400 font-medium">{selectedCurrency.symbol}</span>
                  All amounts will be shown in{' '}
                  <span className="text-slate-300">{selectedCurrency.name} ({selectedCurrency.code})</span>
                </p>
              )}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-2.5 rounded-xl p-3 text-sm ${
                  error.startsWith('409')
                    ? 'bg-amber-500/10 border border-amber-500/25 text-amber-300'
                    : 'bg-red-500/10 border border-red-500/25 text-red-400'
                }`}
              >
                <span className="flex-1">
                  {error.startsWith('409')
                    ? 'This email is already registered. Please sign in instead.'
                    : error}
                </span>
                {error.startsWith('409') && (
                  <Link href="/login" className="font-medium underline whitespace-nowrap">Sign in</Link>
                )}
              </motion.div>
            )}

            <p className="text-xs text-slate-500">
              By creating an account you agree that your data is saved in your browser and not transmitted to any server.
            </p>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Create Account & Start <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
