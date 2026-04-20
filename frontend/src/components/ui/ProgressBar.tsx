'use client';

import React from 'react';

interface ProgressBarProps {
  /** Current progress value, from 0 to 100 */
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'purple' | 'blue' | 'emerald' | 'rose' | 'amber';
  showLabel?: boolean;
  className?: string;
  animate?: boolean;
  /** Accessible label for the progress bar */
  label?: string;
  /** Optional custom label text for the "Processing..." string when showLabel is true */
  processingLabel?: string;
}

export default function ProgressBar({
  progress,
  size = 'md',
  color = 'purple',
  showLabel = false,
  className = '',
  animate = true,
  label,
  processingLabel = 'Processing...',
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
          <span>{processingLabel}</span>
          <span>{clampedProgress}%</span>
        </div>
      )}
      <div className={`w-full ${sizeClasses[size]} bg-gray-800 rounded-full overflow-hidden shadow-inner border border-gray-700/30`}>
        <div
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full ${
            animate ? 'transition-all duration-1000 ease-[cubic-bezier(0.65,0,0.35,1)]' : ''
          } relative overflow-hidden shadow-[0_0_20px_-3px_rgba(168,85,247,0.4)]`}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label ?? `${clampedProgress}% complete`}
        >
          {/* Shimmer effect inside progress bar */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
        </div>
      </div>
    </div>
  );
}
