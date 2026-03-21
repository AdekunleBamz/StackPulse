import React from 'react';

export const HistorySkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div 
        key={i} 
        className="bg-gray-800/20 rounded-xl p-4 border border-gray-800/50 animate-pulse flex items-center justify-between"
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="w-2 h-2 rounded-full bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-800 rounded w-3/4" />
            <div className="h-3 bg-gray-800 rounded w-1/4" />
          </div>
        </div>
        <div className="w-24 h-3 bg-gray-800 rounded-full" />
      </div>
    ))}
  </div>
);

export default HistorySkeleton;
