'use client';

import ConnectWallet from './ConnectWallet';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
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
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/#features" className="text-gray-300 hover:text-white transition-colors">
              Features
            </a>
            <a href="/#pricing" className="text-gray-300 hover:text-white transition-colors">
              Pricing
            </a>
            <a href="/#stats" className="text-gray-300 hover:text-white transition-colors">
              Live Stats
            </a>
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

          {/* Wallet Connection */}
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}
