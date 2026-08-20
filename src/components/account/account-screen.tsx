"use client";

import { FormEvent, useEffect, useState } from "react";
import { BookOpen, ChevronRight, LogOut, Mail, Settings, User } from "lucide-react";
import {
  AUTH_EVENT,
  fetchMe,
  loginAccount,
  logoutAccount,
  notifyAuthChanged,
  registerAccount,
  requestPasswordReset,
} from "@/lib/auth/client";
import { affiliationLines, type PublicUser } from "@/lib/auth/types";
import { ProfileFieldInputs } from "@/components/account/profile-field-inputs";
import { ProfileEditor } from "@/components/account/profile-editor";
import { MascotSvg } from "@/components/home/mascot-svg";
import { normalizeOutfit } from "@/lib/mascot";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: BookOpen, label: "学習履歴", desc: "完了したレッスンとスコア（準備中）" },
  { icon: Mail, label: "お知らせ", desc: "POSSEからの最新情報（準備中）" },
  { icon: Settings, label: "設定", desc: "通知・アカウント設定（準備中）" },
];

const inputClass =
  "rounded-xl border border-border bg-surface-elevated px-4 py-3 text-base font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent";

export function AccountScreen() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("signup");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [university, setUniversity] = useState("");
  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");
  const [panel, setPanel] = useState<"menu" | "profile">("menu");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const next = await fetchMe();
        if (!cancelled) {
          setUser(next);
          if (!next) setPanel("menu");
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    window.addEventListener(AUTH_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_EVENT, load);
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "forgot") {
        await requestPasswordReset(email);
        setResetSent(true);
        return;
      }
      const next =
        mode === "signup"
          ? await registerAccount({
              name,
              email,
              password,
              university,
              faculty,
              department,
            })
          : await loginAccount({ email, password });
      setUser(next);
      setPassword("");
      notifyAuthChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "処理に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function onLogout() {
    setBusy(true);
    await logoutAccount();
    setUser(null);
    setPanel("menu");
    notifyAuthChanged();
    setBusy(false);
  }

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-4 pb-36 pt-10">
      {!(user && panel === "profile") ? (
        <header className="mb-8">
          <p className="section-en">Account</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight">アカウント</h1>
        </header>
      ) : null}

      {loading ? (
        <p className="text-sm font-semibold text-muted-foreground">読み込み中...</p>
      ) : user && panel === "profile" ? (
        <ProfileEditor
          user={user}
          onUpdated={setUser}
          onBack={() => setPanel("menu")}
        />
      ) : user ? (
        <>
          <div className="mb-6 flex items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-5">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-accent-soft to-white ring-2 ring-accent/15">
              {user.outfit ? (
                <div className="h-16 w-14">
                  <MascotSvg
                    outfit={normalizeOutfit(user.outfit)}
                    view="front"
                  />
                </div>
              ) : (
                <span className="text-xl font-extrabold text-accent">
                  {user.name.slice(0, 1)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-foreground">{user.name}</p>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              {affiliationLines(user).map((line) => (
                <p key={line} className="text-sm text-muted-foreground">
                  {line}
                </p>
              ))}
            </div>
          </div>

          <div className="mb-6 space-y-2">
            <button
              type="button"
              onClick={() => setPanel("profile")}
              className="flex w-full items-center gap-4 rounded-xl border border-border bg-surface-elevated p-4 text-left"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <User className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-foreground">
                  プロフィール
                </span>
                <span className="text-xs text-muted-foreground">
                  名前・大学・学部・学科を編集
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </button>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  disabled
                  className="flex w-full cursor-not-allowed items-center gap-4 rounded-xl border border-border bg-surface-elevated p-4 text-left opacity-70"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-foreground">
                      {item.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.desc}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => void onLogout()}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-elevated py-3 text-sm font-bold text-muted-foreground"
          >
            <LogOut className="size-4" />
            ログアウト
          </button>
        </>
      ) : (
        <>
          {mode !== "forgot" && (
            <div className="mb-5 grid grid-cols-2 rounded-xl border border-border bg-muted p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setResetSent(false);
                }}
                className={cn(
                  "rounded-lg py-2.5 text-sm font-bold",
                  mode === "signup"
                    ? "bg-surface-elevated text-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                新規登録
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setResetSent(false);
                }}
                className={cn(
                  "rounded-lg py-2.5 text-sm font-bold",
                  mode === "login"
                    ? "bg-surface-elevated text-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                ログイン
              </button>
            </div>
          )}

          {mode === "forgot" && resetSent ? (
            <div className="rounded-2xl border border-border bg-surface-elevated p-5">
              <p className="text-sm font-bold text-foreground">
                メールを確認してください
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                アカウントがある場合、再設定用のリンクを送りました。メールのリンクを開いて新しいパスワードを設定してください。届かないときは迷惑メールも確認してください。リンクの有効期限は30分です。
              </p>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setResetSent(false);
                  setError(null);
                }}
                className="mt-5 text-sm font-bold text-accent"
              >
                ログインに戻る
              </button>
            </div>
          ) : (
          <form
            onSubmit={(event) => void onSubmit(event)}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-5"
          >
            {mode === "forgot" && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                登録したメールアドレスを入力してください。アカウントがある場合、再設定用のリンクをそのアドレスへ送ります。
              </p>
            )}

            {mode === "signup" && (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-bold text-muted-foreground">
                    名前
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={40}
                    autoComplete="name"
                    className={inputClass}
                  />
                </label>
                <ProfileFieldInputs
                  values={{ university, faculty, department }}
                  onChange={(key, value) => {
                    if (key === "university") setUniversity(value);
                    if (key === "faculty") setFaculty(value);
                    if (key === "department") setDepartment(value);
                  }}
                />
              </>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-muted-foreground">
                メールアドレス
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={inputClass}
              />
            </label>

            {mode !== "forgot" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-muted-foreground">
                  パスワード
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  className={inputClass}
                />
                {mode === "signup" && (
                  <span className="text-xs text-muted-foreground">
                    8文字以上
                  </span>
                )}
              </label>
            )}

            {error && (
              <p className="text-sm font-semibold text-wrong-foreground">
                {error}
              </p>
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
              {busy
                ? "送信中..."
                : mode === "signup"
                  ? "アカウントを作成"
                  : mode === "forgot"
                    ? "メールを送る"
                    : "ログイン"}
            </button>

            {mode === "login" && (
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setError(null);
                  setResetSent(false);
                }}
                className="text-sm font-bold text-accent"
              >
                パスワードを忘れた
              </button>
            )}

            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setResetSent(false);
                }}
                className="text-sm font-bold text-muted-foreground"
              >
                ログインに戻る
              </button>
            )}
          </form>
          )}
        </>
      )}
    </div>
  );
}
