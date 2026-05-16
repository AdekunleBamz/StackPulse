import { useCallback, useState } from 'react';

/**
 * Hook for managing UI sound effects using the Web Audio API.
 * Respects user preference persisted in localStorage.
 * @module useSound
 */
/** localStorage key used to persist the user's sound preference. */
const SOUND_ENABLED_KEY = 'stackpulse:sound-enabled';

type SoundKind = 'success' | 'notification';

function playBeep(frequency: number, durationMs: number) {
  if (typeof window === 'undefined') return;

  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return;

  const ctx = new AudioContextCtor();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gainNode.gain.value = 0.03;

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start();
  oscillator.stop(ctx.currentTime + durationMs / 1000);

  oscillator.onended = () => {
    void ctx.close();
  };
}

export function useSound() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = window.localStorage.getItem(SOUND_ENABLED_KEY);
    if (stored === 'true' || stored === 'false') {
      return stored === 'true';
    }
    return true;
  });

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SOUND_ENABLED_KEY, String(next));
      }
      return next;
    });
  }, []);

  const playSound = useCallback(
    (kind: SoundKind = 'notification') => {
      if (!enabled) return;
      if (kind === 'success') {
        playBeep(720, 90);
        return;
      }
      playBeep(520, 70);
    },
    [enabled],
  );

  return { enabled, toggle, playSound };
}
