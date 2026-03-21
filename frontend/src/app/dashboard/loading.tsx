import { DashboardSkeleton } from '@/components/LoadingSkeleton';

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-40 bg-gray-800 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-56 bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="h-10 w-40 bg-gray-800 rounded-xl animate-pulse" />
        </div>
        <DashboardSkeleton />
      </div>
    </main>
  );
}
