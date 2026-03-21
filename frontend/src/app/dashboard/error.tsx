'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/EmptyState';
import Button from '@/components/ui/Button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard route error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gray-950 py-8 px-4 flex items-center justify-center">
      <div className="max-w-2xl mx-auto w-full bg-gray-900 border border-red-500/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
        
        <ErrorState 
          message="We failed to load your dashboard data. This might be due to a network error or a temporary issue with our nodes."
          className="py-8"
        />

        <div className="flex justify-center mt-4">
          <Button onClick={() => reset()} variant="primary">
            Try Again
          </Button>
        </div>
      </div>
    </main>
  );
}
