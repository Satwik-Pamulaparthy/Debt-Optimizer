'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingDown, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }

    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      const msg = signInError.message.toLowerCase();
      if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('email') || msg.includes('password')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(signInError.message);
      }
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-mesh pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <TrendingDown className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-white">DebtOptimizer</span>
        </div>

        <div className="glass-bright rounded-2xl p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
            <p className="text-slate-400 text-sm">Sign in to access your debt payoff plan</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                autoComplete="email"
                onChange={e => { setEmail(e.target.value); setError(''); }}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 pl-11 pr-4
                  text-white text-sm placeholder-slate-600
                  focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                autoComplete="current-password"
                onChange={e => { setPassword(e.target.value); setError(''); }}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 pl-11 pr-11
                  text-white text-sm placeholder-slate-600
                  focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs">
                {error}
              </motion.p>
            )}

            {/* Forgot password */}
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign In <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
