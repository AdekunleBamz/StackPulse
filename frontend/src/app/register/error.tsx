'use client';

import { ErrorState } from '@/components/EmptyState';
import { useRouter } from 'next/navigation';

export default function RegisterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <ErrorState
          message="Registration process encountered an error. Please try again."
          onRetry={reset}
          className="bg-gray-900 border border-red-500/20 shadow-2xl p-10 rounded-[2.5rem]"
        />
        <button
          onClick={() => router.push('/')}
          className="w-full mt-6 py-4 text-gray-500 hover:text-white transition-all font-bold text-sm uppercase tracking-widest"
        >
          Cancel and return home
        </button>
      </div>
    </div>
  );
}
