'use client';

import { toast } from '@/components/Toast';
import { cn } from '@/lib/cn';
import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function CopyButton({
  value,
  className,
  copiedLabel = 'Copied',
  label = 'Copy',
}: {
  value: string;
  className?: string;
  copiedLabel?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(t);
  }, [copied]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(copiedLabel);
    } catch {
      toast.error('Copy failed', 'Please copy manually.');
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className={cn(
        'inline-flex items-center justify-center rounded-lg border border-gray-700/50 bg-gray-900/40 backdrop-blur-sm',
        'h-9 w-9 text-gray-400 hover:bg-gray-800 hover:text-gray-100 hover:border-gray-600 transition-all duration-300 shadow-sm',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500',
        copied ? 'scale-110 border-green-500/50 bg-green-500/5' : 'active:scale-95',
        className
      )}
      aria-label={copied ? copiedLabel : label}
      title={copied ? copiedLabel : label}
    >
      <div className="relative h-4 w-4">
        <Check 
          className={cn(
            "absolute inset-0 h-4 w-4 text-green-400 transition-all duration-300 transform",
            copied ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-45"
          )} 
        />
        <Copy 
          className={cn(
            "absolute inset-0 h-4 w-4 transition-all duration-300 transform",
            copied ? "opacity-0 scale-50 rotate-45" : "opacity-100 scale-100 rotate-0"
          )} 
        />
      </div>
    </button>
  );
}
