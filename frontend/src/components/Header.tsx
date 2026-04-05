'use client';

import ConnectWallet from './ConnectWallet';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const mobileNavId = useId();
  const mobileNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
      if (e.key !== 'Tab') return;

      const focusable = mobileNavRef.current?.querySelectorAll<HTMLElement>(
        'a, button, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(() => {
      const firstFocusable = mobileNavRef.current?.querySelector<HTMLElement>('a, button, [tabindex]:not([tabindex="-1"])');
      firstFocusable?.focus?.();
    }, 0);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-gray-950/90 backdrop-blur-2xl border-b border-white/10 shadow-lg shadow-black/20 py-1' 
        : 'bg-gray-950/40 backdrop-blur-md border-b border-white/5 py-3'
    }`}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-6 focus:left-6 focus:z-[100] h-12 px-6 flex items-center justify-center rounded-xl bg-purple-600 text-white font-bold shadow-[0_10px_30px_rgba(168,85,247,0.4)] transition-all active:scale-95 outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-600"
      >
        Skip to content
      </a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 group/logo outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-4 focus-visible:ring-offset-gray-950 rounded-xl transition-all"
            aria-label="StackPulse Home"
          >
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/10 group-hover/logo:shadow-purple-500/40 transition-all duration-300"
              aria-hidden="true"
            >
              <svg 
                className="w-5 h-5 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M13 10V3L4 14h7v7l9-11h-7z" 
                />
              </svg>
            </motion.div>
            <span className="text-xl font-black bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent tracking-tight">
              StackPulse
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8" aria-label="Primary">
            <Link 
              href="/#features" 
              className="group/nav text-sm font-semibold text-gray-400 hover:text-white transition-all duration-300 px-3 py-1.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 hover:bg-white/5 hover:scale-105 active:scale-95 aria-[current=page]:bg-white/10 aria-[current=page]:text-white aria-[current=page]:shadow-sm relative"
              aria-current={pathname === '/#features' ? 'page' : undefined}
            >
              Features
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-500 rounded-full opacity-0 group-aria-[current=page]/nav:opacity-100 transition-opacity" />
            </Link>
            <Link 
              href="/#pricing" 
              className="group/nav text-sm font-semibold text-gray-400 hover:text-white transition-all duration-300 px-3 py-1.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 hover:bg-white/5 hover:scale-105 active:scale-95 aria-[current=page]:bg-white/10 aria-[current=page]:text-white aria-[current=page]:shadow-sm relative"
              aria-current={pathname === '/#pricing' ? 'page' : undefined}
            >
              Pricing
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-500 rounded-full opacity-0 group-aria-[current=page]/nav:opacity-100 transition-opacity" />
            </Link>
            <Link 
              href="/#stats" 
              className="group/nav text-sm font-semibold text-gray-400 hover:text-white transition-all duration-300 px-3 py-1.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 hover:bg-white/5 hover:scale-105 active:scale-95 aria-[current=page]:bg-white/10 aria-[current=page]:text-white aria-[current=page]:shadow-sm relative"
              aria-current={pathname === '/#stats' ? 'page' : undefined}
            >
              Live Stats
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-500 rounded-full opacity-0 group-aria-[current=page]/nav:opacity-100 transition-opacity" />
            </Link>
            <Link 
              href="/register"
              className="group/nav text-sm font-bold text-purple-400 hover:text-purple-300 transition-all px-3 py-1.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 hover:bg-purple-500/5 aria-[current=page]:bg-purple-500/10 aria-[current=page]:text-white aria-[current=page]:shadow-sm relative"
              aria-current={pathname === '/register' ? 'page' : undefined}
            >
              Register
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-400 rounded-full opacity-0 group-aria-[current=page]/nav:opacity-100 transition-opacity" />
            </Link>
            <a 
              href="https://docs.hiro.so/stacks/chainhook" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-semibold text-gray-400 hover:text-white transition-all px-3 py-1.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 hover:bg-white/5 flex items-center gap-1.5"
            >
              Docs
              <span className="sr-only">(opens in new tab)</span>
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/5 bg-white/5 text-gray-200 hover:bg-white/10 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 hover:shadow-lg hover:shadow-purple-500/20"
              aria-expanded={isOpen}
              aria-controls={mobileNavId}
              aria-label={isOpen ? 'Close mobile menu' : 'Open mobile menu'}
              onClick={() => setIsOpen((v) => !v)}
            >
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Wallet Connection */}
            <ConnectWallet />
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-all ${
                  scrolled ? 'top-[72px]' : 'top-[88px]'
                }`}
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
              />
              <motion.div
                ref={mobileNavRef}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={`md:hidden fixed left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-2xl border-b border-white/10 shadow-2xl shadow-purple-500/10 transition-all ${
                  scrolled ? 'top-[72px]' : 'top-[88px]'
                }`}
                id={mobileNavId}
                role="dialog"
                aria-modal="true"
                aria-label="Mobile navigation menu"
              >
                <nav className="px-4 py-6 space-y-2" aria-label="Mobile Navigation">
                  {['Features', 'Pricing', 'Live Stats'].map((item, i) => (
                    <motion.div
                      key={item}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        href={`/#${item.toLowerCase().replace(' ', '')}`}
                        className="block rounded-2xl px-5 py-3.5 text-base font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 active:scale-[0.98] aria-[current=page]:bg-white/10 aria-[current=page]:text-white"
                        aria-current={pathname === `/#${item.toLowerCase().replace(' ', '')}` ? 'page' : undefined}
                        onClick={() => setIsOpen(false)}
                      >
                        {item}
                      </Link>
                    </motion.div>
                  ))}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="pt-4 px-2"
                  >
                    <Link
                      href="/register"
                      className="flex items-center justify-center h-14 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 text-base font-black text-white transition-all shadow-[0_10px_30px_-5px_rgba(168,85,247,0.4)] hover:shadow-[0_15px_35px_-5px_rgba(168,85,247,0.5)] hover:scale-[1.02] active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 tracking-tight"
                      aria-current={pathname === '/register' ? 'page' : undefined}
                      onClick={() => setIsOpen(false)}
                    >
                      Get Started
                    </Link>
                  </motion.div>
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                  >
                    <a
                      href="https://docs.hiro.so/stacks/chainhook"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center justify-center h-14 rounded-2xl bg-white/5 border border-white/5 text-base font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 active:scale-[0.98]"
                      onClick={() => setIsOpen(false)}
                    >
                      View Documentation
                      <span className="sr-only">(opens in new tab)</span>
                    </a>
                  </motion.div>
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
