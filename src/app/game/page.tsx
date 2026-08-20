import { Sparkles, Gamepad } from "lucide-react";

export default function GamePage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-40 pt-8">
      <header className="mb-6">
        <p className="section-en">Play</p>
        <h1 className="font-display mt-1 text-2xl font-medium tracking-tight">
          ゲームで遊ぼう
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          タイピングゲームやコード間違い探しを準備中
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="glass-card flex flex-col items-start gap-4 rounded-[1.4rem] p-6">
          <span className="rounded-full bg-accent-soft p-3 text-accent">
            <Gamepad className="size-6" />
          </span>
          <div>
            <h2 className="font-display text-lg font-medium">タイピングゲーム</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              指を鍛えて正確にタイピングしよう
            </p>
          </div>
          <div className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
            COMING SOON
          </div>
        </article>

        <article className="glass-card flex flex-col items-start gap-4 rounded-[1.4rem] p-6">
          <span className="rounded-full bg-accent-soft p-3 text-accent">
            <Sparkles className="size-6" />
          </span>
          <div>
            <h2 className="font-display text-lg font-medium">コード間違い探し</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              コードの違いを見つけてスコアを競おう
            </p>
          </div>
          <div className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
            COMING SOON
          </div>
        </article>
      </section>
    </div>
  );
}
