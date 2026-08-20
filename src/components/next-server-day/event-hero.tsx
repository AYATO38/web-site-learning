import Link from "next/link";

export function EventHero({
  kicker = "Next Server Day",
  title,
  subtitle,
  backHref,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  backHref?: string;
}) {
  return (
    <header className="mb-6 min-w-0 px-1 text-center">
      {backHref ? (
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          ← ホームに戻る
        </Link>
      ) : null}
      <p className="section-en">{kicker}</p>
      <h1 className="event-title mt-2">{title}</h1>
      <span className="rule-line mx-auto mt-3" />
      {subtitle ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
