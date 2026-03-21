'use client';

import { Component, ReactNode, useState } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays fallback UI
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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
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
            className="max-w-md w-full bg-gray-900/40 backdrop-blur-xl rounded-3xl p-10 border border-white/5 shadow-[0_25px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
            role="alert"
            aria-live="assertive"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
            <div className="text-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8 rotate-3 hover:rotate-0 transition-transform duration-500" aria-hidden="true">
                <svg 
                  className="w-10 h-10 text-red-500" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
                System Hiccup
              </h2>
              
              <p className="text-gray-400 mb-8 leading-relaxed font-medium">
                We've encountered an unexpected pulse error. Don't worry, your data is safe. Please try refreshing or return home.
              </p>

              {this.state.error && (
                <div className="bg-gray-900 rounded-lg p-3 mb-6 text-left">
                  <p className="text-red-400 text-sm font-mono">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={this.handleRetry}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                  aria-label="Reload the application"
                >
                  Try Again
                </button>
                
                <a
                  href="/"
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-800"
                  aria-label="Go back to home page"
                >
                  Go Home
                </a>
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
    console.error('Error caught by handler:', err);
    setError(err);
  };
  
  const clearError = () => {
    setError(null);
  };
  
  return { error, handleError, clearError };
}
