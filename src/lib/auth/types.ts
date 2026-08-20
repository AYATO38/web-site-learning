import type { MascotOutfit } from "@/lib/mascot";

export type Account = {
  id: string;
  name: string;
  email: string;
  university: string | null;
  faculty: string | null;
  department: string | null;
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
  faculty: string | null;
  department: string | null;
  createdAt: string;
  outfit: MascotOutfit | null;
};

export const REQUIRED_PROFILE_FIELDS = [
  {
    key: "university",
    label: "大学名",
    placeholder: "例: POSSE大学",
    max: 80,
  },
  {
    key: "faculty",
    label: "学部",
    placeholder: "例: コミュニティ学部",
    max: 80,
  },
  {
    key: "department",
    label: "学科",
    placeholder: "例: プログラミング学科",
    max: 80,
  },
] as const;

export type RequiredProfileKey = (typeof REQUIRED_PROFILE_FIELDS)[number]["key"];

export type ProfilePatch = Partial<Record<RequiredProfileKey, string>> & {
  name?: string;
};

export function missingRequiredProfile(
  user: Pick<PublicUser, RequiredProfileKey>,
): (typeof REQUIRED_PROFILE_FIELDS)[number][] {
  return REQUIRED_PROFILE_FIELDS.filter((field) => !user[field.key]?.trim());
}

export function profileIsComplete(
  user: Pick<PublicUser, RequiredProfileKey>,
): boolean {
  return missingRequiredProfile(user).length === 0;
}

export function toPublicUser(account: Account): PublicUser {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    university: account.university,
    faculty: account.faculty ?? null,
    department: account.department ?? null,
    createdAt: account.createdAt,
    outfit: account.outfit ?? null,
  };
}

export function affiliationLines(user: Pick<
  PublicUser,
  "university" | "faculty" | "department"
>): string[] {
  const university = user.university?.trim() ?? "";
  const detail = [user.faculty, user.department]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
  const lines = [university, detail].filter(Boolean);
  return lines.length > 0 ? lines : ["POSSE メンバー"];
}
