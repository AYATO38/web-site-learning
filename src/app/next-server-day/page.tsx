"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X, Check, Sparkles, Minus, Plus } from "lucide-react";
import { ChoiceButton } from "@/components/choice-button";
import { LiveBoard } from "@/components/next-server-day/live-board";
import { InviteShare } from "@/components/next-server-day/invite-share";
import { EventShell } from "@/components/next-server-day/event-shell";
import { ResultScreen } from "@/components/next-server-day/result-screen";
import { cn } from "@/lib/utils";
import {
  DIFFICULTY_LABELS,
  type Difficulty,
  type NextServerDayQuestion,
} from "@/lib/next-server-day";
import {
  createRoom,
  fetchRoom,
  updateTeamStatus,
  type Room,
} from "@/lib/nsd-room";
import { fetchMe } from "@/lib/auth/client";
import { playCorrectSfx, playResultSfx } from "@/lib/sfx";
import questionsData from "@/data/next-server-day.json";

const questions = questionsData as NextServerDayQuestion[];

type Phase = "answering" | "correct" | "wrong";
type EntryMode = "create" | "join";

const MIN_TEAMS = 2;
const MAX_TEAMS = 8;

function defaultTeamNames(count: number, prev: string[] = []) {
  return Array.from({ length: count }, (_, i) => prev[i] ?? `チーム${i + 1}`);
}

