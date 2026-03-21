'use client';

import Link from 'next/link';
import { Twitter, Github, Linkedin, Mail, ExternalLink, Zap } from 'lucide-react';

const footerLinks = {
  product: [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Live Stats', href: '/#stats' },
    { label: 'Register', href: '/register' },
  ],
  resources: [
    { label: 'Documentation', href: 'https://docs.hiro.so/stacks/chainhook' },
    { label: 'Stacks Network', href: 'https://stacks.co' },
    { label: 'Hiro Explorer', href: 'https://explorer.hiro.so' },
    { label: 'API Reference', href: '#' },
  ],
  company: [
    { label: 'About', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Twitter', href: '#' },
    { label: 'GitHub', href: 'https://github.com/AdekunleBamz/StackPulse' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
};

const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Github, href: 'https://github.com/AdekunleBamz/StackPulse', label: 'GitHub' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Mail, href: 'mailto:support@stackpulse.io', label: 'Email' },
];

export default function Footer() {
  return (
    <footer className="relative bg-gray-950 border-t border-white/[0.02] pt-20 pb-10 px-4 sm:px-6 lg:px-8 mt-12 overflow-hidden" aria-labelledby="footer-heading">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
      <h2 id="footer-heading" className="sr-only">Footer</h2>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2 pr-8">
            <Link href="/" className="flex items-center space-x-2.5 mb-8 group/footer-logo">
              <div className="w-11 h-11 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover/footer-logo:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-white" fill="white" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tight">
                StackPulse
              </span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm font-medium">
              Real-time blockchain monitoring and alerting platform for the Stacks ecosystem. 
              Get instant notifications for whale transfers, contract deployments, and NFT mints.
            </p>
            <div className="flex space-x-3 mt-8">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-11 h-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:border-purple-500/40 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all duration-300 hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="w-5 h-5 stroke-[1.5]" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <nav aria-label="Product Links">
            <h3 className="text-white font-bold text-[11px] uppercase tracking-[0.2em] mb-6 opacity-90">Product</h3>
            <ul className="space-y-4">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-gray-500 hover:text-purple-400 transition-all duration-200 text-sm font-medium hover:translate-x-1 inline-block">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Resource Links">
            <h3 className="text-white font-bold text-[11px] uppercase tracking-[0.2em] mb-6 opacity-90">Resources</h3>
            <ul className="space-y-4">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="text-gray-500 hover:text-purple-400 transition-all duration-200 text-sm font-medium hover:translate-x-1 flex items-center gap-1 group/flink"
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {link.label}
                    {link.href.startsWith('http') && (
                      <>
                        <ExternalLink className="w-3 h-3 opacity-30 group-hover/flink:opacity-100 transition-opacity" aria-hidden="true" />
                        <span className="sr-only">(opens in new tab)</span>
                      </>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
 
          <nav aria-label="Legal Links">
            <h3 className="text-white font-bold text-[11px] uppercase tracking-[0.2em] mb-6 opacity-90">Legal</h3>
            <ul className="space-y-4">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-gray-500 hover:text-purple-400 transition-all duration-200 text-sm font-medium hover:translate-x-1 inline-block">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/[0.03] flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-600 text-[11px] font-medium tracking-tight">
            © {new Date().getFullYear()} StackPulse Labs. All rights reserved.
          </p>
          <div className="flex items-center gap-8">
            <span className="flex items-center gap-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
              Mainnet Live
            </span>
            <div className="h-4 w-px bg-gray-900 hidden md:block opacity-50" />
            <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">
              Built with <span className="text-purple-500/80">❤</span> for Stacks
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
