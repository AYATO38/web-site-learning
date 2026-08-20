"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X, Check, Sparkles, Minus, Plus } from "lucide-react";
import { ChoiceButton } from "@/components/choice-button";
import { QuestionBubble } from "@/components/question-bubble";
import { LiveBoard } from "@/components/next-server-day/live-board";
import { InviteShare } from "@/components/next-server-day/invite-share";
import { EventShell } from "@/components/next-server-day/event-shell";
import { EventHero } from "@/components/next-server-day/event-hero";
import { ResultScreen } from "@/components/next-server-day/result-screen";
import { QuizTimer } from "@/components/next-server-day/quiz-timer";
import { useQuestionTimer } from "@/components/next-server-day/use-question-timer";
import { cn } from "@/lib/utils";
import {
  DIFFICULTY_LABELS,
  TIME_LIMIT_OPTIONS,
  timeLimitLabel,
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
import { playCorrectSfx, playWrongSfx } from "@/lib/sfx";
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
  const [timeLimitDraft, setTimeLimitDraft] = useState<number | null>(15);
  const [timedOut, setTimedOut] = useState(false);

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
    setTimedOut(false);
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

  function applyWrong(fromTimeout: boolean) {
    setBrokenCombo(combo);
    setCombo(0);
    setTimedOut(fromTimeout);
    setPhase("wrong");
    void playWrongSfx();
    void syncStatus({
      current,
      total,
      combo: 0,
      xp,
      lastResult: "wrong",
      finished: false,
    });
  }

  function handleTimeout() {
    if (phase !== "answering") return;
    applyWrong(true);
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
      setTimedOut(false);
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
      applyWrong(false);
    }
  }

  const remaining = useQuestionTimer({
    seconds: room?.timeLimitSeconds,
    questionIndex: current,
    running: Boolean(question) && phase === "answering" && !finished,
    onTimeout: handleTimeout,
  });

  function handleContinue() {
    if (current + 1 >= total) {
      setFinished(true);
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
    setTimedOut(false);
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
    setTimedOut(false);
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
    setTimedOut(false);
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
      const created = await createRoom(names, timeLimitDraft);
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
    if (timedOut) {
      return "時間切れ！次の問題で巻き返そう。";
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
        <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-1 flex-col px-4 pb-8 pt-8">
          <EventHero
            backHref="/"
            title="次サバDAY"
            subtitle="招待リンクを送れば、別のネットの端末からも参加できます"
          />

          <div className="mb-5 grid grid-cols-2 gap-1 rounded-full bg-muted p-1 ring-1 ring-border">
            <button
              type="button"
              onClick={() => {
                setEntryMode("create");
                setError(null);
              }}
              className={cn(
                "rounded-full py-2.5 text-sm font-semibold",
                entryMode === "create"
                  ? "event-cta shadow-none"
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
                "rounded-full py-2.5 text-sm font-semibold",
                entryMode === "join"
                  ? "event-cta shadow-none"
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

              <section className="mt-5 event-card rounded-[1.4rem] p-5">
                <p className="text-sm font-bold text-foreground">1問の制限時間</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  時間内に答えられなかった問題は不正解になります。なしも選べます。
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {TIME_LIMIT_OPTIONS.map((option) => {
                    const selected = timeLimitDraft === option.seconds;
                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => setTimeLimitDraft(option.seconds)}
                        className={cn(
                          "rounded-full px-3.5 py-2 text-sm font-bold",
                          selected
                            ? "event-cta shadow-none"
                            : "border border-border bg-surface-elevated text-muted-foreground",
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {error && (
                <p className="mt-3 text-sm font-semibold text-wrong">{error}</p>
              )}

              <button
                type="button"
                onClick={() => void startWithTeams()}
                disabled={!canStart || busy}
                className={cn(
                  "mt-6 w-full rounded-full py-4 text-lg font-bold",
                  canStart && !busy
                    ? "event-cta"
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
                <p className="mt-3 text-sm font-semibold text-wrong">{error}</p>
              )}
              <button
                type="button"
                onClick={() => void joinRoom()}
                disabled={busy}
                className={cn(
                  "mt-6 w-full rounded-full py-4 text-lg font-bold",
                  busy
                    ? "cursor-not-allowed bg-muted text-muted-foreground"
                    : "event-cta",
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
        <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-1 flex-col px-4 pb-8 pt-8">
          <EventHero
            kicker={`Room ${roomId}`}
            title="チームを選ぶ"
            subtitle={`名前を入れて、同じチームに複数人で入れます · ${timeLimitLabel(room.timeLimitSeconds)}`}
          />

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
            <p className="mb-3 text-sm font-semibold text-wrong">{error}</p>
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
        <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-1 flex-col px-4 pb-8 pt-8">
          <EventHero
            backHref="/"
            kicker={`Room ${roomId}`}
            title="難易度を選ぶ"
            subtitle={`自分のチーム: ${myTeam} / ${displayName || "未設定"} · ${timeLimitLabel(room.timeLimitSeconds)}`}
          />
          <button
            type="button"
            onClick={() => setMyTeam(null)}
            className="mb-6 -mt-3 text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline"
          >
            チーム選択をやり直す
          </button>

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
                      setTimedOut(false);
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
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold tracking-wide text-muted-foreground">
              {roomId} · {myTeam}
              {room.timeLimitSeconds ? ` · ${timeLimitLabel(room.timeLimitSeconds)}` : ""}
            </p>
            <h2 className="mt-2 text-lg font-black tracking-tight">みんなでクイズ</h2>
          </div>
          <Link
            href="/"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-6" strokeWidth={3} />
          </Link>
        </div>
        {room.timeLimitSeconds && remaining !== null && phase === "answering" ? (
          <QuizTimer total={room.timeLimitSeconds} remaining={remaining} />
        ) : null}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
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

      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-[calc(12rem+env(safe-area-inset-bottom))] pt-2 sm:px-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground">
            {DIFFICULTY_LABELS[selectedDifficulty].label} · もんだい {current + 1} /{" "}
            {total}
          </p>
          <div className="flex items-center gap-2">
            {combo >= 2 && (
              <span className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-white">
                {combo}連続！
              </span>
            )}
            <span className="rounded-full border border-border bg-muted px-3 py-1 text-sm font-semibold text-foreground">
              XP +{question.xp}
            </span>
          </div>
        </div>
        <QuestionBubble prompt={question.prompt} code={question.code} />

        <div className="mt-6 grid gap-3">
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
          "fixed inset-x-0 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-40 border-t border-border bg-background/90 backdrop-blur-xl",
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
                <p className="mt-1 text-sm font-semibold leading-relaxed text-foreground sm:text-base">
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
                "w-full rounded-full py-4 text-lg font-bold",
                selected !== null
                  ? "event-cta"
                  : "cursor-not-allowed bg-muted text-muted-foreground",
              )}
            >
              これで答える！
            </button>
          ) : (
            <button
              type="button"
              onClick={handleContinue}
              className={cn(
                "w-full rounded-full py-4 text-lg font-bold text-white",
                phase === "correct"
                  ? "event-cta"
                  : "bg-wrong text-white",
              )}
            >
              {current + 1 >= total ? "結果を見る" : "つぎへ！"}
            </button>
          )}
        </div>
      </footer>
    </EventShell>
  );
}