export default function NextServerDayPage() {
  const [entryMode, setEntryMode] = useState<EntryMode>("create");
  const [teams, setTeams] = useState<string[] | null>(null);
  const [myTeam, setMyTeam] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [teamCount, setTeamCount] = useState(3);
  const [teamNameDrafts, setTeamNameDrafts] = useState(() =>
    defaultTeamNames(3),
  );
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty | null>(null);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("answering");
  const [finished, setFinished] = useState(false);
  const [combo, setCombo] = useState(0);
  const [brokenCombo, setBrokenCombo] = useState(0);
  const [xp, setXp] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);

  const activeQuestions = useMemo(
    () =>
      selectedDifficulty
        ? questions.filter((q) => q.difficulty === selectedDifficulty)
        : [],
    [selectedDifficulty],
  );

  const total = activeQuestions.length;
  const question = activeQuestions[current];

  const progress = useMemo(() => {
    if (total === 0) return 0;
    return finished ? 100 : (current / total) * 100;
  }, [current, total, finished]);

  useEffect(() => {
    const key = "nsd-member-id";
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(key, id);
    }
    setMemberId(id);

    void fetchMe()
      .then((user) => {
        if (user) setDisplayName((prev) => prev || user.name);
      })
      .catch(() => {
        /* guest is fine */
      });
    const savedName = sessionStorage.getItem("nsd-member-name");
    if (savedName) setDisplayName((prev) => prev || savedName);

    const code = new URLSearchParams(window.location.search)
      .get("room")
      ?.trim()
      .toUpperCase();
    if (code && code.length >= 4) {
      setEntryMode("join");
      setJoinCode(code);
      void enterRoomByCode(code);
    }
  }, []);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;

    async function poll() {
      try {
        const next = await fetchRoom(roomId!);
        if (!cancelled && next) {
          setRoom((prev) =>
            prev && JSON.stringify(prev) === JSON.stringify(next) ? prev : next,
          );
        }
      } catch {
        /* keep last snapshot */
      }
    }

    void poll();
    const timer = window.setInterval(() => void poll(), 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [roomId]);

  useEffect(() => {
    if (!room || !myTeam || !memberId || selectedDifficulty) return;
    const team = room.teams.find((item) => item.name === myTeam);
    if (!team?.difficulty) return;

    const me = team.members.find((member) => member.id === memberId);
    setSelectedDifficulty(team.difficulty);

    if (me && me.total > 0) {
      setCurrent(me.current);
      setCombo(me.combo);
      setXp(me.xp);
      setFinished(me.finished);
      setPhase(
        me.lastResult === "correct"
          ? "correct"
          : me.lastResult === "wrong"
            ? "wrong"
            : "answering",
      );
      return;
    }

    const count = questions.filter((q) => q.difficulty === team.difficulty).length;
    setCurrent(0);
    setCombo(0);
    setBrokenCombo(0);
    setXp(0);
    setCorrectCount(0);
    setBestCombo(0);
    setSelected(null);
    setPhase("answering");
    setFinished(false);
    void syncStatus({
      difficulty: team.difficulty,
      current: 0,
      total: count,
      combo: 0,
      xp: 0,
      lastResult: null,
      finished: false,
    });
  }, [room, myTeam, memberId, selectedDifficulty]);

  async function syncStatus(partial: {
    difficulty?: Difficulty | null;
    current?: number;
    total?: number;
    combo?: number;
    xp?: number;
    lastResult?: "correct" | "wrong" | null;
    finished?: boolean;
  }) {
    if (!roomId || !myTeam || !memberId) return;
    try {
      const next = await updateTeamStatus(roomId, {
        teamName: myTeam,
        memberId,
        memberName: displayName.trim() || undefined,
        ...partial,
      });
      setRoom(next);
      return next;
    } catch {
      /* ignore transient errors; poll will catch up */
    }
  }

  function handleCheck() {
    if (selected === null || !question) return;
    const isCorrect = selected === question.answerIndex;
    if (isCorrect) {
      const nextCombo = combo + 1;
      const nextXp = xp + question.xp;
      setCombo(nextCombo);
      setXp(nextXp);
      setCorrectCount((n) => n + 1);
      setBestCombo((best) => Math.max(best, nextCombo));
      setPhase("correct");
      void playCorrectSfx(nextCombo);
      void syncStatus({
        current,
        total,
        combo: nextCombo,
        xp: nextXp,
        lastResult: "correct",
        finished: false,
      });
    } else {
      setBrokenCombo(combo);
      setCombo(0);
      setPhase("wrong");
      void syncStatus({
        current,
        total,
        combo: 0,
        xp,
        lastResult: "wrong",
        finished: false,
      });
    }
  }

  function handleContinue() {
    if (current + 1 >= total) {
      setFinished(true);
      void playResultSfx();
      void syncStatus({
        current,
        total,
        combo,
        xp,
        finished: true,
      });
      return;
    }
    const nextIndex = current + 1;
    setCurrent(nextIndex);
    setSelected(null);
    setPhase("answering");
    void syncStatus({
      current: nextIndex,
      total,
      lastResult: null,
      finished: false,
    });
  }

  function handleRestart() {
    const count = selectedDifficulty
      ? questions.filter((q) => q.difficulty === selectedDifficulty).length
      : 0;
    setCurrent(0);
    setSelected(null);
    setPhase("answering");
    setFinished(false);
    setCombo(0);
    setBrokenCombo(0);
    setXp(0);
    setCorrectCount(0);
    setBestCombo(0);
    void syncStatus({
      current: 0,
      total: count,
      combo: 0,
      xp: 0,
      lastResult: null,
      finished: false,
    });
  }

  function resetToEntry() {
    setTeams(null);
    setMyTeam(null);
    setRoomId(null);
    setRoom(null);
    setError(null);
    setSelectedDifficulty(null);
    setFinished(false);
    setCombo(0);
    setBrokenCombo(0);
    setXp(0);
    setCorrectCount(0);
    setBestCombo(0);
    window.history.replaceState(null, "", "/next-server-day");
  }

  function changeTeamCount(next: number) {
    const count = Math.min(MAX_TEAMS, Math.max(MIN_TEAMS, next));
    setTeamCount(count);
    setTeamNameDrafts((prev) => defaultTeamNames(count, prev));
  }

  function rememberRoomUrl(id: string) {
    window.history.replaceState(
      null,
      "",
      `/next-server-day?room=${encodeURIComponent(id)}`,
    );
  }

  async function startWithTeams() {
    const names = teamNameDrafts.map((name, i) => name.trim() || `チーム${i + 1}`);
    if (new Set(names).size !== names.length) {
      setError("チーム名が重複しています");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await createRoom(names);
      setTeams(names);
      setRoom(created);
      setRoomId(created.id);
      rememberRoomUrl(created.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "部屋を作成できませんでした");
    } finally {
      setBusy(false);
    }
  }

  async function enterRoomByCode(code: string) {
    const roomCode = code.trim().toUpperCase();
    if (roomCode.length < 4) {
      setError("部屋コードを入力してください");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const found = await fetchRoom(roomCode);
      if (!found) {
        setError("その部屋コードは見つかりません");
        return;
      }
      setRoom(found);
      setRoomId(found.id);
      setTeams(found.teams.map((t) => t.name));
      rememberRoomUrl(found.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "部屋に入れませんでした");
    } finally {
      setBusy(false);
    }
  }

  async function joinRoom() {
    await enterRoomByCode(joinCode);
  }

  async function chooseTeam(name: string) {
    const playerName = displayName.trim();
    if (!playerName) {
      setError("あなたの名前を入力してください");
      return;
    }
    if (!roomId || !memberId) {
      setError("準備が終わるまで少し待ってから、もう一度チームを選んでください");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      sessionStorage.setItem("nsd-member-name", playerName);
      const next = await updateTeamStatus(roomId, {
        teamName: name,
        memberId,
        memberName: playerName,
      });
      setRoom(next);
      setMyTeam(name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "チームに入れませんでした");
    } finally {
      setBusy(false);
    }
  }

  function feedbackTitle() {
    if (phase === "correct") {
      if (combo >= 2) {
        return `🔥【連続正解！】現在 ${combo}問連続正解中！すごいです！`;
      }
      return "正解です！";
    }
    if (brokenCombo >= 1) {
      return `残念、不正解です！連続正解記録は${brokenCombo}問でストップしました。次に期待です！`;
    }
    return "残念、不正解です！次に期待です！";
  }

  function choiceStatus(index: number) {
    if (!question) return "idle" as const;
    if (phase === "answering") return selected === index ? "selected" : "idle";
    if (index === question.answerIndex) return "correct";
    if (index === selected) return "wrong";
    return "idle";
  }

  if (!teams || !roomId || !room) {
    const canStart = teamNameDrafts.every((name) => name.trim().length > 0);

    return (
      <EventShell>
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-8 pt-8">
          <header className="mb-6 text-center">
            <Link
              href="/"
              className="mb-4 inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              ← ホームに戻る
            </Link>
            <p className="section-en">Event</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              次サバDAY
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              招待リンクを送れば、別のネットの端末からも参加できます
            </p>
          </header>

          <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
            <button
              type="button"
              onClick={() => {
                setEntryMode("create");
                setError(null);
              }}
              className={cn(
                "rounded-xl py-2.5 text-sm font-extrabold",
                entryMode === "create"
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              部屋を作る
            </button>
            <button
              type="button"
              onClick={() => {
                setEntryMode("join");
                setError(null);
              }}
              className={cn(
                "rounded-xl py-2.5 text-sm font-extrabold",
                entryMode === "join"
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              部屋に入る
            </button>
          </div>

          {entryMode === "create" ? (
            <>
              <section className="event-card rounded-[1.4rem] p-5">
                <p className="text-sm font-bold text-foreground">チーム数</p>
                <div className="mt-3 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => changeTeamCount(teamCount - 1)}
                    disabled={teamCount <= MIN_TEAMS}
                    className="flex size-12 items-center justify-center rounded-xl border border-border bg-surface-elevated text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="チーム数を減らす"
                  >
                    <Minus className="size-5" strokeWidth={3} />
                  </button>
                  <span className="min-w-16 text-center text-5xl font-extrabold tabular-nums text-accent">
                    {teamCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => changeTeamCount(teamCount + 1)}
                    disabled={teamCount >= MAX_TEAMS}
                    className="flex size-12 items-center justify-center rounded-xl border border-border bg-surface-elevated text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="チーム数を増やす"
                  >
                    <Plus className="size-5" strokeWidth={3} />
                  </button>
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {MIN_TEAMS}〜{MAX_TEAMS}チーム
                </p>
              </section>

              <section className="mt-5 flex flex-col gap-3">
                {teamNameDrafts.map((name, index) => (
                  <label key={index} className="flex flex-col gap-1.5">
                    <span className="text-sm font-bold text-muted-foreground">
                      チーム {index + 1}
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTeamNameDrafts((prev) =>
                          prev.map((n, i) => (i === index ? value : n)),
                        );
                      }}
                      placeholder={`チーム${index + 1}`}
                      className="rounded-xl border border-border bg-surface-elevated px-4 py-3 text-base font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
                    />
                  </label>
                ))}
              </section>

              {error && (
                <p className="mt-3 text-sm font-semibold text-rose-300">{error}</p>
              )}

              <button
                type="button"
                onClick={() => void startWithTeams()}
                disabled={!canStart || busy}
                className={cn(
                  "mt-6 w-full rounded-lg py-4 text-lg font-bold",
                  canStart && !busy
                    ? "bg-accent text-white hover:bg-accent-dark"
                    : "cursor-not-allowed bg-muted text-muted-foreground",
                )}
              >
                {busy ? "作成中..." : "部屋を作って進む"}
              </button>
            </>
          ) : (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-muted-foreground">
                  部屋コード
                </span>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="A3K7"
                  maxLength={6}
                  className="rounded-xl border border-border bg-surface-elevated px-4 py-5 text-center font-mono text-3xl font-extrabold tracking-[0.35em] text-accent outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
                />
              </label>
              {error && (
                <p className="mt-3 text-sm font-semibold text-rose-300">{error}</p>
              )}
              <button
                type="button"
                onClick={() => void joinRoom()}
                disabled={busy}
                className={cn(
                  "mt-6 w-full rounded-lg py-4 text-lg font-bold",
                  busy
                    ? "cursor-not-allowed bg-muted text-muted-foreground"
                    : "bg-accent text-white hover:bg-accent-dark",
                )}
              >
                {busy ? "確認中..." : "部屋に入る"}
              </button>
            </>
          )}
        </div>
      </EventShell>
    );
  }

  if (!myTeam) {
    return (
      <EventShell>
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-8 pt-8">
          <header className="mb-6 text-center">
            <p className="inline-flex rounded-md bg-accent-soft px-3 py-1 font-mono text-xs font-bold tracking-[0.28em] text-accent">
              {roomId}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
              チームを選ぶ
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              名前を入れて、同じチームに複数人で入れます
            </p>
          </header>

          <InviteShare roomId={roomId} />

          <label className="mb-5 flex flex-col gap-1.5">
            <span className="text-sm font-bold text-muted-foreground">
              あなたの名前
            </span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={20}
              placeholder="例: 山田"
              className="rounded-xl border border-border bg-surface-elevated px-4 py-3 text-base font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
            />
          </label>

          {error && (
            <p className="mb-3 text-sm font-semibold text-rose-300">{error}</p>
          )}

          <div className="grid gap-3">
            {room.teams.map((team) => (
              <button
                key={team.name}
                type="button"
                disabled={busy}
                onClick={() => void chooseTeam(team.name)}
                className="event-card rounded-2xl px-5 py-4 text-left transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                <p className="text-lg font-extrabold">{team.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {team.members.length === 0
                    ? "まだ誰も入っていません"
                    : `${team.members.length}人 · ${team.members.map((m) => m.name).join("、")}`}
                </p>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={resetToEntry}
            className="mt-6 text-sm font-semibold text-muted-foreground"
          >
            部屋選択に戻る
          </button>
        </div>
      </EventShell>
    );
  }

  if (!selectedDifficulty) {
    return (
      <EventShell>
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-8 pt-8">
          <header className="mb-6 text-center">
            <Link
              href="/"
              className="mb-4 inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              ← ホームに戻る
            </Link>
            <p className="section-en">Room {roomId}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              難易度を選ぶ
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              自分のチーム: {myTeam} / {displayName || "未設定"}
            </p>
            <button
              type="button"
              onClick={() => setMyTeam(null)}
              className="mt-2 text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline"
            >
              チーム選択をやり直す
            </button>
          </header>

          <div className="mb-6">
            <LiveBoard room={room} myTeam={myTeam} myMemberId={memberId} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((key) => {
              const d = DIFFICULTY_LABELS[key];
              const count = questions.filter((q) => q.difficulty === key).length;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={count === 0}
                  onClick={() => {
                    void (async () => {
                      const next = await syncStatus({
                        difficulty: key,
                        current: 0,
                        total: count,
                        combo: 0,
                        xp: 0,
                        lastResult: null,
                        finished: false,
                      });
                      const locked =
                        next?.teams.find((team) => team.name === myTeam)
                          ?.difficulty ?? key;
                      setSelectedDifficulty(locked);
                      setCurrent(0);
                      setCombo(0);
                      setBrokenCombo(0);
                      setXp(0);
                      setCorrectCount(0);
                      setBestCombo(0);
                      setSelected(null);
                      setPhase("answering");
                      setFinished(false);
                    })();
                  }}
                  className="event-card flex flex-col items-center justify-center gap-3 rounded-[1.4rem] p-6 text-center transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="rounded-full bg-accent-soft p-3 text-accent">
                    <Sparkles className="size-6" />
                  </span>
                  <div>
                    <div className="text-lg font-extrabold">{d.label}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{d.desc}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{count} 問</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </EventShell>
    );
  }

  if (finished && room && myTeam) {
    return (
      <EventShell>
        <ResultScreen
          room={room}
          myTeam={myTeam}
          myMemberId={memberId}
          correctCount={correctCount}
          total={total}
          xp={xp}
          bestCombo={bestCombo}
          onRestart={handleRestart}
        />
      </EventShell>
    );
  }

  if (!question) {
    return (
      <EventShell>
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-16 text-center">
          <p className="text-sm font-semibold text-muted-foreground">
            問題を読み込めませんでした。チーム選択からやり直してください。
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedDifficulty(null);
              setFinished(false);
            }}
            className="mt-6 text-sm font-bold text-accent"
          >
            戻る
          </button>
        </div>
      </EventShell>
    );
  }

  return (
    <EventShell>
      <header className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-accent p-2 text-sm font-bold text-white">
              <Sparkles className="size-4" />
            </span>
            <div>
              <p className="section-en">
                {roomId} · {myTeam}
              </p>
              <h2 className="text-lg font-extrabold">次サバDAY 限定クイズ</h2>
            </div>
          </div>
          <Link
            href="/"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-7" strokeWidth={3} />
          </Link>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="進捗"
            className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(progress, 6)}%` }}
          />
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-[calc(14rem+env(safe-area-inset-bottom))] pt-2 sm:px-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-accent">
            {DIFFICULTY_LABELS[selectedDifficulty].label} · 問題 {current + 1} /{" "}
            {total}
          </p>
          <div className="flex items-center gap-2">
            {combo >= 2 && (
              <span className="rounded-md bg-accent px-3 py-1 text-sm font-bold text-white">
                {combo}連続
              </span>
            )}
            <span className="rounded-md bg-accent-soft px-3 py-1 text-sm font-bold text-accent">
              XP +{question.xp}
            </span>
          </div>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold leading-snug text-balance sm:text-3xl">
          {question.prompt}
        </h1>

        {question.code && (
          <pre className="mt-5 overflow-x-auto rounded-xl border border-border bg-zinc-900 px-5 py-4 font-mono text-sm font-semibold text-white sm:text-base">
            <code>{question.code}</code>
          </pre>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {question.choices.map((choice, index) => (
            <ChoiceButton
              key={choice}
              label={choice}
              index={index}
              status={choiceStatus(index)}
              disabled={phase !== "answering"}
              onSelect={() => setSelected(index)}
            />
          ))}
        </div>

        <div className="mt-6">
          <LiveBoard room={room} myTeam={myTeam} myMemberId={memberId} />
        </div>
      </section>

      <footer
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]",
          phase === "correct" && "border-correct/30 bg-correct-surface",
          phase === "wrong" && "border-wrong/30 bg-wrong-surface",
        )}
      >
        <div className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-6">
          {phase !== "answering" && (
            <div
              className={cn(
                "mb-4 flex items-start gap-3",
                phase === "correct" ? "text-accent" : "text-wrong",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  phase === "correct"
                    ? "bg-accent text-white"
                    : "bg-wrong text-white",
                )}
              >
                {phase === "correct" ? (
                  <Check className="size-5" strokeWidth={3} />
                ) : (
                  <X className="size-5" strokeWidth={3} />
                )}
              </span>
              <div>
                <p className="text-lg font-extrabold leading-snug">
                  {feedbackTitle()}
                </p>
                <p className="mt-1 text-sm font-semibold leading-relaxed sm:text-base">
                  <span className="font-extrabold">解説: </span>
                  {question.explanation}
                </p>
              </div>
            </div>
          )}

          {phase === "answering" ? (
            <button
              type="button"
              onClick={handleCheck}
              disabled={selected === null}
              className={cn(
                "w-full rounded-lg py-4 text-lg font-bold",
                selected !== null
                  ? "bg-accent text-white hover:bg-accent-dark"
                  : "cursor-not-allowed bg-muted text-muted-foreground",
              )}
            >
              チェック
            </button>
          ) : (
            <button
              type="button"
              onClick={handleContinue}
              className={cn(
                "w-full rounded-lg py-4 text-lg font-bold text-white",
                phase === "correct"
                  ? "bg-accent text-white"
                  : "bg-wrong text-white",
              )}
            >
              {current + 1 >= total ? "結果を見る" : "つづける"}
            </button>
          )}
        </div>
      </footer>
    </EventShell>
  );
}
