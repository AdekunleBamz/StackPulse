'use client';

export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10 h-[73px]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="h-8 w-40 bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-8 w-48 bg-gray-800 rounded-lg animate-pulse" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-10 w-64 bg-gray-800 rounded-lg animate-pulse mb-3" />
          <div className="h-4 w-96 bg-gray-800 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-gray-900/50 border border-gray-800 rounded-xl p-6 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
            </div>
          ))}
        </div>

        <div className="h-64 bg-gray-900/50 border border-gray-800 rounded-xl animate-pulse" />
      </main>
    </div>
  );
}
