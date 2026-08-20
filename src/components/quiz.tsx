"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { Question } from "@/lib/questions";
import { ChoiceButton } from "@/components/choice-button";
import { QuestionBubble } from "@/components/question-bubble";
import { Check, Heart, X } from "lucide-react";

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
    if (!isCorrect) setHearts((h) => Math.max(0, h - 1));
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
      <ResultScreen total={total} hearts={hearts} onRestart={handleRestart} />
    );
  }

  return (
    <main className="quiz-play flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-2xl items-center gap-4 px-4 py-5 sm:px-6">
        <Link
          href="/"
          aria-label="ホームに戻る"
          className="flex size-10 items-center justify-center rounded-full border border-border bg-surface-elevated text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-6" strokeWidth={3} />
        </Link>
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
        <div className="flex items-center gap-1 rounded-full border border-border bg-surface-elevated px-2.5 py-1 font-semibold text-wrong">
          <Heart className="size-5 fill-wrong text-wrong" />
          <span className="text-lg tabular-nums">{hearts}</span>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-40 pt-2 sm:px-6">
        <p className="text-sm font-bold text-accent">
          {lessonTitle ? `${lessonTitle} · ` : ""}もんだい {current + 1} / {total}
        </p>
        <QuestionBubble prompt={question.prompt} code={question.code} />

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
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
        "fixed inset-x-0 bottom-0 border-t border-border bg-background transition-colors duration-200",
        !isFeedback && "bg-background/95",
        isCorrect && "bg-correct-surface",
        phase === "wrong" && "bg-wrong-surface",
      )}
    >
      <div className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-6">
        {isFeedback && (
          <div
            className={cn(
              "mb-4 flex items-start gap-3",
              isCorrect ? "text-correct-foreground" : "text-wrong-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full",
                isCorrect ? "bg-correct text-white" : "bg-wrong text-white",
              )}
            >
              {isCorrect ? (
                <Check className="size-5" strokeWidth={3} />
              ) : (
                <X className="size-5" strokeWidth={3} />
              )}
            </span>
            <div>
              <p className="text-lg font-extrabold">
                {isCorrect ? "せいかい！" : "ざんねん…"}
              </p>
              <p className="mt-1 text-sm font-semibold leading-relaxed sm:text-base">
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
  total,
  hearts,
  onRestart,
}: {
  total: number;
  hearts: number;
  onRestart: () => void;
}) {
  return (
    <main className="quiz-play flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="flex size-24 items-center justify-center rounded-full border border-border bg-surface-elevated text-4xl">
        🎉
      </span>
      <div>
        <h1 className="text-3xl font-black tracking-tight">レッスン完了！</h1>
        <p className="mt-2 font-semibold text-muted-foreground">
          {total} 問中クリア · 残りライフ {hearts}
        </p>
      </div>
      <button
        type="button"
        onClick={onRestart}
        className="event-cta rounded-full px-10 py-4 text-lg font-semibold"
      >
        もう一度
      </button>
    </main>
  );
}
