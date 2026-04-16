'use client';

import React, { useState, useRef, useEffect, useId } from 'react';

// Assuming standard tailwind merge or clsx is not needed if we just use template literals
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const id = useId();

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, Math.max(0, delay));
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900/95',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900/95',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900/95',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900/95'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        'aria-describedby': isVisible ? id : undefined,
      })}
      {isVisible && (
        <div 
          id={id}
          className={cn(
            'absolute z-50 w-max max-w-xs px-3 py-2 text-sm font-medium text-gray-200 tracking-tight bg-gray-900/95 backdrop-blur-xl border border-purple-500/20 rounded-xl shadow-xl shadow-purple-900/40 animate-zoom-in transition-all duration-200 ease-out',
            positionClasses[position]
          )}
          role="tooltip"
        >
          {content}
          <div className={cn('absolute border-4 border-transparent', arrowClasses[position])} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
