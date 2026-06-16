'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X, Loader2 } from 'lucide-react';

/**
 * Props for the Toast component.
 */
interface ToastProps {
  /** Unique identifier for the toast */
  id: string;
  /** The type/style of the toast */
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  /** The toast title */
  title: string;
  /** Optional detailed message */
  message?: string;
  /** Duration in milliseconds before auto-dismiss (default: 5000) */
  duration?: number;
  /** Callback to close the toast */
  onClose: (id: string) => void;
}

const toastStyles = {
  success: {
    bg: 'bg-emerald-950/60',
    border: 'border-emerald-500/20',
    icon: CheckCircle,
    iconColor: 'text-emerald-400',
    progress: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
  },
  error: {
    bg: 'bg-rose-950/60',
    border: 'border-rose-500/20',
    icon: AlertCircle,
    iconColor: 'text-rose-400',
    progress: 'bg-gradient-to-r from-rose-600 to-rose-400',
  },
  warning: {
    bg: 'bg-amber-950/60',
    border: 'border-amber-500/20',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    progress: 'bg-gradient-to-r from-amber-600 to-amber-400',
  },
  info: {
    bg: 'bg-sky-950/60',
    border: 'border-sky-500/20',
    icon: Info,
    iconColor: 'text-sky-400',
    progress: 'bg-gradient-to-r from-sky-600 to-sky-400',
  },
  loading: {
    bg: 'bg-indigo-950/60',
    border: 'border-indigo-500/20',
    icon: Loader2,
    iconColor: 'text-indigo-400 animate-spin',
    progress: 'bg-gradient-to-r from-indigo-600 to-indigo-400',
  },
};

/** Duration of the leave-slide animation before the toast is removed from the DOM. */
const TOAST_LEAVE_ANIMATION_DURATION_MS = 300;

