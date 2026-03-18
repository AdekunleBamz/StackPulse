'use client';

import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
  color?: 'purple' | 'blue' | 'emerald' | 'rose' | 'amber';
  showLabel?: boolean;
  className?: string;
  animate?: boolean;
}

export default function ProgressBar({
  progress,
  size = 'md',
  color = 'purple',
  showLabel = false,
  className = '',
  animate = true
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-4'
  };
  
  const colorClasses = {
    purple: 'bg-purple-600',
    blue: 'bg-blue-600',
    emerald: 'bg-emerald-600',
    rose: 'bg-rose-600',
    amber: 'bg-amber-600'
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs font-medium text-gray-400 mb-1.5 px-0.5">
          <span>Processing...</span>
          <span>{clampedProgress}%</span>
        </div>
      )}
      <div className={`w-full ${sizeClasses[size]} bg-gray-800 rounded-full overflow-hidden shadow-inner`}>
        <div
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full ${
            animate ? 'transition-all duration-500 ease-out' : ''
          } relative overflow-hidden`}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {/* Shimmer effect inside progress bar */}
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
