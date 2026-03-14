'use client';

import { useEffect, useRef, useState } from 'react';

interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const toastStyles = {
  success: {
    bg: 'bg-green-900/90',
    border: 'border-green-500/50',
    icon: '✓',
    iconBg: 'bg-green-500',
  },
  error: {
    bg: 'bg-red-900/90',
    border: 'border-red-500/50',
    icon: '✕',
    iconBg: 'bg-red-500',
  },
  warning: {
    bg: 'bg-yellow-900/90',
    border: 'border-yellow-500/50',
    icon: '!',
    iconBg: 'bg-yellow-500',
  },
  info: {
    bg: 'bg-blue-900/90',
    border: 'border-blue-500/50',
    icon: 'i',
    iconBg: 'bg-blue-500',
  },
};

function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const styles = toastStyles[type];
  const remainingMsRef = useRef(duration);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const leavingTimerRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    if (leavingTimerRef.current != null) window.clearTimeout(leavingTimerRef.current);
    timerRef.current = null;
    leavingTimerRef.current = null;
    startTimeRef.current = null;
  };

  const scheduleDismiss = () => {
    if (duration <= 0) return;
    if (timerRef.current != null) window.clearTimeout(timerRef.current);

    startTimeRef.current = Date.now();
    timerRef.current = window.setTimeout(() => {
      setIsLeaving(true);
      leavingTimerRef.current = window.setTimeout(() => onClose(id), 300);
    }, remainingMsRef.current);
  };

  useEffect(() => {
    remainingMsRef.current = duration;
    scheduleDismiss();
    return () => clearTimers();
  }, [id, duration, onClose]);

  const handleClose = () => {
    clearTimers();
    setIsLeaving(true);
    leavingTimerRef.current = window.setTimeout(() => onClose(id), 300);
  };

  const pause = () => {
    if (timerRef.current == null) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
    if (startTimeRef.current != null) {
      const elapsed = Date.now() - startTimeRef.current;
      remainingMsRef.current = Math.max(0, remainingMsRef.current - elapsed);
      startTimeRef.current = null;
    }
  };

  const resume = () => {
    if (duration <= 0) return;
    if (isLeaving) return;
    if (remainingMsRef.current <= 0) {
      handleClose();
      return;
    }
    scheduleDismiss();
  };

  return (
    <div
      role={type === 'error' || type === 'warning' ? 'alert' : 'status'}
      aria-live={type === 'error' || type === 'warning' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={`flex items-start gap-3 p-4 rounded-lg border backdrop-blur-md shadow-2xl transition-all duration-300 ${
        styles.bg
      } ${styles.border} ${isLeaving ? 'opacity-0 translate-x-full scale-95' : 'opacity-100 translate-x-0 scale-100'}`}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
    >
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${styles.iconBg}`}
        aria-hidden="true"
      >
        {styles.icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-white">{title}</h4>
        {message && <p className="text-sm text-gray-300 mt-0.5">{message}</p>}
      </div>
      <button
        type="button"
        onClick={handleClose}
        className="text-gray-300/80 hover:text-white transition-colors rounded-md px-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/90"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
}

interface ToastData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

// Global toast state
let toastListeners: ((toasts: ToastData[]) => void)[] = [];
let toasts: ToastData[] = [];

const notifyListeners = () => {
  toastListeners.forEach((listener) => listener([...toasts]));
};

export const toast = {
  success: (title: string, message?: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    toasts = [...toasts, { id, type: 'success', title, message, duration }];
    notifyListeners();
    return id;
  },
  error: (title: string, message?: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    toasts = [...toasts, { id, type: 'error', title, message, duration }];
    notifyListeners();
    return id;
  },
  warning: (title: string, message?: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    toasts = [...toasts, { id, type: 'warning', title, message, duration }];
    notifyListeners();
    return id;
  },
  info: (title: string, message?: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    toasts = [...toasts, { id, type: 'info', title, message, duration }];
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

  useEffect(() => {
    const listener = (newToasts: ToastData[]) => {
      setCurrentToasts(newToasts.slice(-maxToasts));
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, [maxToasts]);

  const handleClose = (id: string) => {
    toast.dismiss(id);
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
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
