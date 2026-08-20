export function EventShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="event-theme relative flex min-h-dvh flex-col text-foreground">
      <div className="event-bg pointer-events-none absolute inset-0" />
      <span className="event-glow pointer-events-none" aria-hidden />
      <div className="relative z-10 flex min-h-dvh flex-col pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
        {children}
      </div>
    </main>
  );
}
