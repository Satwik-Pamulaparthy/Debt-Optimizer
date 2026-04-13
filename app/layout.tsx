import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Debt Optimizer — Your Path to Financial Freedom',
  description:
    'The smartest way to pay off debt. Link your accounts, analyze interest rates, and get a personalized payoff strategy that saves you thousands.',
  keywords: ['debt payoff', 'financial freedom', 'debt snowball', 'debt avalanche', 'personal finance'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💸</text></svg>" />
      </head>
      <body className="min-h-full bg-[#07080f] text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
