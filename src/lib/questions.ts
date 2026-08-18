export type Question = {
  prompt: string;
  code?: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
};

export const questions: Question[] = [
  {
    prompt: "この JavaScript の式は何を返しますか？",
    code: "typeof null",
    choices: ['"null"', '"object"', '"undefined"', "null"],
    answerIndex: 1,
    explanation:
      'JavaScript では typeof null は "object" を返します。これは言語仕様上の歴史的な癖です。',
  },
  {
    prompt: "配列 [1, 2, 3] に対する .map() の戻り値は？",
    code: "[1, 2, 3].map((n) => n * 2)",
    choices: ["[1, 2, 3]", "[2, 4, 6]", "6", "undefined"],
    answerIndex: 1,
    explanation:
      "map は各要素にコールバックを適用し、結果を含む新しい配列を返します。",
  },
  {
    prompt: "=== と == の違いとして正しいのはどれ？",
    choices: [
      "=== は型も含めて比較する",
      "== は常に false を返す",
      "=== は参照のみ比較する",
      "違いはない",
    ],
    answerIndex: 0,
    explanation:
      "厳密等価演算子 === は値と型の両方を比較します。== は型変換を行ってから比較します。",
  },
  {
    prompt: "このコードの出力は？",
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
    answerIndex: 0,
    explanation:
      "const は再代入を禁止しますが、同じスコープでの再宣言もできません（let と同様）。",
  },
];
