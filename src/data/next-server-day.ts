import type { NextServerDayQuestion } from "@/lib/next-server-day";

export const nsdQuestions: NextServerDayQuestion[] = [
  {
    id: "html-bugfix",
    difficulty: "beginner",
    category: "HTML",
    kind: "bugfix",
    prompt: "リンクが開きません。バグを直してください。",
    starter: `<a src="https://posse.jp">POSSE</a>`,
    language: "html",
    accepted: [`<a href="https://posse.jp">POSSE</a>`],
    mustInclude: ["<a", "href=", "posse.jp", "</a>"],
    mustNotInclude: ["src="],
    explanation:
      "リンク先は href で指定します。src は画像やスクリプトの読み込み用です。",
    xp: 50,
  },
  {
    id: "html-blank",
    difficulty: "beginner",
    category: "HTML",
    kind: "blank",
    prompt: "画像のパスを指定する属性名を入れてください。",
    template: `<img ___="logo.png" alt="POSSE">`,
    accepted: ["src"],
    explanation:
      "画像の場所は src 属性で指定します。alt は画像が表示できないときの代替テキストです。",
    xp: 50,
  },
  {
    id: "html-order",
    difficulty: "beginner",
    category: "HTML",
    kind: "order",
    prompt: "上から表示したい順に並べてください。",
    items: [
      "<h1>POSSEへようこそ</h1>",
      "<p>プログラミングを学ぼう</p>",
      '<a href="/join">参加する</a>',
      "<footer>© POSSE</footer>",
    ],
    explanation:
      "見出し → 本文 → リンク → フッターの順が、上から読む流れとして自然です。",
    xp: 50,
  },
  {
    id: "html-code",
    difficulty: "beginner",
    category: "HTML",
    kind: "code",
    prompt:
      "いちばん大きい見出しで「POSSE」、その下の段落で「学習コミュニティ」と書いてください。",
    starter: "",
    language: "html",
    mustIncludeOrdered: ["<h1>", "POSSE", "</h1>", "<p>", "学習コミュニティ", "</p>"],
    explanation:
      "<h1> が見出し、<p> が段落です。2つを続けて書けばお題どおりになります。",
    xp: 60,
  },
  {
    id: "html-choice",
    difficulty: "beginner",
    category: "HTML",
    kind: "choice",
    prompt: "ブラウザのタブにページタイトルを出すタグはどれ？",
    choices: ["<header>", "<title>", "<h1>", "<tab>"],
    answerIndex: 1,
    explanation:
      "<title> はタブや検索結果に出るタイトルです。<h1> はページ内の見出しです。",
    xp: 50,
  },
  {
    id: "css-choice",
    difficulty: "intermediate",
    category: "CSS",
    kind: "choice",
    prompt: "flex のとき、子要素を横方向の中央に揃える Tailwind クラスはどれ？",
    choices: [
      "items-center",
      "justify-center",
      "text-center",
      "content-center",
    ],
    answerIndex: 1,
    explanation:
      "主軸（横並び）の中央は justify-center です。items-center は交差軸、text-center は文字揃えです。",
    xp: 50,
  },
  {
    id: "css-order",
    difficulty: "intermediate",
    category: "CSS",
    kind: "order",
    prompt:
      "レイアウト → 横中央 → 隙間 → 背景の順に、Tailwind クラスを並べてください。",
    items: ["flex", "justify-center", "gap-4", "bg-white"],
    explanation:
      "並び方（flex）を先に決め、justify-center で揃え、gap-4 で間隔、最後に bg-white で背景を付けます。",
    xp: 50,
  },
  {
    id: "css-bugfix",
    difficulty: "intermediate",
    category: "CSS",
    kind: "bugfix",
    prompt: "文字が青く太くならず、中央にもなりません。class を直してください。",
    starter: `<h1 class="text-centre font-blod text-bleu-500">POSSE</h1>`,
    language: "html",
    mustInclude: ["text-center", "font-bold", "text-blue-500"],
    mustNotInclude: ["text-centre", "font-blod", "text-bleu"],
    explanation:
      "中央は text-center、太字は font-bold、青い文字は text-blue-500 です。centre / blod / bleu は Tailwind にありません。",
    xp: 50,
  },
  {
    id: "css-code",
    difficulty: "intermediate",
    category: "CSS",
    kind: "code",
    prompt:
      "白い文字・青背景（bg-blue-500）・角丸のボタンを、Tailwind の class で書いてください。",
    starter: `<button class="">
  参加する
</button>`,
    language: "html",
    mustInclude: ["bg-blue-500", "text-white", "rounded"],
    explanation:
      '例: <button class="rounded-lg bg-blue-500 px-4 py-2 text-white">参加する</button>',
    xp: 60,
  },
  {
    id: "css-blank",
    difficulty: "intermediate",
    category: "CSS",
    kind: "blank",
    prompt: "横方向の中央揃えにする Tailwind クラスを入れてください。",
    template: `<div class="flex ___">`,
    accepted: ["justify-center"],
    explanation:
      "flex の主軸（横）で中央に揃えるクラスは justify-center です。",
    xp: 50,
  },
  {
    id: "js-choice",
    difficulty: "advanced",
    category: "JS",
    kind: "choice",
    prompt: "=== と == の違いとして正しいのはどれ？",
    choices: [
      "=== は型も含めて比較する",
      "== は常に false を返す",
      "=== は参照のみ比較する",
      "違いはない",
    ],
    answerIndex: 0,
    explanation:
      "=== は値と型の両方を比較します。== は型変換してから比べます。",
    xp: 50,
  },
  {
    id: "react-bugfix",
    difficulty: "advanced",
    category: "React",
    kind: "bugfix",
    prompt: "カウントの状態が動きません。バグを直してください。",
    starter: `const [count, setCount] = useState;`,
    language: "js",
    accepted: [
      "const [count, setCount] = useState(0);",
      "const [count, setCount] = useState(0)",
    ],
    mustInclude: ["useState(0)", "count", "setCount"],
    explanation:
      "useState は関数なので、初期値を渡して呼び出します。例: useState(0)。",
    xp: 60,
  },
  {
    id: "js-code",
    difficulty: "advanced",
    category: "JS",
    kind: "code",
    prompt:
      "数値 n を受け取って 2 倍した値を返す関数 double を書いてください。",
    starter: `function double(n) {
  
}`,
    language: "js",
    tests: [
      { call: "double(2)", expected: 4 },
      { call: "double(0)", expected: 0 },
      { call: "double(-3)", expected: -6 },
    ],
    explanation:
      "return n * 2; と書けば、渡した数を 2 倍して返せます。自動採点でいくつか試しています。",
    xp: 70,
  },
];
