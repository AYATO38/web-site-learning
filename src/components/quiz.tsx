"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { Question } from "@/lib/questions";
import { ChoiceButton } from "@/components/choice-button";
import { QuestionBubble } from "@/components/question-bubble";
import { playWrongSfx } from "@/lib/sfx";
import { Check, Heart, RotateCcw, X } from "lucide-react";

type Phase = "answering" | "correct" | "wrong";

export function Quiz({
  lessonTitle,
  questions,
}: {
  lessonTitle?: string;
  questions: Question[];
}) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("answering");
  const [hearts, setHearts] = useState(3);
  const [finished, setFinished] = useState(false);

  const total = questions.length;
  const question = questions[current];

  const progress = useMemo(() => {
    const base = (current / total) * 100;
    return finished ? 100 : base;
  }, [current, total, finished]);

  function handleCheck() {
    if (selected === null) return;
    const isCorrect = selected === question.answerIndex;
    setPhase(isCorrect ? "correct" : "wrong");
    if (!isCorrect) {
      setHearts((h) => Math.max(0, h - 1));
      void playWrongSfx();
    }
  }

  function handleContinue() {
    if (current + 1 >= total) {
      setFinished(true);
      return;
    }
    setCurrent((c) => c + 1);
    setSelected(null);
    setPhase("answering");
  }

  function handleRestart() {
    setCurrent(0);
    setSelected(null);
    setPhase("answering");
    setHearts(3);
    setFinished(false);
  }

  function choiceStatus(index: number) {
    if (phase === "answering") return selected === index ? "selected" : "idle";
    if (index === question.answerIndex) return "correct";
    if (index === selected) return "wrong";
    return "idle";
  }

  if (finished) {
    return (
      <ResultScreen
        lessonTitle={lessonTitle}
        total={total}
        hearts={hearts}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <main className="quiz-play relative flex min-h-dvh flex-col text-foreground">
      <span className="event-glow pointer-events-none" aria-hidden />
      <header className="relative z-10 mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-5 sm:px-5">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0">
            {lessonTitle ? (
              <p className="truncate rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold tracking-wide text-muted-foreground">
                {lessonTitle}
              </p>
            ) : (
              <p className="section-en">Quiz</p>
            )}
            <h2 className="mt-2 text-lg font-black tracking-tight">クイズ</h2>
          </div>
          <Link
            href="/"
            aria-label="ホームに戻る"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-6" strokeWidth={3} />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="学習の進捗"
              className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
              style={{ width: `${Math.max(progress, 6)}%` }}
            />
          </div>
          <div className="flex items-center gap-1 rounded-full border border-border bg-surface-elevated px-2.5 py-1 text-sm font-semibold text-wrong">
            <Heart className="size-4 fill-wrong text-wrong" />
            <span className="tabular-nums">{hearts}</span>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-40 sm:px-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground">
            もんだい {current + 1} / {total}
          </p>
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
      </section>

      <Footer
        phase={phase}
        canCheck={selected !== null}
        explanation={question.explanation}
        onCheck={handleCheck}
        onContinue={handleContinue}
        isLast={current + 1 >= total}
      />
    </main>
  );
}

type FooterProps = {
  phase: Phase;
  canCheck: boolean;
  explanation: string;
  isLast: boolean;
  onCheck: () => void;
  onContinue: () => void;
};

function Footer({
  phase,
  canCheck,
  explanation,
  isLast,
  onCheck,
  onContinue,
}: FooterProps) {
  const isFeedback = phase !== "answering";
  const isCorrect = phase === "correct";

  return (
    <footer
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl transition-colors duration-200",
        isCorrect && "border-correct/30 bg-correct-surface",
        phase === "wrong" && "border-wrong/30 bg-wrong-surface",
      )}
    >
      <div className="mx-auto w-full max-w-lg px-4 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-5">
        {isFeedback && (
          <div
            className={cn(
              "mb-4 flex items-start gap-3",
              isCorrect ? "text-accent" : "text-wrong",
            )}
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full",
                isCorrect ? "bg-accent text-white" : "bg-wrong text-white",
              )}
            >
              {isCorrect ? (
                <Check className="size-5" strokeWidth={3} />
              ) : (
                <X className="size-5" strokeWidth={3} />
              )}
            </span>
            <div>
              <p className="text-lg font-extrabold leading-snug">
                {isCorrect ? "正解です！" : "不正解です"}
              </p>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-foreground sm:text-base">
                <span className="font-extrabold">解説: </span>
                {explanation}
              </p>
            </div>
          </div>
        )}

        {!isFeedback ? (
          <button
            type="button"
            onClick={onCheck}
            disabled={!canCheck}
            className={cn(
              "w-full rounded-full py-4 text-lg font-bold",
              canCheck
                ? "event-cta"
                : "cursor-not-allowed bg-muted text-muted-foreground",
            )}
          >
            これで答える！
          </button>
        ) : (
          <button
            type="button"
            onClick={onContinue}
            className={cn(
              "w-full rounded-full py-4 text-lg font-bold text-white",
              isCorrect ? "event-cta" : "bg-wrong text-white",
            )}
          >
            {isLast ? "結果を見る" : "つぎへ！"}
          </button>
        )}
      </div>
    </footer>
  );
}

function ResultScreen({
  lessonTitle,
  total,
  hearts,
  onRestart,
}: {
  lessonTitle?: string;
  total: number;
  hearts: number;
  onRestart: () => void;
}) {
  return (
    <main className="quiz-play relative flex min-h-dvh flex-col text-foreground">
      <span className="event-glow pointer-events-none" aria-hidden />
      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-10">
        <p className="section-en text-center">Result</p>
        <h1 className="event-title mt-2 text-center">レッスン完了</h1>
        <span className="rule-line mx-auto mt-3" />
        {lessonTitle ? (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {lessonTitle}
          </p>
        ) : null}

        <section className="event-card relative mt-8 overflow-hidden rounded-2xl p-5">
          <span className="event-glow" aria-hidden />
          <p className="section-en">Score</p>
          <h2 className="mt-1 text-base font-bold">あなたの成績</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-muted px-3 py-3">
              <dt className="text-xs text-muted-foreground">問題数</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums">{total} 問</dd>
            </div>
            <div className="rounded-xl bg-muted px-3 py-3">
              <dt className="text-xs text-muted-foreground">残りライフ</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums">{hearts}</dd>
            </div>
          </dl>
        </section>

        <button
          type="button"
          onClick={onRestart}
          className="event-cta mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full py-4 text-lg font-semibold"
        >
          <RotateCcw className="size-5" />
          もう一度
        </button>
        <Link
          href="/"
          className="mt-4 text-center text-sm font-semibold text-muted-foreground"
        >
          ホームに戻る
        </Link>
      </div>
    </main>
  );
}
