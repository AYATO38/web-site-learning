import { cn } from "@/lib/utils";
import { DIFFICULTY_LABELS } from "@/lib/next-server-day";
import {
  memberStatusLabel,
  type Room,
  type TeamMember,
} from "@/lib/nsd-room";

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
  myTeam: string;
  myMemberId?: string | null;
}) {
  return (
    <section className="event-card rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="section-en">Status</p>
          <h3 className="text-base font-bold">会場の回答状況</h3>
        </div>
        <p className="rounded-md bg-accent-soft px-2.5 py-1 font-mono text-xs font-bold tracking-[0.18em] text-accent">
          {room.id}
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {room.teams.map((team) => {
          const isMine = team.name === myTeam;
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
                      <p className="truncate text-xs font-semibold text-foreground">
                        {member.name}
                        {member.id === myMemberId ? "（自分）" : ""}
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
      </ul>
    </section>
  );
}
