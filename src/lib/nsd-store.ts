import { hasDatabaseUrl } from "@/lib/db";
import type {
  CreateRoomOptions,
  Room,
  RoomPatchResult,
  RoomUpdate,
} from "@/lib/nsd-room";
import * as jsonStore from "@/lib/nsd-store-json";
import * as pgStore from "@/lib/nsd-store-pg";

function backend() {
  if (hasDatabaseUrl()) return pgStore;
  if (process.env.VERCEL) {
    throw new Error(
      "DATABASE_URL がありません。Vercel の環境変数に Postgres の接続URLを設定してください。",
    );
  }
  return jsonStore;
}

export async function getRoom(id: string): Promise<Room | undefined> {
  return backend().getRoom(id);
}

export async function createRoom(
  teamNames: string[],
  options: CreateRoomOptions = {},
): Promise<Room> {
  return backend().createRoom(teamNames, options);
}

export async function patchTeam(
  id: string,
  update: RoomUpdate,
): Promise<RoomPatchResult | undefined> {
  return backend().patchTeam(id, update);
}
