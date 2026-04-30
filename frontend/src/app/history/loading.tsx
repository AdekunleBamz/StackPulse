import { TableRowSkeleton } from '@/components/LoadingSkeleton';

export default function HistoryLoading() {
  return (
    <main className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-48 bg-gray-800 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-64 bg-gray-800 rounded animate-pulse" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
          <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-800 bg-gray-950/50">
            {['Date/Time', 'Alert Name', 'Type', 'Trigger Val'].map((_header, i) => (
              <div key={i} className="h-4 w-24 bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
          
          <div className="divide-y divide-gray-800/50 px-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRowSkeleton key={i} columns={4} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
