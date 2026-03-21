'use client';

import ConnectWallet from './ConnectWallet';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const mobileNavId = useId();
  const mobileNavRef = useRef<HTMLDivElement>(null);

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/70 backdrop-blur-md border-b border-white/5 shadow-sm shadow-white/[0.02]">
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
            <div 
              className="w-9 h-9 bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/10 group-hover/logo:scale-110 group-hover/logo:shadow-purple-500/30 transition-all duration-300"
              aria-hidden="true"
            >
              <svg 
                className="w-5 h-5 text-white transform group-hover/logo:rotate-12 transition-transform" 
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
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent tracking-tight">
              StackPulse
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8" aria-label="Primary">
            <Link 
              href="/#features" 
              className="text-sm font-semibold text-gray-400 hover:text-white transition-all px-3 py-1.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 hover:bg-white/5 aria-[current=page]:bg-white/10 aria-[current=page]:text-white aria-[current=page]:shadow-sm"
              aria-current={pathname === '/#features' ? 'page' : undefined}
            >
              Features
            </Link>
            <Link 
              href="/#pricing" 
              className="text-sm font-semibold text-gray-400 hover:text-white transition-all px-3 py-1.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 hover:bg-white/5 aria-[current=page]:bg-white/10 aria-[current=page]:text-white aria-[current=page]:shadow-sm"
              aria-current={pathname === '/#pricing' ? 'page' : undefined}
            >
              Pricing
            </Link>
            <Link 
              href="/#stats" 
              className="text-sm font-semibold text-gray-400 hover:text-white transition-all px-3 py-1.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 hover:bg-white/5 aria-[current=page]:bg-white/10 aria-[current=page]:text-white aria-[current=page]:shadow-sm"
              aria-current={pathname === '/#stats' ? 'page' : undefined}
            >
              Live Stats
            </Link>
            <Link 
              href="/register"
              className="text-sm font-bold text-purple-400 hover:text-purple-300 transition-all px-3 py-1.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 hover:bg-purple-500/5 aria-[current=page]:bg-purple-500/10 aria-[current=page]:text-white aria-[current=page]:shadow-sm"
              aria-current={pathname === '/register' ? 'page' : undefined}
            >
              Register
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
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/5 bg-white/5 text-gray-200 hover:bg-white/10 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
              aria-expanded={isOpen}
              aria-controls={mobileNavId}
              aria-label={isOpen ? 'Close mobile menu' : 'Open mobile menu'}
              onClick={() => setIsOpen((v) => !v)}
            >
              {isOpen ? <X className="w-5 h-5 transition-transform duration-300 rotate-0" /> : <Menu className="w-5 h-5 transition-transform duration-300 rotate-0" />}
            </button>

            {/* Wallet Connection */}
            <ConnectWallet />
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 top-16 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <div
              ref={mobileNavRef}
              className="md:hidden fixed top-16 left-0 right-0 z-50 bg-gray-950 border-b border-gray-800 shadow-2xl animate-slide-down"
              id={mobileNavId}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation menu"
            >
              <nav className="px-4 py-6 space-y-2" aria-label="Mobile Navigation">
                <Link
                  href="/#features"
                  className="block rounded-2xl px-5 py-3.5 text-base font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 active:scale-[0.98] aria-[current=page]:bg-white/10 aria-[current=page]:text-white"
                  aria-current={pathname === '/#features' ? 'page' : undefined}
                  onClick={() => setIsOpen(false)}
                >
                  Features
                </Link>
                <Link
                  href="/#pricing"
                  className="block rounded-2xl px-5 py-3.5 text-base font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 active:scale-[0.98] aria-[current=page]:bg-white/10 aria-[current=page]:text-white"
                  aria-current={pathname === '/#pricing' ? 'page' : undefined}
                  onClick={() => setIsOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  href="/#stats"
                  className="block rounded-2xl px-5 py-3.5 text-base font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 active:scale-[0.98] aria-[current=page]:bg-white/10 aria-[current=page]:text-white"
                  aria-current={pathname === '/#stats' ? 'page' : undefined}
                  onClick={() => setIsOpen(false)}
                >
                  Live Stats
                </Link>
                <div className="pt-4 px-2">
                  <Link
                    href="/register"
                    className="flex items-center justify-center h-14 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 text-base font-black text-white transition-all shadow-[0_10px_30px_-5px_rgba(168,85,247,0.4)] active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 tracking-tight"
                    aria-current={pathname === '/register' ? 'page' : undefined}
                    onClick={() => setIsOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
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
              </nav>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
