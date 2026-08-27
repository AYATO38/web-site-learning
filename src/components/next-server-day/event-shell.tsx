import { cn } from "@/lib/utils";

export function EventShell({
  children,
  reserveNav = true,
}: {
  children: React.ReactNode;
  reserveNav?: boolean;
}) {
  return (
    <main className="relative flex min-h-dvh flex-col text-foreground">
      <div className="event-bg pointer-events-none absolute inset-0" />
      <span className="event-glow pointer-events-none" aria-hidden />
      <div
        className={cn(
          "relative z-10 flex min-h-dvh flex-col",
          reserveNav && "pb-[calc(6.5rem+env(safe-area-inset-bottom))]",
        )}
      >
        {children}
      </div>
    </main>
  );
}
