'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/cn';

interface BreadcrumbsProps {
  className?: string;
}

export default function Breadcrumbs({ className }: BreadcrumbsProps) {
  const pathname = usePathname();
  
  // Don't show breadcrumbs on the home page
  if (pathname === '/') return null;

  const paths = pathname.split('/').filter(Boolean);

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center px-4 py-3 mb-6 bg-gray-900/30 border border-gray-800/50 rounded-2xl backdrop-blur-sm w-fit", className)}
    >
      <ol className="flex items-center space-x-2">
        <li>
          <Link
            href="/"
            className="flex items-center text-gray-400 hover:text-purple-400 transition-colors"
          >
            <Home className="w-4 h-4" />
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
            <li key={path} className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-600 mx-1 shrink-0" />
              {isLast ? (
                <span className="text-purple-400 font-bold text-sm tracking-wide" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className="text-gray-400 hover:text-purple-400 text-sm font-medium transition-colors"
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
