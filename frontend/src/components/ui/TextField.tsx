'use client';

import { cn } from '@/lib/cn';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export default function TextField({ label, hint, error, className, id, ...props }: TextFieldProps) {
  const inputId = id || props.name || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={!!error}
        className={cn(
          'w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-500',
          'focus:outline-none transition-colors',
          error ? 'border-red-500/40 focus:border-red-400' : 'border-gray-700 focus:border-purple-500',
          className
        )}
        {...props}
      />
      {error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}

