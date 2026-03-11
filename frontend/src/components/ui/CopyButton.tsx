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
        'inline-flex items-center justify-center rounded-lg border border-gray-700 bg-gray-800/60',
        'h-9 w-9 text-gray-200 hover:bg-gray-700 transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/90',
        className
      )}
      aria-label={copied ? copiedLabel : label}
      title={copied ? copiedLabel : label}
    >
      {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}
