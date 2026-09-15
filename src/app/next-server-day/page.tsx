"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Minus, Plus } from "lucide-react";
import { QuestionBubble } from "@/components/question-bubble";
import { LiveBoard } from "@/components/next-server-day/live-board";
import { StandingsReveal } from "@/components/next-server-day/standings-reveal";
import { WaitingBanner } from "@/components/next-server-day/waiting-banner";
import { InviteShare } from "@/components/next-server-day/invite-share";
import { EventShell } from "@/components/next-server-day/event-shell";
import { EventHero } from "@/components/next-server-day/event-hero";
import { ResultScreen } from "@/components/next-server-day/result-screen";
import { QuizTimer } from "@/components/next-server-day/quiz-timer";
import { AnswerPanel } from "@/components/next-server-day/answer-panel";
import { RoomCodeInput } from "@/components/next-server-day/room-code-input";
import { RoomSettingsPanel } from "@/components/next-server-day/room-settings";
import { useLockQuizLeave, useRequestLeave } from "@/components/leave-guard";
import { useQuestionTimer } from "@/components/next-server-day/use-question-timer";
import { cn } from "@/lib/utils";
import {
  DIFFICULTY_LABELS,
  QUESTION_KIND_LABELS,
  QUESTION_TIME_LIMIT_LABEL,
  type Difficulty,
} from "@/lib/next-server-day";
import {
  canSubmitDraft,
  earnedXp,
  gradeAnswer,
  initialDraft,
  questionTimeLimit,
  speedWindowSeconds,
  type AnswerDraft,
} from "@/lib/nsd-grade";
import {
  DEFAULT_GALLERY_CAPACITY,
  GALLERY_MAX,
  ROOM_CODE_LENGTH,
  allTeamsDone,
  createRoom,
  fetchRoom,
  isHost,
  lockedDifficulty,
  normalizeRoomCode,
  pendingPlayers,
  readyToReveal,
  releaseQuestion,
  roomRanking,
  updateRoomSettings,
  updateTeamStatus,
  type RankedPlayer,
  type Room,
  type TeamMember,
} from "@/lib/nsd-room";
import { fetchMe } from "@/lib/auth/client";
import { loadOutfit, normalizeOutfit, type MascotOutfit } from "@/lib/mascot";
import { playCorrectSfx, playWrongSfx } from "@/lib/sfx";
import { nsdQuestions } from "@/data/next-server-day";

const questions = nsdQuestions;

type Phase = "answering" | "waiting" | "standings";
type EntryMode = "create" | "join";

const MIN_TEAMS = 2;
const MAX_TEAMS = 8;

function defaultTeamNames(count: number, prev: string[] = []) {
  return Array.from({ length: count }, (_, i) => prev[i] ?? `チーム${i + 1}`);
}

