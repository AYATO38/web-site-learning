import { cn } from "@/lib/utils";
import { DIFFICULTY_LABELS, timeLimitLabel } from "@/lib/next-server-day";
import {
  memberStatusLabel,
  type Room,
  type TeamMember,
} from "@/lib/nsd-room";
import { HostMark } from "@/components/next-server-day/host-mark";
import { PlayerAvatar } from "@/components/next-server-day/player-avatar";

function statusClass(member: TeamMember) {
  if (member.finished || member.lastResult === "correct") {
    return "bg-accent-soft text-accent";
  }
  if (member.lastResult === "wrong") return "bg-wrong-surface text-wrong";
  return "bg-background text-muted-foreground";
}

export function LiveBoard({
  room,
  myTeam,
  myMemberId,
}: {
  room: Room;
  myTeam?: string | null;
  myMemberId?: string | null;
}) {
  return (
    <section className="event-card rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="section-en">Status</p>
          <h3 className="text-base font-bold">会場の回答状況</h3>
          {room.host ? (
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              ルームマスター: {room.host.name}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {room.timeLimitSeconds ? (
            <p className="rounded-md bg-muted px-2.5 py-1 text-xs font-bold text-foreground">
              {timeLimitLabel(room.timeLimitSeconds)}
            </p>
          ) : null}
          <p className="rounded-md bg-accent-soft px-2.5 py-1 font-mono text-xs font-bold tracking-[0.18em] text-accent">
            {room.id}
          </p>
        </div>
      </div>
      <ul className="flex flex-col gap-3">
        {room.teams.map((team) => {
          const isMine = Boolean(myTeam && team.name === myTeam);
          return (
            <li
              key={team.name}
              className={cn(
                "rounded-xl px-3 py-2.5",
                isMine ? "bg-accent-soft ring-1 ring-accent/40" : "bg-muted",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-bold">
                  {team.name}
                  {isMine ? "（自分のチーム）" : ""}
                </p>
                <p className="shrink-0 text-xs text-muted-foreground">
                  {team.members.length}人
                  {team.difficulty
                    ? ` · ${DIFFICULTY_LABELS[team.difficulty].label}`
                    : ""}
                </p>
              </div>
              {team.members.length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">まだ誰も入っていません</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-1.5">
                  {team.members.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <p className="flex min-w-0 items-center gap-1.5 truncate text-xs font-semibold text-foreground">
                        <PlayerAvatar
                          outfit={member.outfit}
                          name={member.name}
                          size="sm"
                          className="size-6 ring-1"
                        />
                        <span className="truncate">
                          {member.name}
                          {member.id === myMemberId ? "（自分）" : ""}
                        </span>
                        <HostMark room={room} memberId={member.id} />
                      </p>
                      <div className="flex shrink-0 items-center gap-2">
                        {member.total > 0 && (
                          <span className="text-[11px] text-muted-foreground">
                            {Math.min(member.current + 1, member.total)}/
                            {member.total}問
                          </span>
                        )}
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-[11px] font-bold",
                            statusClass(member),
                          )}
                        >
                          {memberStatusLabel(member)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
        {room.galleryCapacity > 0 ? (
          <li
            className={cn(
              "rounded-xl px-3 py-2.5",
              myTeam
                ? "bg-muted"
                : "bg-accent-soft/60 ring-1 ring-accent/30",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold">ギャラリー枠</p>
              <p className="shrink-0 text-xs text-muted-foreground">
                {room.gallery.length}/{room.galleryCapacity}席
              </p>
            </div>
            {room.gallery.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                観戦者はまだいません
              </p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {room.gallery.map((guest) => (
                  <li
                    key={guest.id}
                    className="rounded-md bg-background px-2 py-1 text-xs font-semibold"
                  >
                    {guest.name}
                    {guest.id === myMemberId ? "（自分）" : ""}
                    <HostMark room={room} memberId={guest.id} />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ) : null}
      </ul>
    </section>
  );
}
