"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

const inputClass =
  "rounded-xl border border-border bg-surface-elevated px-4 py-3 text-base font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent";

export function ResetPasswordScreen({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("パスワードが一致しません");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await resetPassword({ token, password });
      router.replace("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "処理に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-4 pb-36 pt-10">
      <header className="mb-8">
        <p className="section-en">Account</p>
        <h1 className="font-display mt-1 text-2xl font-medium">パスワード再設定</h1>
      </header>

      {!token ? (
        <p className="text-sm font-semibold text-wrong-foreground">
          再設定用リンクがありません。メールに書かれたリンクから開いてください。
        </p>
      ) : (
        <form
          onSubmit={(event) => void onSubmit(event)}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-5"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-muted-foreground">
              新しいパスワード
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClass}
            />
            <span className="text-xs text-muted-foreground">8文字以上</span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-muted-foreground">
              新しいパスワード（確認）
            </span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClass}
            />
          </label>

          {error && (
            <p className="text-sm font-semibold text-wrong-foreground">{error}</p>
          )}

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
            {busy ? "更新中..." : "パスワードを更新"}
          </button>
        </form>
      )}
    </div>
  );
}
