import React from 'react';

export const HistorySkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div 
        key={i} 
        className="bg-gray-800/10 rounded-xl p-4 border border-white/[0.03] flex items-center justify-between relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-shimmer" />
        <div className="flex items-center gap-4 flex-1 relative z-10">
          <div className="w-2 h-2 rounded-full bg-gray-700/50" />
          <div className="flex-1 space-y-2.5">
            <div className="h-4 bg-gray-800/60 rounded-md w-3/4" />
            <div className="h-3 bg-gray-800/40 rounded-md w-1/4" />
          </div>
        </div>
        <div className="w-24 h-3 bg-gray-800/40 rounded-full relative z-10" />
      </div>
    ))}
  </div>
);

export default HistorySkeleton;
