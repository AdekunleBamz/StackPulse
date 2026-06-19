'use client';

import { Component, ReactNode, useState } from 'react';
import Link from 'next/link';
import logger from '@/lib/logger';
import { PULSE_MESSAGES } from '@/lib/pulseConstants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary Component.
 * Catches JavaScript errors in child components and displays fallback UI.
 * Logs caught errors via the shared logger utility.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#030712] p-6 selection:bg-red-500/30">
          <div
            className="max-w-md w-full bg-gray-900/40 backdrop-blur-xl rounded-3xl p-10 border border-white/5 shadow-[0_25px_50px_rgba(0,0,0,0.5)] shadow-[0_0_50px_-12px_rgba(239,68,68,0.2)] relative overflow-hidden animate-zoom-in"
            role="alert"
            aria-live="assertive"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/80 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            <div className="text-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8 rotate-3 hover:rotate-0 hover:scale-110 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all duration-500 ease-out" aria-hidden="true">
                <svg
                  className="w-10 h-10 text-red-500 animate-pulse"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>

              <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
                {PULSE_MESSAGES.ERROR_SYSTEM_HICCUP}
              </h2>

              <p className="text-gray-400 mb-8 leading-relaxed font-medium">
                {PULSE_MESSAGES.ERROR_GENERIC}
              </p>

              {this.state.error && (
                <div className="bg-gray-950/80 rounded-2xl p-4 mb-8 text-left border border-red-500/10 shadow-inner" role="alert" aria-label="Error details">
                  <p className="text-red-400 font-mono text-xs leading-relaxed break-all">
                    <span className="text-red-500/50 mr-2">#</span>
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  aria-label="Reload the application"
                >
                  {PULSE_MESSAGES.ACTION_TRY_AGAIN}
                </button>

                <Link
                  href="/"
                  className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 border border-white/5 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-gray-900"
                  aria-label="Go back to home page"
                >
                  {PULSE_MESSAGES.ACTION_GO_HOME}
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for components that need to trigger an error
 */
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  const handleError = (err: Error) => {
    logger.error('Error caught by handler:', err);
    setError(err);
  };

  const clearError = () => {
    setError(null);
  };

  return { error, handleError, clearError };
}
