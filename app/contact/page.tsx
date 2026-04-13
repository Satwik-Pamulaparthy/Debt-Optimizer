'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrendingDown, Mail, User, MessageSquare, Send, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#07080f] flex items-center justify-center p-4">
      {/* Background decorations matching the Home/Login pages */}
      <div className="fixed inset-0 bg-mesh pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-[500px]"
      >
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <TrendingDown className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-white">DebtOptimizer</span>
        </div>

        <div className="glass-bright rounded-2xl p-8 shadow-xl shadow-black/40">
          {submitted ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="text-center py-8"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex flex-col items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Message Sent!</h2>
              <p className="text-slate-400 text-sm mb-8">
                Thanks for reaching out. Our support team will get back to you within 24 hours.
              </p>
              <Button 
                onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', message: '' }); }}
                variant="secondary"
                className="w-full"
              >
                Send Another Message
              </Button>
            </motion.div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Get in touch</h1>
                <p className="text-slate-400 text-sm">
                  Have questions about the payoff strategies? Feature request? We'd love to hear from you.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="Your name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-slate-500 pointer-events-none" />
                  <textarea
                    required
                    placeholder="How can we help?"
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" loading={loading} className="w-full" size="lg">
                    Send Message <Send className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-500">
          <a href="mailto:support@debtoptimizer.app" className="hover:text-indigo-400 transition-colors flex items-center gap-2">
            <Mail className="w-4 h-4" /> support@debtoptimizer.app
          </a>
        </div>
      </motion.div>
    </div>
  );
}