function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);
  const styles = toastStyles[type];
  const Icon = styles.icon;
  
  const remainingMsRef = useRef(duration);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const leavingTimerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    if (leavingTimerRef.current != null) window.clearTimeout(leavingTimerRef.current);
    if (progressIntervalRef.current != null) window.clearInterval(progressIntervalRef.current);
    timerRef.current = null;
    leavingTimerRef.current = null;
    progressIntervalRef.current = null;
    startTimeRef.current = null;
  }, []);

  const scheduleDismiss = useCallback(() => {
    if (duration <= 0) return;
    clearTimers();

    startTimeRef.current = Date.now();
    timerRef.current = window.setTimeout(() => {
      setIsLeaving(true);
      leavingTimerRef.current = window.setTimeout(() => onClose(id), TOAST_LEAVE_ANIMATION_DURATION_MS);
    }, remainingMsRef.current);

    progressIntervalRef.current = window.setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        const newProgress = Math.max(0, ((remainingMsRef.current - elapsed) / duration) * 100);
        setProgress(newProgress);
      }
    }, 16);
  }, [clearTimers, duration, id, onClose]);

  useEffect(() => {
    remainingMsRef.current = duration;
    scheduleDismiss();
    return () => clearTimers();
  }, [clearTimers, duration, scheduleDismiss]);

  const handleClose = () => {
    clearTimers();
    setIsLeaving(true);
    leavingTimerRef.current = window.setTimeout(() => onClose(id), TOAST_LEAVE_ANIMATION_DURATION_MS);
  };

  const pause = () => {
    if (timerRef.current == null) return;
    window.clearTimeout(timerRef.current);
    if (progressIntervalRef.current != null) {
      window.clearInterval(progressIntervalRef.current);
    }
    timerRef.current = null;
    progressIntervalRef.current = null;
    
    if (startTimeRef.current != null) {
      const elapsed = Date.now() - startTimeRef.current;
      remainingMsRef.current = Math.max(0, remainingMsRef.current - elapsed);
      startTimeRef.current = null;
    }
  };

  const resume = () => {
    if (duration <= 0) return;
    if (isLeaving) return;
    scheduleDismiss();
  };

  return (
    <div
      role={type === 'error' || type === 'warning' ? 'alert' : 'status'}
      aria-live={type === 'error' || type === 'warning' || type === 'loading' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={`relative flex items-start gap-3.5 p-4.5 rounded-2xl border backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-400 overflow-hidden ${
        styles.bg
      } ${styles.border} ${
        isLeaving 
          ? 'opacity-0 translate-x-16 scale-95 blur-lg pointer-events-none' 
          : 'opacity-100 translate-x-0 scale-100 animate-in fade-in slide-in-from-right-12 duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]'
      }`}
      onMouseEnter={pause}
      onMouseLeave={resume}
      style={{
        transitionProperty: 'all',
        transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)'
      }}
    >
      <Icon className={`w-5 h-5 mt-0.5 ${styles.iconColor}`} strokeWidth={2.5} />
      
      <div className="flex-1 min-w-0 py-0.5">
        <h4 className="font-bold text-white text-[13px] tracking-wide antialiased transition-colors">{title}</h4>
        {message && <p className="text-[11px] text-gray-200/70 mt-1.5 leading-relaxed font-medium transition-colors">{message}</p>}
      </div>
      
      <button
        type="button"
        onClick={handleClose}
        className="text-white/30 hover:text-white transition-all duration-300 rounded-xl p-2 -mr-1.5 hover:bg-white/10 active:scale-90"
        aria-label="Dismiss notification"
        title="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 h-1 w-full bg-white/5">
          <div 
            className={`h-full ${styles.progress} transition-all duration-100 linear shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

interface ToastData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title: string;
  message?: string;
  duration?: number;
}

// Global toast state
const toastListeners = new Set<(toasts: ToastData[]) => void>();
let toasts: ToastData[] = [];

const createToastId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `toast-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

const notifyListeners = () => {
  for (const listener of toastListeners) {
    listener([...toasts]);
  }
};

export const toast = {
  success: (title: string, message?: string, duration?: number) => {
    const id = createToastId();
    toasts = [...toasts, { id, type: 'success', title, message, duration }];
    notifyListeners();
    return id;
  },
  error: (title: string, message?: string, duration?: number) => {
    const id = createToastId();
    toasts = [...toasts, { id, type: 'error', title, message, duration }];
    notifyListeners();
    return id;
  },
  warning: (title: string, message?: string, duration?: number) => {
    const id = createToastId();
    toasts = [...toasts, { id, type: 'warning', title, message, duration }];
    notifyListeners();
    return id;
  },
  info: (title: string, message?: string, duration?: number) => {
    const id = createToastId();
    toasts = [...toasts, { id, type: 'info', title, message, duration }];
    notifyListeners();
    return id;
  },
  loading: (title: string, message?: string, duration?: number) => {
    const id = createToastId();
    toasts = [...toasts, { id, type: 'loading', title, message, duration }];
    notifyListeners();
    return id;
  },
  dismiss: (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notifyListeners();
  },
  dismissAll: () => {
    toasts = [];
    notifyListeners();
  },
};

interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

export function ToastContainer({ position = 'top-right', maxToasts = 5 }: ToastContainerProps) {
  const [currentToasts, setCurrentToasts] = useState<ToastData[]>([]);
  const safeMaxToasts = Number.isFinite(maxToasts) ? Math.max(1, Math.floor(maxToasts)) : 5;

  useEffect(() => {
    const listener = (newToasts: ToastData[]) => {
      setCurrentToasts(newToasts.slice(-safeMaxToasts));
    };
    toastListeners.add(listener);
    return () => {
      toastListeners.delete(listener);
    };
  }, [safeMaxToasts]);

  const handleClose = (id: string) => {
    toast.dismiss(id);
  };

  const positionClasses = {
    'top-right': 'top-[calc(1rem+env(safe-area-inset-top,0px))] right-[calc(1rem+env(safe-area-inset-right,0px))]',
    'top-left': 'top-[calc(1rem+env(safe-area-inset-top,0px))] left-[calc(1rem+env(safe-area-inset-left,0px))]',
    'bottom-right': 'bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-[calc(1rem+env(safe-area-inset-right,0px))]',
    'bottom-left': 'bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-[calc(1rem+env(safe-area-inset-left,0px))]',
    'top-center': 'top-[calc(1rem+env(safe-area-inset-top,0px))] left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2',
  };

  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className={`fixed z-50 flex flex-col gap-2 w-96 max-w-[calc(100vw-2rem)] ${positionClasses[position]}`}
    >
      {currentToasts.map((t) => (
        <Toast
          key={t.id}
          id={t.id}
          type={t.type}
          title={t.title}
          message={t.message}
          duration={t.duration}
          onClose={handleClose}
        />
      ))}
    </div>
  );
}

export default ToastContainer;
