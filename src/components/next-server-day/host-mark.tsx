import type { Room } from "@/lib/nsd-room";
import { isHost } from "@/lib/nsd-room";

export function HostMark({
  room,
  memberId,
}: {
  room: Room;
  memberId: string;
}) {
  if (!isHost(room, memberId)) return null;
  return (
    <span className="ml-1 inline-flex rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold text-accent">
      ルームマスター
    </span>
  );
}
