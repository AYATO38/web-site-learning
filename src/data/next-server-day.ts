import type { NextServerDayQuestion } from "@/lib/next-server-day";

const jsMemberPartA = `【A】
card.innerHTML = \`<h3>member.name</h3><p>{member.role}</p>\`;`;
const jsMemberPartB = `【B】
const list = document.getElementById("memberList");`;
const jsMemberPartC = `【C】
const members = [
  { name: "田中", role: "デザイナー" },
  { name: "鈴木", role: "エンジニア" }
];`;
const jsMemberPartD = `【D】
members.forEach((member) => {
  const card = document.createElement("div");`;
const jsMemberPartE = `【E】
  member.appendChild(card);
});`;

export const nsdQuestions: NextServerDayQuestion[] = [
  {
    id: "html-bugfix",
    difficulty: "beginner",
    category: "HTML",
    kind: "bugfix",
    prompt: "リンクが開きません。バグを直してください。",
    starter: `<a src="https://posse.jp">POSSE</a>`,
    solution: `<a href="https://posse.jp">POSSE</a>`,
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
    accepted: [["src"]],
    explanation:
      "画像の場所は src 属性で指定します。alt は画像が表示できないときの代替テキストです。",
    xp: 50,
  },
  {
    id: "html-order",
    difficulty: "beginner",
    category: "HTML",
    kind: "order",
    prompt: "HTMLファイルの <head> 内の基本的な記述順序を正しく並び替えてください。",
    items: [
      "<head>",
      '<meta charset="UTF-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      "<title>ページタイトル</title>",
      "</head>",
    ],
    explanation:
      "<head> の中は、文字コード（charset）→ viewport → <title> の順が基本です。charset を先に書くと、そのあとの文字化けを防げます。<title> がタブに出るページタイトルです。",
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
    example: "<h1>POSSE</h1>\n<p>学習コミュニティ</p>",
    explanation:
      "<h1> が見出し、<p> が段落です。2つを続けて書けばお題どおりになります。",
    xp: 60,
  },
  {
    id: "html-choice-form-submit",
    difficulty: "beginner",
    category: "HTML",
    kind: "choice",
    prompt:
      "このフォームで、クリックしたときに送信される可能性があるボタンはいくつ？",
    code: `<form action="/quiz" method="post">
  <input type="text" name="answer">
  <button>回答する</button>
  <button type="button">ヒントを見る</button>
  <button type="submit">次の問題へ</button>
</form>`,
    choices: ["1つ", "2つ", "3つ", "0個"],
    answerIndex: 1,
    explanation:
      "form の中の <button> は type を省略すると submit になります。type=\"submit\" も送信します。type=\"button\" は送信しません。",
    xp: 50,
  },
  {
    id: "html-choice-form-name",
    difficulty: "beginner",
    category: "HTML",
    kind: "choice",
    prompt: "このフォームを送信したとき、サーバーに送られる値として正しいのはどれ？",
    code: `<form>
  <input type="text" value="Niko">
  <input type="text" name="username" value="Taro">
  <button type="submit">送信</button>
</form>`,
    choices: ["Nikoだけ", "Taroだけ", "NikoとTaro", "何も送信されない"],
    answerIndex: 1,
    explanation:
      "送信されるのは name がある入力だけです。Niko の欄には name がないので送られず、name=\"username\" の Taro だけが送られます。",
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
    solution: `<h1 class="text-center font-bold text-blue-500">POSSE</h1>`,
    language: "html",
    mustInclude: ["text-center", "font-bold", "text-blue-500"],
    mustNotInclude: ["text-centre", "font-blod", "text-bleu"],
    explanation:
      "中央は text-center、太字は font-bold、青い文字は text-blue-500 です。centre / blod / bleu は Tailwind にありません。",
    xp: 50,
  },
  {
    id: "css-bugfix-responsive",
    difficulty: "intermediate",
    category: "CSS",
    kind: "bugfix",
    prompt:
      "スマホでは縦並び・1列、PC（md以上）では横並び・3列にしたい告知ページです。誤りを3箇所直してください。",
    starter: `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>イベント告知</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 p-6">

  <nav class="flex">
    <a href="#" class="flex-col md:flex-row p-2">ホーム</a>
    <a href="#" class="flex-col md:flex-row p-2">詳細</a>
  </nav>

  <div class="grid md: grid-cols-3 gap-4 mt-6">
    <div class="bg-white p-4 rounded shadow">カード1</div>
    <div class="bg-white p-4 rounded shadow">カード2</div>
    <div class="bg-white p-4 rounded shadow">カード3</div>
  </div>

</body>
</html>`,
    solution: `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>イベント告知</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 p-6">

  <nav class="flex flex-col md:flex-row">
    <a href="#" class="p-2">ホーム</a>
    <a href="#" class="p-2">詳細</a>
  </nav>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
    <div class="bg-white p-4 rounded shadow">カード1</div>
    <div class="bg-white p-4 rounded shadow">カード2</div>
    <div class="bg-white p-4 rounded shadow">カード3</div>
  </div>

</body>
</html>`,
    language: "html",
    mustInclude: [
      'name="viewport"',
      "width=device-width",
      '<nav class="flex flex-col md:flex-row">',
      "grid-cols-1 md:grid-cols-3",
    ],
    mustNotInclude: [
      "md: grid-cols",
      'class="flex-col md:flex-row p-2"',
    ],
    explanation:
      "① <head> に viewport がないとスマホ幅で計算されません。② flex-col / md:flex-row は並びを変えたい親の <nav> に付けます。③ md: のあとにスペースがあるとクラスが無効なので md:grid-cols-3 と書き、スマホは grid-cols-1 です。",
    xp: 70,
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
    example: '<button class="rounded-lg bg-blue-500 px-4 py-2 text-white">参加する</button>',
    explanation:
      '例: <button class="rounded-lg bg-blue-500 px-4 py-2 text-white">参加する</button>',
    xp: 60,
  },
  {
    id: "css-code-grid",
    difficulty: "intermediate",
    category: "CSS",
    kind: "code",
    prompt:
      "div の class に Tailwind を書いてください。Gridはスマホ1列・PC（lg以上）は4列、カード間は16px。ホバーで影を大きくし、変化はなめらかに。",
    starter: `<div class="">
  <div>Card</div>
</div>`,
    language: "html",
    mustIncludeClasses: [
      "grid",
      "grid-cols-1",
      "lg:grid-cols-4",
      "gap-4",
      "hover:shadow-lg",
    ],
    mustInclude: ["transition"],
    example: `<div class="grid grid-cols-1 lg:grid-cols-4 gap-4 hover:shadow-lg transition">
  <div>Card</div>
</div>`,
    explanation:
      "grid がないと grid-cols-1 や gap-4 は効きません。スマホ基準の grid-cols-1 から書き、PCは lg:grid-cols-4。余白16pxは gap-4。ホバーは hover:shadow-lg、なめらかさは transition です。",
    xp: 60,
  },
  {
    id: "css-blank-responsive",
    difficulty: "intermediate",
    category: "CSS",
    kind: "blank",
    prompt:
      "PCとスマホで表示を切り替えろ。スマホでは「スマホ版」だけ、PCでは「PC版」だけ出るように、空欄の class を入れてください。",
    code: `<p class="________">スマホ版メッセージ</p>

<p class="________">PC版メッセージ</p>`,
    template: `<p class="___">スマホ版メッセージ</p>

<p class="___">PC版メッセージ</p>`,
    accepted: [
      ["block md:hidden", "md:hidden"],
      ["hidden md:block"],
    ],
    explanation:
      "正解は <p class=\"block md:hidden\">スマホ版メッセージ</p> と <p class=\"hidden md:block\">PC版メッセージ</p> です。md: は 768px 以上（PC）です。<p> はもともと block なので、1つ目は md:hidden だけでも大丈夫です。",
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
    solution: `const [count, setCount] = useState(0);`,
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
    example: `function double(n) {
  return n * 2;
}`,
    explanation:
      "return n * 2; と書けば、渡した数を 2 倍して返せます。自動採点でいくつか試しています。",
    xp: 70,
  },
  {
    id: "js-order-members",
    difficulty: "advanced",
    category: "JS",
    kind: "order",
    prompt:
      "配列からメンバーカードを作って画面に足す JS です。パーツを正しい処理順に並べてください。",
    items: [
      jsMemberPartA,
      jsMemberPartB,
      jsMemberPartC,
      jsMemberPartD,
      jsMemberPartE,
    ],
    acceptedOrders: [
      [
        jsMemberPartC,
        jsMemberPartB,
        jsMemberPartD,
        jsMemberPartA,
        jsMemberPartE,
      ],
      [
        jsMemberPartB,
        jsMemberPartC,
        jsMemberPartD,
        jsMemberPartA,
        jsMemberPartE,
      ],
    ],
    explanation:
      "データ members（C）と親要素 list（B）を先に用意し、forEach（D）でカードを作り、innerHTML（A）を入れて、最後に画面へ追加（E）します。B と C はどちらが先でも大丈夫です。",
    xp: 50,
  },
  {
    id: "js-bugfix-members",
    difficulty: "advanced",
    category: "JS",
    kind: "bugfix",
    prompt:
      "正しい順でも TypeError が出ます。バグを直して、動く JavaScript を全部書いてください。",
    starter: `const members = [
  { name: "田中", role: "デザイナー" },
  { name: "鈴木", role: "エンジニア" }
];

const list = document.getElementById("memberList");

members.forEach((member) => {
  const card = document.createElement("div");
  card.innerHTML = \`<h3>member.name</h3><p>{member.role}</p>\`;
  member.appendChild(card);
});`,
    solution: `const members = [
  { name: "田中", role: "デザイナー" },
  { name: "鈴木", role: "エンジニア" }
];

const list = document.getElementById("memberList");

members.forEach((member) => {
  const card = document.createElement("div");
  card.innerHTML = \`<h3>member.name</h3><p>{member.role}</p>\`;
  list.appendChild(card);
});`,
    language: "js",
    mustInclude: [
      "田中",
      "鈴木",
      'getElementById("memberList")',
      "forEach",
      'createElement("div")',
      "innerHTML",
      "list.appendChild(card)",
    ],
    mustNotInclude: ["member.appendChild"],
    explanation:
      "TypeError の原因は member.appendChild です。member はデータなので appendChild できません。親の list に list.appendChild(card) とします。",
    xp: 70,
  },
];
