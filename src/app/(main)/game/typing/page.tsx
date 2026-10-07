import Link from "next/link";
import { ArrowLeft, ExternalLink, Keyboard } from "lucide-react";

const typingSites: { name: string; description: string; url: string }[] = [
  {
    name: "寿司打",
    description: "流れてくるお寿司が消える前に打ち切ろう。定番のタイピングゲーム",
    url: "https://sushida.net/",
  },
  {
    name: "e-typing",
    description: "腕試しでタイピングスキルを測定。レベル判定つき",
    url: "https://www.e-typing.ne.jp/",
  },
  {
    name: "マイタイピング",
    description: "たくさんのお題から好きなものを選んで練習できる",
    url: "https://typing.twi1.me/",
  },
  {
    name: "Monkeytype",
    description: "英語のタイピング練習。記号や数字を含むモードもあり",
    url: "https://monkeytype.com/",
  },
];

export default function TypingPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-40 pt-6">
      <Link
        href="/game"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        ゲームに戻る
      </Link>

      <header className="mb-6">
        <p className="section-en">Typing</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight">タイピング練習</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          遊びたいゲームを選んでください。別のタブで開きます。
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {typingSites.map((site) => (
          <a
            key={site.url}
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card flex flex-col items-start gap-4 rounded-[1.4rem] p-6 transition-transform hover:-translate-y-0.5"
          >
            <span className="rounded-full bg-accent-soft p-3 text-accent">
              <Keyboard className="size-6" />
            </span>
            <div>
              <h2 className="text-lg font-black tracking-tight">{site.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{site.description}</p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">
              遊ぶ
              <ExternalLink className="size-3" />
            </div>
          </a>
        ))}
      </section>
    </div>
  );
}
