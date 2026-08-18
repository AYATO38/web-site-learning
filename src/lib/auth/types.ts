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
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  university: string | null;
  createdAt: string;
};

export function toPublicUser(account: Account): PublicUser {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    university: account.university,
    createdAt: account.createdAt,
  };
}
