import type { MascotOutfit } from "@/lib/mascot";

export type Account = {
  id: string;
  name: string;
  email: string;
  university: string | null;
  passwordHash: string;
  createdAt: string;
  resetTokenHash?: string | null;
  resetTokenExpiresAt?: number | null;
  lastResetRequestedAt?: number | null;
  outfit?: MascotOutfit | null;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  university: string | null;
  createdAt: string;
  outfit: MascotOutfit | null;
};

export function toPublicUser(account: Account): PublicUser {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    university: account.university,
    createdAt: account.createdAt,
    outfit: account.outfit ?? null,
  };
}
