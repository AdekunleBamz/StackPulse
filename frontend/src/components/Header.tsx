'use client';

import ConnectWallet from './ConnectWallet';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 rounded-md bg-gray-900 px-3 py-2 text-sm text-white"
      >
        Skip to content
      </a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <svg 
                className="w-5 h-5 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 10V3L4 14h7v7l9-11h-7z" 
                />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              StackPulse
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8" aria-label="Primary">
            <Link href="/#features" className="text-gray-300 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="/#pricing" className="text-gray-300 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/#stats" className="text-gray-300 hover:text-white transition-colors">
              Live Stats
            </Link>
            <Link 
              href="/register"
              className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
            >
              Register
            </Link>
            <a 
              href="https://docs.hiro.so/stacks/chainhook" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Docs
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-800 bg-gray-900/40 text-gray-200 hover:bg-gray-900 transition-colors"
              aria-expanded={isOpen}
              aria-controls={mobileNavId}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setIsOpen((v) => !v)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Wallet Connection */}
            <ConnectWallet />
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 top-16 z-40 bg-black/40"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <div
              ref={mobileNavRef}
              className="md:hidden pb-4 relative z-50"
              id={mobileNavId}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation menu"
            >
            <nav className="mt-2 rounded-xl border border-gray-800 bg-gray-950/80 backdrop-blur-md p-2" aria-label="Mobile">
              <Link
                href="/#features"
                className="block rounded-lg px-3 py-2 text-gray-200 hover:bg-gray-900/60 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Features
              </Link>
              <Link
                href="/#pricing"
                className="block rounded-lg px-3 py-2 text-gray-200 hover:bg-gray-900/60 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/#stats"
                className="block rounded-lg px-3 py-2 text-gray-200 hover:bg-gray-900/60 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Live Stats
              </Link>
              <Link
                href="/register"
                className="block rounded-lg px-3 py-2 font-medium text-purple-300 hover:bg-gray-900/60 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Register
              </Link>
              <a
                href="https://docs.hiro.so/stacks/chainhook"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg px-3 py-2 text-gray-200 hover:bg-gray-900/60 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Docs
              </a>
            </nav>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
