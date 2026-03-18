'use client';

import { cn } from '@/lib/cn';
import { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
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
    'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/40 ring-1 ring-white/10 active:shadow-inner',
  secondary:
    'bg-gray-800/80 backdrop-blur-sm text-gray-100 border border-gray-700 hover:bg-gray-700 hover:border-gray-600 shadow-sm active:bg-gray-800',
  ghost:
    'bg-transparent text-gray-300 hover:bg-white/5 hover:text-white active:bg-white/10',
  danger:
    'bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-500/20 active:bg-rose-700',
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

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/90',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        'active:scale-[0.98]',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {isLoading ? <Spinner /> : leftIcon}
      <span className="min-w-0 truncate">{children}</span>
      {rightIcon}
    </button>
  );
});

export default Button;

