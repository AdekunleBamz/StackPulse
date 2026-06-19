'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/cn';

interface BreadcrumbsProps {
  className?: string;
}

/**
 * Auto-generated breadcrumb navigation derived from the current URL pathname.
 * Returns null on the home page ('/').
 */
export default function Breadcrumbs({ className }: BreadcrumbsProps) {
  const pathname = usePathname();
  
  // Don't show breadcrumbs on the home page
  if (pathname === '/') return null;

  const paths = pathname.split('/').filter(Boolean);

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center px-4 py-2.5 mb-6 bg-gray-900/40 border border-white/5 rounded-2xl backdrop-blur-md w-fit shadow-xl shadow-black/20 animate-fade-in duration-500 hover:shadow-purple-500/10 transition-shadow", className)}
    >
      <ol className="flex items-center space-x-2">
        <li>
            <Link
              href="/"
              className="flex items-center text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 active:scale-90"
            >
              <Home className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="sr-only">Home</span>
            </Link>
          </li>
          
          {paths.map((path, index) => {
            const href = `/${paths.slice(0, index + 1).join('/')}`;
            const isLast = index === paths.length - 1;
            const label = path
              .replace(/-/g, ' ')
              .replace(/^\w/, (c) => c.toUpperCase());
  
            return (
              <li key={href} className="flex items-center">
                <ChevronRight className="w-3.5 h-3.5 text-gray-700 mx-1.5 shrink-0" aria-hidden="true" />
                {isLast ? (
                  <span className="text-purple-400 font-bold text-xs tracking-wider uppercase" aria-current="page">
                    {label}
                  </span>
                ) : (
                  <Link
                    href={href}
                    className="text-gray-500 hover:text-gray-200 text-xs font-semibold transition-all duration-200 hover:translate-x-0.5"
                  >
                    {label}
                  </Link>
                )}
              </li>
            );
          })}
      </ol>
    </nav>
  );
}
