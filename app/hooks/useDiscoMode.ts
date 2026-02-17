import { useState, useEffect, useRef, useCallback } from "react";

const TRIGGER_WORD = "beckett";

export function useDiscoMode() {
  const [isDiscoMode, setIsDiscoMode] = useState(false);
  const bufferRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activate = useCallback(() => {
    setIsDiscoMode(true);
    bufferRef.current = "";
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!audioRef.current) {
      audioRef.current = new Audio("/disco.mp3");
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
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key.length !== 1) return;

      bufferRef.current = (bufferRef.current + e.key.toLowerCase()).slice(
        -TRIGGER_WORD.length
      );

      if (bufferRef.current === TRIGGER_WORD) {
        activate();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [activate]);

  return { isDiscoMode };
}
