'use client';

import React from 'react';

interface StatusBadgeProps {
  icon?: string;
  label: string;
  color?: string;
  className?: string;
}

/**
 * A reusable badge component for displaying status or categories with an emoji icon.
 */
export function StatusBadge({ icon, label, color, className = '' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-800/50 border border-gray-700/50 text-xs font-semibold transition-colors ${className}`}>
      {icon && <span aria-hidden="true">{icon}</span>}
      <span className="text-gray-300">{label}</span>
    </span>
  );
}
