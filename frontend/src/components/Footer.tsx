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
  { icon: Mail, href: 'mailto:support@stackpulse.io', label: 'Email support' },
];

export default function Footer() {
  return (
    <footer className="relative bg-gray-950 border-t border-white/[0.02] pt-24 pb-20 sm:pt-20 sm:pb-10 px-4 sm:px-6 lg:px-8 mt-12 overflow-hidden" aria-labelledby="footer-heading">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" aria-hidden="true" />
      <h2 id="footer-heading" className="sr-only">Footer</h2>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-12 mb-20">
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-2 sm:pr-8">
            <Link href="/" className="flex items-center space-x-3.5 mb-10 group/footer-logo" title="Go to StackPulse home">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center shadow-[0_15px_35px_-5px_rgba(168,85,247,0.35)] group-hover/footer-logo:scale-110 group-hover/footer-logo:rotate-6 transition-all duration-500 relative overflow-hidden ring-1 ring-white/10">
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/footer-logo:opacity-100 transition-opacity" />
                <Zap className="w-6 h-6 text-white relative z-10" fill="white" />
              </div>
              <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-gray-500 tracking-tight">
                StackPulse
              </span>
            </Link>
            <p className="text-gray-400 leading-[1.8] max-w-sm font-medium text-[13.5px]">
              Real-time blockchain monitoring and alerting platform for the Stacks ecosystem. 
              Get instant notifications for whale transfers, contract deployments, and NFT mints.
            </p>
            <div className="flex space-x-3 mt-8">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-11 h-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:border-purple-500/40 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all duration-500 hover:-translate-y-1 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 touch-manipulation"
                  aria-label={social.label}
                  title={social.label}
                  target={social.href.startsWith('mailto:') ? undefined : '_blank'}
                  rel={social.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                >
                  <social.icon className="w-5 h-5 stroke-[1.5]" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <nav aria-label="Product Links">
            <h3 className="text-white/40 font-black text-[11px] uppercase tracking-[0.25em] mb-7">Product</h3>
            <ul className="space-y-4">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href} 
                    className="text-gray-400 hover:text-white transition-all duration-300 text-[13px] font-semibold hover:translate-x-1 px-2 py-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 -ml-2"
                    title={link.label}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Resource Links">
            <h3 className="text-white/40 font-black text-[11px] uppercase tracking-[0.25em] mb-7">Resources</h3>
            <ul className="space-y-4">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="text-gray-500 hover:text-purple-400 transition-all duration-200 text-sm font-medium hover:translate-x-1 flex items-center gap-1 group/flink rounded-md outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {link.label}
                    {link.href.startsWith('http') && (
                      <>
                        <ExternalLink className="w-3 h-3 opacity-30 group-hover/flink:opacity-100 group-focus-visible/flink:opacity-100 transition-opacity" aria-hidden="true" />
                        <span className="sr-only">(opens in new tab)</span>
                      </>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
 
          <nav aria-label="Legal Links">
            <h3 className="text-white/40 font-black text-[11px] uppercase tracking-[0.25em] mb-7">Legal</h3>
            <ul className="space-y-4">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-gray-500 hover:text-purple-400 transition-all duration-200 text-sm font-medium hover:translate-x-1 inline-block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
            <p className="text-gray-400 text-[11px] font-bold tracking-tight">
              © {new Date().getFullYear()} StackPulse Labs. <span className="text-gray-600 font-medium ml-1">All Rights Reserved.</span>
            </p>
            <p className="text-gray-500/80 text-[10px] font-medium tracking-wide">
              Crafted with <span className="text-purple-500/60 transition-colors hover:text-purple-500 cursor-default">♥</span> for the Stacks Network.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-500/[0.04] border border-emerald-500/10 shadow-inner group/status" aria-label="Stacks mainnet status is live" title="Stacks mainnet is live">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
              </div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.25em] group-hover/status:text-emerald-400 transition-colors">
                Mainnet Live
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
