"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { notifyAuthChanged, saveAccountProfile } from "@/lib/auth/client";
import { type PublicUser, type RequiredProfileKey } from "@/lib/auth/types";
import {
  ProfileFieldInputs,
  profileInputClass,
} from "@/components/account/profile-field-inputs";
import { cn } from "@/lib/utils";

export function ProfileEditor({
  user,
  onUpdated,
  onBack,
}: {
  user: PublicUser;
  onUpdated: (user: PublicUser) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [values, setValues] = useState<Record<RequiredProfileKey, string>>({
    university: user.university?.trim() ?? "",
    faculty: user.faculty?.trim() ?? "",
    department: user.department?.trim() ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(user.name);
    setValues({
      university: user.university?.trim() ?? "",
      faculty: user.faculty?.trim() ?? "",
      department: user.department?.trim() ?? "",
    });
  }, [user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const next = await saveAccountProfile({
        name,
        ...values,
      });
      onUpdated(next);
      notifyAuthChanged();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        アカウントに戻る
      </button>

      <p className="section-en">Profile</p>
      <h2 className="mt-1 text-xl font-black tracking-tight">プロフィール</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        名前と所属を変更できます。メールアドレスの変更はできません。
      </p>

      <form
        onSubmit={(event) => void onSubmit(event)}
        className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-5"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-muted-foreground">名前</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={40}
            autoComplete="name"
            className={profileInputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-muted-foreground">
            メールアドレス
          </span>
          <input
            type="email"
            value={user.email}
            readOnly
            className={cn(profileInputClass, "bg-muted text-muted-foreground")}
          />
        </label>

        <ProfileFieldInputs
          values={values}
          onChange={(key, value) =>
            setValues((prev) => ({ ...prev, [key]: value }))
          }
        />

        {error ? (
          <p className="text-sm font-semibold text-wrong-foreground">{error}</p>
        ) : null}
        {saved ? (
          <p className="text-sm font-semibold text-accent">保存しました</p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className={cn(
            "mt-1 w-full rounded-full py-4 text-lg font-semibold",
            busy
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "bg-accent text-white hover:bg-accent-dark",
          )}
        >
          {busy ? "保存中..." : "保存する"}
        </button>
      </form>
    </div>
  );
}
