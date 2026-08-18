export function EventShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="event-theme relative flex min-h-dvh flex-col overflow-hidden text-foreground">
      <div className="event-bg pointer-events-none absolute inset-0" />
      <div className="relative z-10 flex min-h-dvh flex-col">{children}</div>
    </main>
  );
}
