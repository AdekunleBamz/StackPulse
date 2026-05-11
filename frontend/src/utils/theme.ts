/**
 * Project Theme Constants
 * Centralized color and spacing tokens for better maintainability
 */

export const COLORS = {
  primary: {
    DEFAULT: '#8b5cf6', // purple-500
    hover: '#a78bfa',   // purple-400
    dark: '#6d28d9',    // purple-700
    glow: 'rgba(139, 92, 246, 0.5)',
  },
  secondary: {
    DEFAULT: '#3b82f6', // blue-500
    hover: '#60a5fa',   // blue-400
    dark: '#1d4ed8',    // blue-700
  },
  accent: {
    emerald: '#10b981',
    amber: '#f59e0b',
    rose: '#f43f5e',
    pink: '#ec4899',
  },
  background: {
    DEFAULT: '#030712', // gray-950
    card: '#111827',    // gray-900
    elevated: '#1f2937', // gray-800
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.05)',
    accent: 'rgba(139, 92, 246, 0.2)',
  }
};

export const GRADIENTS = {
  primary: 'from-purple-500 via-purple-600 to-blue-700',
  brand: 'from-purple-500 to-blue-500',
  surface: 'from-gray-900/40 via-gray-900/20 to-transparent',
  /** Gradient for text highlights and headings. */
  text: 'from-white via-purple-200 to-blue-200',
} as const;

export const SHADOWS = {
  brand: '0 20px 50px rgba(0,0,0,0.5)',
  glow: '0 0 20px rgba(139, 92, 246, 0.2)',
};

/** Common CSS transition values for consistent UI animation */
export const TRANSITIONS = {
  fast: 'all 0.1s ease',
  base: 'all 0.2s ease',
  slow: 'all 0.3s ease',
};

/** Responsive breakpoints in pixels */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};
