export type Question = {
  prompt: string;
  code?: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
};

const htmlCssQuestions: Question[] = [
  {
    prompt: "Webページの見出しとして、いちばん大きい見出しに使うタグはどれ？",
    choices: ["<h1>", "<title>", "<header>", "<p>"],
    answerIndex: 0,
    explanation:
      "<h1> はページの主題となる見出しです。<title> はタブに出すタイトル、<p> は段落です。",
  },
  {
    prompt: "要素の背景色を変えるCSSプロパティはどれ？",
    choices: ["color", "background", "fill", "background-color"],
    answerIndex: 3,
    explanation:
      "背景色は background-color で指定します。color は文字色、background は色以外の指定もまとめて書けます。",
  },
  {
    prompt: "要素の内側の余白を指定するプロパティはどれ？",
    choices: ["margin", "padding", "gap", "border"],
    answerIndex: 1,
    explanation:
      "padding は要素の内側、margin は外側の余白です。gap は Flex / Grid の子要素同士の間隔です。",
  },
  {
    prompt: "クラス名を付けるときに使うHTML属性はどれ？",
    choices: ["id", "name", "class", "style"],
    answerIndex: 2,
    explanation:
      "見た目の指定を使い回すときは class を使います。id はページ内で一意な目印です。",
  },
  {
    prompt: "画像を表示するときに、読み上げや代替テキストとして必要な属性はどれ？",
    code: '<img src="photo.jpg" ???="集合写真">',
    choices: ["title", "alt", "name", "label"],
    answerIndex: 1,
    explanation:
      "alt は画像が表示できないときや、スクリーンリーダーで読み上げる説明文です。",
  },
];

const javascriptQuestions: Question[] = [
  {
    prompt: "この JavaScript の式は何を返しますか？",
    code: "typeof null",
    choices: ['"null"', '"object"', '"undefined"', "null"],
    answerIndex: 1,
    explanation:
      'JavaScript では typeof null は "object" を返します。これは言語仕様上の歴史的な癖です。',
  },
  {
    prompt: 'このコードの出力は？',
    code: 'console.log("5" + 3)',
    choices: ["8", '"53"', "NaN", "エラー"],
    answerIndex: 1,
    explanation:
      '+ 演算子は片方が文字列のとき文字列連結になり、"5" + 3 は "53" です。',
  },
  {
    prompt: "const で宣言した変数について正しいのは？",
    choices: [
      "再代入できるが再宣言はできない",
      "再代入も再宣言もできない",
      "ブロック外からも書き換えられる",
      "ホイスティングされない",
    ],
    answerIndex: 1,
    explanation:
      "const は再代入も再宣言もできません。同じスコープで let も再宣言できません。",
  },
  {
    prompt: "条件が正しいときだけ中の処理を実行するのはどれ？",
    code: "??? (score >= 80) {\n  console.log(\"合格\");\n}",
    choices: ["for", "if", "switch", "while"],
    answerIndex: 1,
    explanation:
      "if は条件が true のときだけブロックを実行します。for や while は繰り返しです。",
  },
  {
    prompt: "配列の末尾に値を追加するメソッドはどれ？",
    code: "const nums = [1, 2];\nnums.???(3);",
    choices: ["push", "pop", "shift", "map"],
    answerIndex: 0,
    explanation:
      "push は末尾に追加、pop は末尾を取り出し、shift は先頭を取り出します。",
  },
];

const gitQuestions: Question[] = [
  {
    prompt: "変更をコミットする前に、記録したいファイルを選ぶコマンドはどれ？",
    choices: ["git add", "git push", "git clone", "git status"],
    answerIndex: 0,
    explanation:
      "git add でステージングし、そのあと git commit で記録します。",
  },
  {
    prompt: "いまの変更状況を確認するコマンドはどれ？",
    choices: ["git log", "git status", "git pull", "git init"],
    answerIndex: 1,
    explanation:
      "git status は、変更されたファイルやステージ済みのファイルを表示します。",
  },
  {
    prompt: "リモートリポジトリにコミットを送るコマンドはどれ？",
    choices: ["git fetch", "git pull", "git push", "git merge"],
    answerIndex: 2,
    explanation:
      "git push でリモートへ送ります。git pull はリモートの変更を自分の環境に取り込みます。",
  },
  {
    prompt: "GitHub 上で自分の変更を本体に取り込んでもらうときに使うものはどれ？",
    choices: ["Issue", "Pull Request", "Actions", "Gist"],
    answerIndex: 1,
    explanation:
      "Pull Request（プルリクエスト）で変更内容をレビューしてもらい、ブランチをマージします。",
  },
  {
    prompt: "新しいリポジトリを自分のパソコンにコピーするコマンドはどれ？",
    choices: ["git init", "git clone", "git checkout", "git remote"],
    answerIndex: 1,
    explanation:
      "git clone はリモートのリポジトリを丸ごとコピーします。git init は空のリポジトリを新しく作ります。",
  },
];

