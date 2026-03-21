import { PricingCardSkeleton } from '@/components/LoadingSkeleton';

export default function SettingsLoading() {
  return (
    <main className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-40 bg-gray-800 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-56 bg-gray-800 rounded animate-pulse" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl shadow-black/20 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gray-800 animate-pulse border-4 border-gray-900 shadow-xl" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-48 bg-gray-800 rounded animate-pulse" />
              <div className="h-4 w-64 bg-gray-800 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="h-10 w-32 bg-gray-800 rounded-xl animate-pulse" />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-4">Subscription Plans</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <PricingCardSkeleton />
            <PricingCardSkeleton popular />
          </div>
        </div>
      </div>
    </main>
  );
}
