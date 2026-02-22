import {useCallback, useEffect, useRef, useState} from 'react';

const TRIGGER_WORD = 'beckett';

export function useDiscoMode() {
  const [isDiscoMode, setIsDiscoMode] = useState(false);
  const bufferRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activate = useCallback(() => {
    setIsDiscoMode(true);
    bufferRef.current = '';
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!audioRef.current) {
      audioRef.current = new Audio('/disco.mp3');
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});

    timerRef.current = setTimeout(() => {
      setIsDiscoMode(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }, 20000);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key.length !== 1) return;

      bufferRef.current = (bufferRef.current + e.key.toLowerCase()).slice(-TRIGGER_WORD.length);

      if (bufferRef.current === TRIGGER_WORD) {
        activate();
      }
    }

    // Shake detection for mobile
    const SHAKE_THRESHOLD = 25;
    const SHAKE_COUNT_NEEDED = 3;
    const SHAKE_WINDOW_MS = 1000;
    let lastX = 0;
    let lastY = 0;
    let lastZ = 0;
    let lastTime = 0;
    let shakeCount = 0;
    let firstShakeTime = 0;

    function handleMotion(e: DeviceMotionEvent) {
      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const now = Date.now();
      const dt = now - lastTime;
      if (dt < 50) return; // throttle

      const dx = Math.abs(acc.x - lastX);
      const dy = Math.abs(acc.y - lastY);
      const dz = Math.abs(acc.z - lastZ);
      const force = dx + dy + dz;

      lastX = acc.x;
      lastY = acc.y;
      lastZ = acc.z;
      lastTime = now;

      if (force > SHAKE_THRESHOLD) {
        if (shakeCount === 0) firstShakeTime = now;
        shakeCount++;

        if (shakeCount >= SHAKE_COUNT_NEEDED && now - firstShakeTime < SHAKE_WINDOW_MS) {
          shakeCount = 0;
          activate();
        }
      }

      // Reset if shakes are too spread out
      if (now - firstShakeTime > SHAKE_WINDOW_MS) {
        shakeCount = 0;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('devicemotion', handleMotion);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('devicemotion', handleMotion);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [activate]);

  return {isDiscoMode};
}
