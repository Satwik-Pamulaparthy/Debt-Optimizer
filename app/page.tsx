'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  TrendingDown, Zap, Shield, Target, ChevronRight,
  BarChart3, Bell, CreditCard, ArrowRight, CheckCircle,
} from 'lucide-react';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] as any },
});

const FEATURES = [
  { icon: CreditCard, title: 'Link All Accounts', desc: 'Connect credit cards, loans, and bank accounts in one place for a complete picture.', color: 'from-indigo-500 to-violet-500', shadow: 'shadow-indigo-500/20' },
  { icon: Zap, title: 'Smart Strategy Engine', desc: 'Avalanche or Snowball — we pick the path that saves you the most.', color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
  { icon: Target, title: 'Due-Date Intelligence', desc: 'Never pay a late fee again. We factor in every due date and prioritize payments automatically.', color: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20' },
  { icon: BarChart3, title: 'Visual Progress', desc: 'Interactive charts showing your debt-free journey month by month.', color: 'from-pink-500 to-rose-500', shadow: 'shadow-pink-500/20' },
  { icon: Bell, title: 'Smart Notifications', desc: 'Get alerts before due dates and tips to pay off faster.', color: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20' },
  { icon: Shield, title: 'Private & Secure', desc: 'Your data stays local in your browser. Nothing leaves your device.', color: 'from-violet-500 to-purple-500', shadow: 'shadow-violet-500/20' },
];

const STATS = [
  { value: '$12,400', label: 'Average interest saved' },
  { value: '38 mo', label: 'Average time freed' },
  { value: '5 min', label: 'To build your plan' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Add your accounts & debts', desc: 'Enter your credit cards, loans, and bank balances — or use our demo data to explore.' },
  { step: '02', title: 'Tell us your income & expenses', desc: 'We calculate exactly how much is available to put toward debt each month.' },
  { step: '03', title: 'Get your personalized plan', desc: 'See three payoff strategies side-by-side and pick the one that fits your life.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07080f] overflow-x-hidden">
      <div className="fixed inset-0 bg-mesh pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between max-w-6xl mx-auto px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <TrendingDown className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">DebtOptimizer</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/contact" className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2">Contact</Link>
          <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2">Sign in</Link>
          <Link href="/register" className="text-sm font-medium px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-28 text-center">
        <motion.div {...fadeUp(0.1)}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 text-sm text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Free · sign-up required
          </div>
        </motion.div>
        <motion.h1 {...fadeUp(0.2)} className="text-5xl md:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
          Crush your debt.<br /><span className="gradient-text">Keep your money.</span>
        </motion.h1>
        <motion.p {...fadeUp(0.35)} className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
          Enter your accounts and let our optimization engine calculate the{' '}
          <span className="text-white font-medium">exact payoff order</span> that saves you the most in interest — sometimes tens of thousands of dollars.
        </motion.p>
        <motion.div {...fadeUp(0.45)} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register" className="inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-lg rounded-2xl shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]">
            Build My Plan — Free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-4 glass hover:bg-white/8 text-slate-300 hover:text-white rounded-2xl font-medium transition-all text-sm">
            View Demo Dashboard
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.7 }}
          className="grid grid-cols-3 gap-6 max-w-xl mx-auto mt-20"
        >
          {STATS.map((s) => (
            <div key={s.label} className="glass rounded-2xl p-5 text-center card-hover">
              <div className="text-3xl font-black gradient-text mb-1">{s.value}</div>
              <div className="text-xs text-slate-500 leading-snug">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white mb-3">Three steps to financial freedom</h2>
          <p className="text-slate-400">Simple, clear, and takes under 5 minutes.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map((item, i) => (
            <motion.div key={item.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="relative">
              {i < 2 && <div className="hidden md:block absolute top-8 left-[calc(100%_-_1rem)] w-8 text-slate-700"><ChevronRight className="w-6 h-6" /></div>}
              <div className="glass rounded-2xl p-6 card-hover">
                <span className="text-5xl font-black text-white/[0.06]">{item.step}</span>
                <h3 className="text-white font-semibold text-lg mt-2 mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white mb-3">Everything you need to get debt-free faster</h2>
          <p className="text-slate-400 max-w-xl mx-auto">A complete financial tool — not just a calculator.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="glass rounded-2xl p-6 card-hover">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg ${f.shadow}`}>
                <f.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>





      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-24 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="glass rounded-3xl p-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/25">
            <TrendingDown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-black text-white mb-4">Start your <span className="gradient-text">debt-free journey</span> today</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">Takes 5 minutes. Completely free. Your data never leaves your browser.</p>
          <Link href="/register" className="inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-lg rounded-2xl shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.02]">
            Get My Free Plan <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.05] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-500 text-sm">DebtOptimizer — Built for financial freedom</span>
          </div>
          <p className="text-slate-600 text-xs">No real financial data required. For educational purposes.</p>
        </div>
      </footer>
    </div>
  );
}
