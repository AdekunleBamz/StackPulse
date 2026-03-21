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
      <label htmlFor={inputId} className="block text-sm font-semibold text-gray-400 tracking-tight">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={!!error}
        className={cn(
          'w-full px-4 py-3 bg-gray-900 border rounded-xl text-white placeholder-gray-500',
          'focus:outline-none focus:ring-2 transition-all duration-200',
          error 
            ? 'border-red-500/40 focus:border-red-500 focus:ring-red-500/20' 
            : 'border-gray-800 focus:border-purple-500 focus:ring-purple-500/20',
          className
        )}
        {...props}
      />
      {error ? (
        <p className="text-xs text-red-500/90 font-medium px-1 leading-tight">{error}</p>
      ) : hint ? (
        <p className="text-xs text-gray-500 px-1 leading-tight italic">{hint}</p>
      ) : null}
    </div>
  );
}

