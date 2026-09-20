import { Sparkles } from "lucide-react";
import { PlayerAvatar } from "@/components/next-server-day/player-avatar";
import type { TeamStatus } from "@/lib/nsd-room";

const CONFETTI = [
  { left: "6%", delay: "0s", color: "#3b9eff" },
  { left: "20%", delay: "0.3s", color: "#f5c542" },
  { left: "36%", delay: "0.15s", color: "#fb7185" },
  { left: "52%", delay: "0.5s", color: "#22c55e" },
  { left: "68%", delay: "0.1s", color: "#a78bfa" },
  { left: "84%", delay: "0.4s", color: "#3b9eff" },
  { left: "94%", delay: "0.22s", color: "#f5c542" },
];

const MAX_SHOWN_MEMBERS = 4;

/**
 * The room's overall winner, celebrated: their own mascots bouncing above a
 * gold 1st-place podium block, with a few falling confetti pieces — shown
 * once the final-results drumroll finishes.
 */
export function PodiumCelebration({ team }: { team: TeamStatus }) {
  const shown = team.members.slice(0, MAX_SHOWN_MEMBERS);
  const extra = team.members.length - shown.length;

  return (
    <div className="event-card relative mt-8 overflow-hidden rounded-2xl pb-2">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {CONFETTI.map((piece, index) => (
          <span
            key={index}
            className="confetti-piece absolute top-0 block size-2 rounded-sm"
            style={{
              left: piece.left,
              animationDelay: piece.delay,
              backgroundColor: piece.color,
            }}
          />
        ))}
      </div>
      <div className="relative flex flex-col items-center pt-4">
        <div className="flex items-end justify-center gap-1.5">
          {shown.map((member, index) => (
            <span
              key={member.id}
              className="celebrate-bounce"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <PlayerAvatar
                outfit={member.outfit}
                name={member.name}
                size="lg"
                className="ring-4 ring-white"
              />
            </span>
          ))}
        </div>
        {extra > 0 ? (
          <p className="mt-1 text-xs font-bold text-muted-foreground">
            他{extra}人
          </p>
        ) : null}
        <div className="mt-2 flex items-center gap-1.5 text-accent">
          <Sparkles className="size-5" />
          <p className="text-base font-black">優勝おめでとう！</p>
          <Sparkles className="size-5" />
        </div>
        <p className="mt-1 text-lg font-black">{team.name}</p>
        <div className="mt-3 flex h-20 w-28 items-center justify-center rounded-t-lg bg-gradient-to-b from-[#f6e3a3] to-[#d4af37] text-3xl font-black text-white shadow-inner">
          1
        </div>
      </div>
    </div>
  );
}