function DifficultyStartGrid({
  host,
  disabled,
  onPick,
}: {
  host: boolean;
  disabled?: boolean;
  onPick: (key: Difficulty) => void;
}) {
  return (
    <>
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        {host
          ? "難易度を選ぶと、部屋の全員がいっしょにスタートします。"
          : "ルームマスターが難易度を選ぶまで待ってください。選ばれたら全員いっしょに始まります。"}
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((key) => {
          const d = DIFFICULTY_LABELS[key];
          const count = questions.filter((q) => q.difficulty === key).length;
          const locked = disabled || !host || count === 0;
          return (
            <button
              key={key}
              type="button"
              disabled={locked}
              onClick={() => onPick(key)}
              className="event-card flex flex-col items-center justify-center gap-3 rounded-[1.4rem] p-6 text-center transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="rounded-full bg-accent-soft p-3 text-accent">
                <Sparkles className="size-6" />
              </span>
              <div>
                <div className="text-lg font-extrabold">{d.label}</div>
                <div className="mt-1 text-sm text-muted-foreground">{d.desc}</div>
                <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {d.kinds}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

export default function NextServerDayPage() {
  const [entryMode, setEntryMode] = useState<EntryMode>("create");
  const [teams, setTeams] = useState<string[] | null>(null);
  const [myTeam, setMyTeam] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [myOutfit, setMyOutfit] = useState<MascotOutfit | null>(null);
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
  const [draft, setDraft] = useState<AnswerDraft>({ kind: "choice", index: null });
  const [draftKey, setDraftKey] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("answering");
  const [finished, setFinished] = useState(false);
  const [combo, setCombo] = useState(0);
  const [brokenCombo, setBrokenCombo] = useState(0);
  const [xp, setXp] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [roundResult, setRoundResult] = useState<"correct" | "wrong" | null>(
    null,
  );
  const [galleryCapacityDraft, setGalleryCapacityDraft] = useState(
    DEFAULT_GALLERY_CAPACITY,
  );
  const [inGallery, setInGallery] = useState(false);
  const [skipAutoSeat, setSkipAutoSeat] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [lastGain, setLastGain] = useState<{ xp: number; bonus: number } | null>(
    null,
  );
  const [standingsSnapshot, setStandingsSnapshot] = useState<
    RankedPlayer[] | null
  >(null);
  const standingsPrevRanks = useRef<Map<string, number> | null>(null);
  const nameTouchedRef = useRef(false);

  const inQuiz = Boolean(room && myTeam && selectedDifficulty && !finished);
  useLockQuizLeave(inQuiz);
  const requestLeave = useRequestLeave();

  const activeQuestions = useMemo(
    () =>
      selectedDifficulty
        ? questions.filter((q) => q.difficulty === selectedDifficulty)
        : [],
    [selectedDifficulty],
  );

  const total = activeQuestions.length;
  const question = activeQuestions[current];
  const timeCap = questionTimeLimit();
  const questionKey = question ? `${question.id}:${attempt}` : null;

  if (question && questionKey !== draftKey) {
    setDraftKey(questionKey);
    setDraft(initialDraft(question));
  }

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

    // A guest name typed last time fills the field right away; the account
    // name (once it loads) always takes priority as the default, unless the
    // player has already started typing their own.
    const savedName = sessionStorage.getItem("nsd-member-name");
    if (savedName && !nameTouchedRef.current) setDisplayName(savedName);

    void fetchMe()
      .then((user) => {
        if (user && !nameTouchedRef.current) setDisplayName(user.name);
        setMyOutfit(
          user?.outfit
            ? normalizeOutfit(user.outfit)
            : loadOutfit(user?.id ?? null),
        );
      })
      .catch(() => {
        setMyOutfit(loadOutfit());
      });

    const code = normalizeRoomCode(
      new URLSearchParams(window.location.search).get("room") ?? "",
    );
    if (code.length === ROOM_CODE_LENGTH) {
      setEntryMode("join");
      setJoinCode(code);
      void enterRoomByCode(code);
    }
  }, []);

  function handleDisplayNameChange(value: string) {
    nameTouchedRef.current = true;
    setDisplayName(value);
  }

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
      setRoundResult(me.lastResult);
      // Already answered this question — the waiting/standings effects below
      // will sort out whether everyone else (and the master) are ready too.
      setPhase(me.lastResult ? "waiting" : "answering");
      return;
    }

    const count = questions.filter((q) => q.difficulty === team.difficulty).length;
    setCurrent(0);
    setCombo(0);
    setBrokenCombo(0);
    setXp(0);
    setCorrectCount(0);
    setBestCombo(0);
    setPhase("answering");
    setRoundResult(null);
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

  useEffect(() => {
    if (!room || !memberId || skipAutoSeat || myTeam || inGallery) return;
    if (room.gallery.some((guest) => guest.id === memberId)) {
      setInGallery(true);
    }
  }, [room, memberId, skipAutoSeat, myTeam, inGallery]);

  // Once everyone still active has answered this question too, move on from
  // the waiting room straight into the standings reveal for everyone.
  useEffect(() => {
    if (phase !== "waiting" || !room || !memberId) return;
    if (readyToReveal(room, memberId, current)) revealStandings(room);
  }, [phase, room, current, memberId]);

  // Only the room master decides when standings end for the original synced
  // round (attempt 0). Everyone else's screen (the master's included, for a
  // snappy response to their own click) watches the room-wide release signal
  // and advances together once it arrives. A solo "もう一度挑戦" replay
  // (attempt > 0) is excluded — that signal is a leftover from the first
  // playthrough and would otherwise skip its standings screen instantly; the
  // player instead gets their own advance button (see canAdvanceStandings).
  useEffect(() => {
    if (phase !== "standings" || !room || !memberId || attempt > 0) return;
    if (room.releasedQuestion >= current) handleContinueFromStandings();
  }, [phase, room, current, memberId, attempt]);

  /**
   * Patches my own entry in the local room snapshot right away, ahead of the
   * network round-trip. Without this, a check like `allTeamsDone` reads a
   * stale "not finished yet" for me until the next poll lands (flashing a
   * "waiting for others" state right before the result screen it was about
   * to show anyway) — and if I'm the last one to answer, the standings
   * reveal that fires immediately after would compute everyone's rank from
   * a room snapshot that doesn't even include my own just-submitted score.
   */
  function patchMyRoomMember(patch: Partial<TeamMember>) {
    if (!myTeam || !memberId) return;
    setRoom((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        teams: prev.teams.map((team) =>
          team.name !== myTeam
            ? team
            : {
                ...team,
                members: team.members.map((member) =>
                  member.id === memberId ? { ...member, ...patch } : member,
                ),
              },
        ),
      };
    });
  }

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
        outfit: myOutfit ?? undefined,
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
    setRoundResult("wrong");
    setPhase("waiting");
    setLastGain(null);
    void playWrongSfx();
    patchMyRoomMember({ current, total, combo: 0, xp, lastResult: "wrong" });
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

  const { remaining, elapsedMs } = useQuestionTimer({
    seconds: timeCap,
    questionIndex: current,
    running: Boolean(question) && phase === "answering" && !finished,
    onTimeout: handleTimeout,
  });

  const previewGain = question
    ? earnedXp({
        baseXp: question.xp,
        elapsedMs,
        windowSeconds: speedWindowSeconds(),
      })
    : null;

  function handleCheck() {
    if (!question || !canSubmitDraft(question, draft)) return;
    const isCorrect = gradeAnswer(question, draft);
    if (isCorrect) {
      const gain = earnedXp({
        baseXp: question.xp,
        elapsedMs,
        windowSeconds: speedWindowSeconds(),
      });
      const nextCombo = combo + 1;
      const nextXp = xp + gain.xp;
      setCombo(nextCombo);
      setXp(nextXp);
      setLastGain(gain);
      setCorrectCount((n) => n + 1);
      setBestCombo((best) => Math.max(best, nextCombo));
      setTimedOut(false);
      setRoundResult("correct");
      setPhase("waiting");
      void playCorrectSfx(nextCombo);
      patchMyRoomMember({
        current,
        total,
        combo: nextCombo,
        xp: nextXp,
        lastResult: "correct",
      });
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

  function revealStandings(source: Room) {
    setStandingsSnapshot(roomRanking(source));
    setPhase("standings");
  }

  function handleSkipWaiting() {
    if (room) revealStandings(room);
  }

  function handleContinueFromStandings() {
    if (standingsSnapshot) {
      standingsPrevRanks.current = new Map(
        standingsSnapshot.map((player, index) => [player.id, index]),
      );
    }
    setStandingsSnapshot(null);
    handleContinue();
  }

  /**
   * Room master only, and only for the original synced round (attempt 0) —
   * a solo "もう一度挑戦" replay paces itself instead of waiting on a release
   * signal left over (and already past) from the first playthrough.
   */
  function handleMasterAdvance() {
    if (roomId && memberId && room && attempt === 0 && isHost(room, memberId)) {
      void releaseQuestion(roomId, memberId, current).catch(() => {
        /* the room poll will pick up a retry on the next click */
      });
    }
    handleContinueFromStandings();
  }

  function handleContinue() {
    if (current + 1 >= total) {
      setFinished(true);
      patchMyRoomMember({ finished: true });
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
    setPhase("answering");
    setTimedOut(false);
    setLastGain(null);
    setRoundResult(null);
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
    setPhase("answering");
    setFinished(false);
    setCombo(0);
    setBrokenCombo(0);
    setXp(0);
    setCorrectCount(0);
    setBestCombo(0);
    setTimedOut(false);
    setLastGain(null);
    setRoundResult(null);
    setStandingsSnapshot(null);
    standingsPrevRanks.current = null;
    setAttempt((n) => n + 1);
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
    setInGallery(false);
    setSkipAutoSeat(false);
    setFinished(false);
    setCombo(0);
    setBrokenCombo(0);
    setXp(0);
    setCorrectCount(0);
    setBestCombo(0);
    setTimedOut(false);
    setRoundResult(null);
    setStandingsSnapshot(null);
    standingsPrevRanks.current = null;
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
      const hostName = displayName.trim();
      if (!hostName || !memberId) {
        setError("ルームマスターの名前を入力してください");
        return;
      }
      const created = await createRoom(names, {
        galleryCapacity: galleryCapacityDraft,
        host: { memberId, name: hostName },
      });
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
    const roomCode = normalizeRoomCode(code);
    if (roomCode.length < ROOM_CODE_LENGTH) {
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

  async function startAllWithDifficulty(key: Difficulty) {
    if (!roomId || !memberId) return;
    if (!room || !isHost(room, memberId)) {
      setError("難易度を選んでスタートできるのはルームマスターだけです");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const next = await updateRoomSettings(roomId, memberId, {
        difficulty: key,
      });
      setRoom(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "スタートできませんでした");
    } finally {
      setBusy(false);
    }
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
        outfit: myOutfit ?? undefined,
      });
      setRoom(next);
      setSkipAutoSeat(false);
      setInGallery(false);
      setMyTeam(name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "チームに入れませんでした");
    } finally {
      setBusy(false);
    }
  }

  async function chooseGallery() {
    const playerName = displayName.trim();
    if (!playerName) {
      setError("あなたの名前を入力してください");
      return;
    }
    if (!roomId || !memberId) {
      setError("準備が終わるまで少し待ってから、もう一度選んでください");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      sessionStorage.setItem("nsd-member-name", playerName);
      const next = await updateTeamStatus(roomId, {
        teamName: "",
        memberId,
        memberName: playerName,
        joinGallery: true,
      });
      setRoom(next);
      setSkipAutoSeat(false);
      setMyTeam(null);
      setSelectedDifficulty(null);
      setInGallery(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ギャラリーに入れませんでした");
    } finally {
      setBusy(false);
    }
  }

  function reselectSeat() {
    setSkipAutoSeat(true);
    setMyTeam(null);
    setInGallery(false);
    setSelectedDifficulty(null);
  }

  function feedbackTitle() {
    if (roundResult === "correct") {
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

  const readyToSubmit = Boolean(question && canSubmitDraft(question, draft));

  if (!teams || !roomId || !room) {
    const canStart =
      teamNameDrafts.every((name) => name.trim().length > 0) &&
      displayName.trim().length > 0 &&
      Boolean(memberId);

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

              <label className="mt-5 flex flex-col gap-1.5">
                <span className="text-sm font-bold text-muted-foreground">
                  ルームマスターの名前
                </span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => handleDisplayNameChange(e.target.value)}
                  maxLength={20}
                  placeholder="例: POSSE"
                  className="rounded-xl border border-border bg-surface-elevated px-4 py-3 text-base font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
                />
              </label>

              <section className="mt-5 event-card rounded-[1.4rem] p-5">
                <p className="text-sm font-bold text-foreground">ギャラリー枠</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  クイズには参加せず、会場の進行と結果を見る席です。0にすると観戦できません。
                </p>
                <div className="mt-3 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      setGalleryCapacityDraft((n) => Math.max(0, n - 1))
                    }
                    disabled={galleryCapacityDraft <= 0}
                    className="flex size-12 items-center justify-center rounded-xl border border-border bg-surface-elevated text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="ギャラリー枠を減らす"
                  >
                    <Minus className="size-5" strokeWidth={3} />
                  </button>
                  <span className="min-w-16 text-center text-5xl font-extrabold tabular-nums text-accent">
                    {galleryCapacityDraft}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setGalleryCapacityDraft((n) => Math.min(GALLERY_MAX, n + 1))
                    }
                    disabled={galleryCapacityDraft >= GALLERY_MAX}
                    className="flex size-12 items-center justify-center rounded-xl border border-border bg-surface-elevated text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="ギャラリー枠を増やす"
                  >
                    <Plus className="size-5" strokeWidth={3} />
                  </button>
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  0〜{GALLERY_MAX}席
                </p>
              </section>

              <p className="mt-5 text-center text-xs text-muted-foreground">
                {QUESTION_TIME_LIMIT_LABEL}固定です。早く答えるほど XP が増えます（最大2倍）。
              </p>

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
                <RoomCodeInput
                  value={joinCode}
                  onChange={setJoinCode}
                  disabled={busy}
                  onSubmit={() => void joinRoom()}
                />
                <span className="text-center text-xs text-muted-foreground">
                  4文字です。全角でも入れられます。貼り付けもできます。
                </span>
              </label>
              {error && (
                <p className="mt-3 text-sm font-semibold text-wrong">{error}</p>
              )}
              <button
                type="button"
                onClick={() => void joinRoom()}
                disabled={busy || joinCode.length < ROOM_CODE_LENGTH}
                className={cn(
                  "mt-6 w-full rounded-full py-4 text-lg font-bold",
                  busy || joinCode.length < ROOM_CODE_LENGTH
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

  if (!myTeam && !inGallery) {
    const galleryLeft = Math.max(0, room.galleryCapacity - room.gallery.length);
    return (
      <EventShell>
        <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-1 flex-col px-4 pb-8 pt-8">
          <EventHero
            kicker={`Room ${roomId}`}
            title="チームを選ぶ"
            subtitle={
              room.host
                ? `ルームマスター: ${room.host.name} · ${QUESTION_TIME_LIMIT_LABEL}`
                : `名前を入れて、同じチームに複数人で入れます · ${QUESTION_TIME_LIMIT_LABEL}`
            }
          />

          <InviteShare roomId={roomId} />

          <RoomSettingsPanel
            room={room}
            memberId={memberId}
            onUpdated={setRoom}
          />

          <label className="mb-5 flex flex-col gap-1.5">
            <span className="text-sm font-bold text-muted-foreground">
              あなたの名前
            </span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              maxLength={20}
              placeholder="例: POSSE"
              className="rounded-xl border border-border bg-surface-elevated px-4 py-3 text-base font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
            />
            {memberId && isHost(room, memberId) ? (
              <span className="text-xs font-bold text-accent">あなたがこの部屋のルームマスターです</span>
            ) : null}
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
                    : `${team.members.length}人 · ${team.members
                        .map((m) =>
                          isHost(room, m.id) ? `${m.name}（ルームマスター）` : m.name,
                        )
                        .join("、")}`}
                </p>
              </button>
            ))}
            {room.galleryCapacity > 0 ? (
              <button
                type="button"
                disabled={busy || galleryLeft === 0}
                onClick={() => void chooseGallery()}
                className="event-card rounded-2xl px-5 py-4 text-left transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                <p className="text-lg font-extrabold">ギャラリー枠</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {galleryLeft === 0
                    ? "満席です"
                    : `残り ${galleryLeft}席 · クイズには参加せず観戦します`}
                </p>
              </button>
            ) : null}
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

  if (inGallery) {
    return (
      <EventShell>
        {allTeamsDone(room) ? (
          <ResultScreen
            room={room}
            myTeam={null}
            myMemberId={memberId}
            correctCount={0}
            total={0}
            xp={0}
            bestCombo={0}
            onRestart={reselectSeat}
            spectator
          />
        ) : (
          <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-1 flex-col px-4 pb-8 pt-8">
            <EventHero
              backHref="/"
              kicker={`Room ${roomId}`}
              title="ギャラリー観戦"
              subtitle={
                room.host
                  ? `ルームマスター: ${room.host.name} · 会場の進行を見ています`
                  : "会場の進行を見ています"
              }
            />
            <button
              type="button"
              onClick={reselectSeat}
              className="mb-6 -mt-3 text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline"
            >
              席を選び直す
            </button>
            <RoomSettingsPanel
              room={room}
              memberId={memberId}
              onUpdated={setRoom}
            />
            {isHost(room, memberId) && !lockedDifficulty(room) ? (
              <div className="mb-6">
                {error ? (
                  <p className="mb-3 text-sm font-semibold text-wrong">{error}</p>
                ) : null}
                <DifficultyStartGrid
                  host
                  disabled={busy}
                  onPick={(key) => void startAllWithDifficulty(key)}
                />
              </div>
            ) : null}
            <LiveBoard room={room} myTeam={null} myMemberId={memberId} />
          </div>
        )}
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
            title={
              isHost(room, memberId)
                ? "難易度を選んでスタート"
                : "スタート待ち"
            }
            subtitle={`自分のチーム: ${myTeam} / ${displayName || "未設定"}${isHost(room, memberId) ? " · ルームマスター" : ""} · ${QUESTION_TIME_LIMIT_LABEL}`}
          />
          <button
            type="button"
            onClick={reselectSeat}
            className="mb-6 -mt-3 text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline"
          >
            チーム選択をやり直す
          </button>

          <RoomSettingsPanel
            room={room}
            memberId={memberId}
            onUpdated={setRoom}
          />

          <div className="mb-6">
            <LiveBoard room={room} myTeam={myTeam} myMemberId={memberId} />
          </div>

          {error ? (
            <p className="mb-3 text-sm font-semibold text-wrong">{error}</p>
          ) : null}

          <DifficultyStartGrid
            host={isHost(room, memberId)}
            disabled={busy}
            onPick={(key) => void startAllWithDifficulty(key)}
          />
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

  if (phase === "standings" && standingsSnapshot && room) {
    return (
      <EventShell reserveNav={false}>
        <StandingsReveal
          snapshot={standingsSnapshot}
          previousRanks={standingsPrevRanks.current}
          myMemberId={memberId}
          questionNumber={current + 1}
          total={total}
          isLast={current + 1 >= total}
          canAdvance={attempt > 0 || isHost(room, memberId)}
          onAdvance={handleMasterAdvance}
          recap={
            roundResult && question
              ? {
                  result: roundResult,
                  title: feedbackTitle(),
                  gain: roundResult === "correct" ? lastGain : null,
                  explanation: question.explanation,
                }
              : null
          }
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
    <EventShell reserveNav={false}>
      <header className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-5 sm:px-6">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold tracking-wide text-muted-foreground">
              {roomId} · {myTeam} · {QUESTION_TIME_LIMIT_LABEL}
            </p>
            <h2 className="mt-2 text-lg font-black tracking-tight">みんなでクイズ</h2>
          </div>
          <button
            type="button"
            onClick={() => requestLeave("/")}
            className="rounded-full border border-border bg-white px-3.5 py-2 text-sm font-bold text-muted-foreground transition-colors hover:border-wrong hover:text-wrong"
          >
            退出
          </button>
        </div>
        {remaining !== null ? <QuizTimer total={timeCap} remaining={remaining} /> : null}
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

      <section
        className={cn(
          "mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-2 sm:px-6",
          phase === "answering" ? "pb-40" : "pb-56",
        )}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground">
            {DIFFICULTY_LABELS[selectedDifficulty].label} ·{" "}
            {QUESTION_KIND_LABELS[question.kind]} · もんだい {current + 1} / {total}
          </p>
          <div className="flex items-center gap-2">
            {combo >= 2 && (
              <span className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-white">
                {combo}連続！
              </span>
            )}
            <span className="rounded-full border border-border bg-muted px-3 py-1 text-sm font-semibold text-foreground">
              {phase === "answering" && previewGain
                ? `今 +${previewGain.xp} XP`
                : lastGain
                  ? `+${lastGain.xp} XP`
                  : `XP +${question.xp}〜${question.xp * 2}`}
            </span>
          </div>
        </div>
        <QuestionBubble prompt={question.prompt} code={question.code} />

        <AnswerPanel
          question={question}
          draft={draft}
          phase={phase}
          onChange={setDraft}
        />

        <div className="mt-6">
          <LiveBoard room={room} myTeam={myTeam} myMemberId={memberId} />
        </div>
      </section>

      <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-2xl px-4 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-6">
          {phase === "answering" ? (
            <button
              type="button"
              onClick={handleCheck}
              disabled={!readyToSubmit}
              className={cn(
                "w-full rounded-full py-4 text-lg font-bold",
                readyToSubmit
                  ? "event-cta"
                  : "cursor-not-allowed bg-muted text-muted-foreground",
              )}
            >
              これで答える！
            </button>
          ) : (
            <WaitingBanner
              pending={
                memberId
                  ? pendingPlayers(room, memberId, current).filter(
                      (player) => !player.away,
                    )
                  : []
              }
              onSkip={handleSkipWaiting}
            />
          )}
        </div>
      </footer>
    </EventShell>
  );
}
