'use client';

import { cn } from '@/lib/cn';
import { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-purple-600/90 to-indigo-600/90 backdrop-blur-md text-white shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/40 ring-1 ring-white/20 active:shadow-inner transition-all duration-300',
  secondary:
    'bg-gray-800/80 backdrop-blur-sm text-gray-100 border border-gray-700/50 hover:bg-gray-800 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5 shadow-sm active:bg-gray-900',
  ghost:
    'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white active:bg-white/10 transition-colors duration-200',
  danger:
    'bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 active:bg-rose-700 transition-all duration-200',
  outline:
    'bg-transparent text-purple-400 border border-purple-500/50 hover:bg-purple-500/10 hover:border-purple-400 hover:text-purple-300 active:bg-purple-500/20 transition-all duration-200',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

const Spinner = ({ className }: { className?: string }) => (
  <span
    aria-hidden="true"
    className={cn(
      'inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white',
      className
    )}
  />
);

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'secondary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    disabled,
    children,
    type = 'button',
    ...props
  },
  ref
) {
  const isDisabled = disabled || isLoading;
  const baseAriaLabel = props['aria-label'];
  const loadingAriaLabel = baseAriaLabel ? `Loading ${baseAriaLabel}` : 'Loading';

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] touch-manipulation',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500',
        'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100',
        'hover:-translate-y-1 hover:shadow-lg active:scale-95 active:translate-y-0',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      aria-busy={isLoading}
      aria-label={isLoading ? loadingAriaLabel : baseAriaLabel}
      {...props}
    >
      {isLoading ? <Spinner /> : leftIcon}
      <span className="min-w-0 truncate">{children}</span>
      {rightIcon}
    </button>
  );
});

export default Button;
