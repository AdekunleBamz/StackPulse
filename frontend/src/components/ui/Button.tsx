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
    'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-blue-500',
  secondary: 'bg-gray-800 text-white border border-gray-700 hover:bg-gray-700',
  ghost: 'bg-transparent text-gray-200 hover:bg-gray-800/60',
  danger: 'bg-red-600 text-white hover:bg-red-500',
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

