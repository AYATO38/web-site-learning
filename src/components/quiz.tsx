"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { questions } from "@/lib/questions";
import { ChoiceButton } from "@/components/choice-button";
import { Check, Heart, X, PartyPopper } from "lucide-react";

type Phase = "answering" | "correct" | "wrong";

export function Quiz({ lessonTitle }: { lessonTitle?: string }) {
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
    <main className="flex min-h-dvh flex-col bg-background">
      <header className="mx-auto flex w-full max-w-2xl items-center gap-4 px-4 py-5 sm:px-6">
        <Link
          href="/"
          aria-label="ホームに戻る"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-7" strokeWidth={3} />
        </Link>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-track">
          <div
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="学習の進捗"
            className="relative h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(progress, 6)}%` }}
          >
            <span className="absolute inset-x-1 top-1 h-1 rounded-full bg-white/40" />
          </div>
        </div>
        <div className="flex items-center gap-1 font-extrabold text-wrong">
          <Heart className="size-6 fill-wrong text-wrong" />
          <span className="text-lg tabular-nums">{hearts}</span>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-40 pt-2 sm:px-6">
        <p className="text-sm font-bold text-accent">
          {lessonTitle ? `${lessonTitle} · ` : ""}問題 {current + 1} / {total}
        </p>
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
                <span className="font-extrabold">Explanation: </span>
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
              "w-full rounded-lg py-4 text-lg font-bold",
              canCheck
                ? "bg-accent text-white hover:bg-accent-dark"
                : "cursor-not-allowed bg-muted text-muted-foreground",
            )}
          >
            チェック
          </button>
        ) : (
          <button
            type="button"
            onClick={onContinue}
            className={cn(
              "w-full rounded-lg py-4 text-lg font-bold text-white",
              isCorrect ? "bg-accent" : "bg-wrong",
            )}
          >
            {isLast ? "結果を見る" : "つづける"}
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
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-brand-soft text-brand">
        <PartyPopper className="size-10" />
      </span>
      <div>
        <h1 className="text-3xl font-extrabold">レッスン完了！</h1>
        <p className="mt-2 font-semibold text-muted-foreground">
          {total} 問中クリア · 残りライフ {hearts}
        </p>
      </div>
      <button
        type="button"
        onClick={onRestart}
        className="rounded-lg bg-accent px-10 py-4 text-lg font-bold text-white hover:bg-accent-dark"
      >
        もう一度
      </button>
    </main>
  );
}
