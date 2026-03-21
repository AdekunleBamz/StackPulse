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
    <footer className="bg-gray-950 border-t border-gray-800 pt-16 pb-8 px-4" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Footer</h2>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2 pr-8">
            <Link href="/" className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Zap className="w-6 h-6 text-white" fill="white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                StackPulse
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Real-time blockchain monitoring and alerting platform for the Stacks ecosystem. 
              Get instant notifications for whale transfers, contract deployments, and NFT mints.
            </p>
            <div className="flex space-x-4 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-500 hover:text-white hover:border-purple-500/50 hover:bg-gray-800 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all duration-300 hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
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
        <div className="pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} StackPulse Labs. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Mainnet Live
            </span>
            <div className="h-4 w-px bg-gray-800 hidden md:block" />
            <p className="text-gray-500 text-[10px] font-medium">
              Built with ❤ for the Stacks Community
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
