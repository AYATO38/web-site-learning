import { useEffect, useRef, useState } from "react";

export function useQuestionTimer({
  seconds,
  questionIndex,
  running,
  onTimeout,
}: {
  seconds: number | null | undefined;
  questionIndex: number;
  running: boolean;
  onTimeout: () => void;
}): { remaining: number | null; elapsedMs: number } {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const onTimeoutRef = useRef(onTimeout);
  const firedFor = useRef<number | null>(null);

  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    firedFor.current = null;
  }, [questionIndex]);

  useEffect(() => {
    if (!running) {
      setRemaining(null);
      return;
    }

    const startedAt = Date.now();
    const deadline = seconds ? startedAt + seconds * 1000 : null;
    setElapsedMs(0);
    setRemaining(seconds ?? null);

    const id = window.setInterval(() => {
      const now = Date.now();
      setElapsedMs(now - startedAt);
      if (!deadline) return;

      const left = Math.max(0, Math.ceil((deadline - now) / 1000));
      setRemaining(left);
      if (left <= 0 && firedFor.current !== questionIndex) {
        firedFor.current = questionIndex;
        window.clearInterval(id);
        onTimeoutRef.current();
      }
    }, 100);

    return () => window.clearInterval(id);
  }, [seconds, running, questionIndex]);

  return { remaining, elapsedMs };
}
