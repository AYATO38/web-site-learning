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
}) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  const firedFor = useRef<number | null>(null);

  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    firedFor.current = null;
  }, [questionIndex]);

  useEffect(() => {
    if (!seconds || !running) {
      setRemaining(null);
      return;
    }

    const deadline = Date.now() + seconds * 1000;
    setRemaining(seconds);

    const id = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0 && firedFor.current !== questionIndex) {
        firedFor.current = questionIndex;
        window.clearInterval(id);
        onTimeoutRef.current();
      }
    }, 100);

    return () => window.clearInterval(id);
  }, [seconds, running, questionIndex]);

  return remaining;
}
