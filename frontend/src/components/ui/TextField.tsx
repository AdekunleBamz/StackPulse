'use client';

import { cn } from '@/lib/cn';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export default function TextField({ label, hint, error, className, id, ...props }: TextFieldProps) {
  const inputId = id || props.name || label.toLowerCase().replace(/\s+/g, '-');
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const descriptionId = error ? errorId : hint ? hintId : undefined;

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-semibold text-gray-400 tracking-tight">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={descriptionId}
          className={cn(
            "flex h-12 w-full rounded-xl border bg-gray-900/50 px-4 py-2 text-sm text-gray-100 transition-all duration-300",
            "border-gray-700/50 backdrop-blur-sm",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-gray-500",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:border-purple-500/50 focus-visible:shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500/50 focus-visible:ring-red-500/50 focus-visible:border-red-500/50 focus-visible:shadow-[0_0_15px_-3px_rgba(239,68,68,0.4)]",
            className
          )}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-xs text-red-500/90 font-medium px-1 leading-tight">{error}</p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-gray-500 px-1 leading-tight italic">{hint}</p>
      ) : null}
    </div>
  );
}
