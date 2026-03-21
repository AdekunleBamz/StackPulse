import { useCallback, useState, useEffect } from 'react';

export function useSound() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('stackpulse_notifications_sound');
    if (stored !== null) {
      setEnabled(stored === 'true');
    }
  }, []);

  const playSound = useCallback((type: 'success' | 'error' | 'notification' = 'notification') => {
    if (!enabled) return;
    // Note: Sounds should be placed in public/sounds
    const audio = new Audio(`/sounds/${type}.mp3`);
    audio.play().catch(() => {
      // Ignore errors (e.g. browser autoplay restrictions)
    });
  }, [enabled]);

  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      localStorage.setItem('stackpulse_notifications_sound', String(next));
      return next;
    });
  }, []);

  return { enabled, toggle, playSound };
}
