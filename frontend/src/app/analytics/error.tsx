'use client';

import { ErrorState } from '@/components/EmptyState';
import { Breadcrumbs } from '@/components';
import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">StackPulse</span>
            </Link>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-all"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumbs />
        <div className="flex flex-col items-center justify-center py-24">
          <ErrorState
            message="Something went wrong while loading analytics. We're on it!"
            onRetry={reset}
            className="max-w-md bg-gray-900 shadow-2xl border border-gray-800 p-10 rounded-3xl"
          />
        </div>
      </main>
    </div>
  );
}
