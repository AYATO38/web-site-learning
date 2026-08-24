"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type PendingLeave =
  | { type: "href"; href: string }
  | { type: "back" }
  | { type: "action"; run: () => void };

type LeaveGuardValue = {
  locked: boolean;
  setLocked: (locked: boolean) => void;
  requestLeave: (pending: PendingLeave) => void;
};

const LeaveGuardContext = createContext<LeaveGuardValue | null>(null);

export function LeaveGuardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [locked, setLockedState] = useState(false);
  const [pending, setPending] = useState<PendingLeave | null>(null);
  const leavingRef = useRef(false);
  const navigateRef = useRef<PendingLeave | null>(null);

  const setLocked = useCallback((next: boolean) => {
    if (next && leavingRef.current) return;
    setLockedState(next);
    if (!next) {
      setPending(null);
      if (!navigateRef.current) leavingRef.current = false;
    }
  }, []);

  const leaveNow = useCallback((next: PendingLeave) => {
    leavingRef.current = true;
    navigateRef.current = next;
    setPending(null);
    setLockedState(false);
  }, []);

  const requestLeave = useCallback(
    (next: PendingLeave) => {
      if (!locked) {
        leaveNow(next);
        return;
      }
      setPending(next);
    },
    [leaveNow, locked],
  );

  useEffect(() => {
    if (locked || !navigateRef.current) return;
    const next = navigateRef.current;
    navigateRef.current = null;
    leavingRef.current = false;
    if (next.type === "href") router.push(next.href);
    else if (next.type === "back") router.push("/");
    else next.run();
  }, [locked, router]);

  useEffect(() => {
    if (!locked) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [locked]);

  useEffect(() => {
    if (!locked) return;
    const onPopState = () => {
      history.pushState(null, "", location.href);
      setPending({ type: "back" });
    };
    history.pushState(null, "", location.href);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [locked]);

  useEffect(() => {
    if (!pending) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPending(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pending]);

  const value = useMemo(
    () => ({ locked, setLocked, requestLeave }),
    [locked, requestLeave, setLocked],
  );

  return (
    <LeaveGuardContext.Provider value={value}>
      {children}
      {pending ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-guard-title"
        >
          <div className="event-card w-full max-w-sm rounded-[1.4rem] p-5">
            <p className="section-en">Leave quiz</p>
            <h2
              id="leave-guard-title"
              className="mt-1 text-lg font-black tracking-tight"
            >
              クイズを退出しますか？
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              続けるか、退出するかを選べます。退出すると、この画面の進行から離れます。
            </p>
            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="event-cta w-full rounded-full py-3.5 text-base font-bold"
              >
                クイズを続ける
              </button>
              <button
                type="button"
                onClick={() => leaveNow(pending)}
                className="w-full rounded-full border-2 border-wrong py-3.5 text-base font-bold text-wrong"
              >
                退出する
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </LeaveGuardContext.Provider>
  );
}

export function useLockQuizLeave(active: boolean) {
  const setLocked = useContext(LeaveGuardContext)?.setLocked;

  useEffect(() => {
    if (!setLocked) return;
    setLocked(active);
    return () => setLocked(false);
  }, [active, setLocked]);
}

export function useQuizLocked() {
  return useContext(LeaveGuardContext)?.locked ?? false;
}

export function useRequestLeave() {
  const requestLeave = useContext(LeaveGuardContext)?.requestLeave;
  return useCallback(
    (href = "/") => {
      requestLeave?.({ type: "href", href });
    },
    [requestLeave],
  );
}

export function GuardedLink({
  href,
  onClick,
  ...props
}: ComponentProps<typeof Link>) {
  const guard = useContext(LeaveGuardContext);

  return (
    <Link
      href={href}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || !guard?.locked) return;
        event.preventDefault();
        guard.requestLeave({ type: "href", href: String(href) });
      }}
    />
  );
}
