"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AUTH_EVENT,
  saveAccountProfile,
  fetchMe,
  logoutAccount,
  notifyAuthChanged,
} from "@/lib/auth/client";
import {
  missingRequiredProfile,
  type PublicUser,
  type RequiredProfileKey,
} from "@/lib/auth/types";
import { ProfileFieldInputs } from "@/components/account/profile-field-inputs";
import { cn } from "@/lib/utils";

export function ProfileCompletionGate() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [ready, setReady] = useState(false);
  const [values, setValues] = useState<Record<RequiredProfileKey, string>>({
    university: "",
    faculty: "",
    department: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function syncUser(next: PublicUser | null) {
    setUser(next);
    setValues({
      university: next?.university?.trim() ?? "",
      faculty: next?.faculty?.trim() ?? "",
      department: next?.department?.trim() ?? "",
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const next = await fetchMe().catch(() => null);
      if (!cancelled) {
        syncUser(next);
        setReady(true);
      }
    }

    function onAuthChanged() {
      void load();
    }

    void load();
    window.addEventListener(AUTH_EVENT, onAuthChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_EVENT, onAuthChanged);
    };
  }, []);

  const missing = useMemo(
    () => (user ? missingRequiredProfile(user) : []),
    [user],
  );

  if (!ready || !user || missing.length === 0) return null;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const next = await saveAccountProfile(values);
      syncUser(next);
      notifyAuthChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function onLogout() {
    setBusy(true);
    await logoutAccount();
    syncUser(null);
    notifyAuthChanged();
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-background/95 backdrop-blur-sm">
      <div className="app-bg mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-10">
        <p className="section-en">Profile</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight">
          プロフィールの追加
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          必須項目が追加されました。続けるには、未入力の項目を入力してください。
        </p>

        <form
          onSubmit={(event) => void onSubmit(event)}
          className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-5"
        >
          <ProfileFieldInputs
            fields={missing}
            values={values}
            onChange={(key, value) =>
              setValues((prev) => ({ ...prev, [key]: value }))
            }
          />

          {error ? (
            <p className="text-sm font-semibold text-wrong-foreground">{error}</p>
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
            {busy ? "保存中..." : "保存して続ける"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => void onLogout()}
          disabled={busy}
          className="mt-5 text-sm font-bold text-muted-foreground"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}