const reactQuestions: Question[] = [
  {
    prompt: "Reactで画面の部品になる関数を何と呼びますか？",
    choices: ["コンポーネント", "サーバー", "データベース", "クッキー"],
    answerIndex: 0,
    explanation:
      "UIの部品をコンポーネントと呼びます。小さな部品を組み合わせて画面を作ります。",
  },
  {
    prompt: "状態を持つときに使うフックはどれ？",
    code: "const [count, setCount] = ???(0);",
    choices: ["useEffect", "useState", "useRef", "useMemo"],
    answerIndex: 1,
    explanation: "useState は値と、それを更新する関数をセットで返します。",
  },
  {
    prompt: "親から子へデータを渡すときに使うものはどれ？",
    choices: ["props", "cookie", "SQL", "DNS"],
    answerIndex: 0,
    explanation:
      "props は親コンポーネントから子へ渡すデータです。",
  },
];

const webQuestions: Question[] = [
  {
    prompt: "ブラウザに表示する文書の骨格を書く言語はどれ？",
    choices: ["HTML", "SQL", "JSON", "Python"],
    answerIndex: 0,
    explanation: "HTML はページの構造を表します。CSS が見た目、JavaScript が動きです。",
  },
  {
    prompt: "見た目（色や配置）を指定する言語はどれ？",
    choices: ["HTML", "CSS", "Git", "HTTP"],
    answerIndex: 1,
    explanation: "CSS は色・余白・レイアウトなど見た目を担当します。",
  },
  {
    prompt: "サイトの住所にあたるものはどれ？",
    choices: ["URL", "CPU", "RAM", "PDF"],
    answerIndex: 0,
    explanation: "URL はページの場所を示すアドレスです。",
  },
];

const flexQuestions: Question[] = [
  {
    prompt: "Flexboxで子要素を横並びにしやすくする display の値はどれ？",
    choices: ["block", "none", "flex", "hidden"],
    answerIndex: 2,
    explanation: "display: flex にすると子要素を並べやすくなります。",
  },
  {
    prompt: "主軸方向の中央揃えに使うプロパティはどれ？",
    choices: [
      "justify-content: center",
      "color: center",
      "font-size: center",
      "display: none",
    ],
    answerIndex: 0,
    explanation:
      "justify-content: center は主軸（通常は横）の中央揃えです。",
  },
  {
    prompt: "交差軸方向の中央揃えに使うプロパティはどれ？",
    choices: [
      "align-items: center",
      "text-decoration: center",
      "z-index: center",
      "opacity: center",
    ],
    answerIndex: 0,
    explanation: "align-items: center は交差軸（通常は縦）の中央揃えです。",
  },
];

const terminalQuestions: Question[] = [
  {
    prompt: "いまいるフォルダの中身を見るコマンドはどれ？",
    choices: ["ls", "cd", "git push", "npm"],
    answerIndex: 0,
    explanation: "ls は一覧表示、cd はフォルダ移動です。",
  },
  {
    prompt: "フォルダを移動するコマンドはどれ？",
    choices: ["ls", "cd", "rm", "cat"],
    answerIndex: 1,
    explanation: "cd は change directory の略で、作業フォルダを変えます。",
  },
  {
    prompt: "ひとつ上のフォルダへ戻る指定はどれ？",
    code: "cd ???",
    choices: ["..", "/", "home", "back"],
    answerIndex: 0,
    explanation: ".. は親フォルダを意味します。",
  },
];

const questionsByLesson: Record<string, Question[]> = {
  "html-css": htmlCssQuestions,
  "web-basics": webQuestions,
  css: htmlCssQuestions,
  flexbox: flexQuestions,
  javascript: javascriptQuestions,
  react: reactQuestions,
  git: gitQuestions,
  terminal: terminalQuestions,
};

export function getQuestionsForLesson(lessonId: string): Question[] {
  return questionsByLesson[lessonId] ?? javascriptQuestions;
}
