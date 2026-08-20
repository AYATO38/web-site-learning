# POSSE Learning

大学生向けのプログラミング学習アプリです。講義動画、確認クイズ、次サバDAYのチーム対抗クイズをひとつのサイトにまとめています。

公開URL: [https://learner-app-rho.vercel.app](https://learner-app-rho.vercel.app)

## できること

- **ホーム** — マスコットの着せ替え、次サバDAYへの導線、レッスン一覧
- **講義動画** — HTML / CSS、JavaScript、Git の入門動画。視聴完了するとクイズが開きます
- **確認クイズ** — レッスンごとに内容が違う5問。ライフ制です
- **次サバDAY** — 部屋を作って招待し、チームで連続正解を競います（HTML / CSS / JS 各3問）
- **アカウント** — 登録・ログイン・パスワード再設定
- **ゲーム** — 準備中です

## 開発

```bash
npm install
cp .env.example .env.local
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

`.env.local` には、メール送信用の Gmail、セッション用の `AUTH_SECRET`、公開URLの `APP_URL`、Neon の `DATABASE_URL` を入れます。JSON ファイルからデータベースへ移すときは `npm run db:migrate` です。

## 画面の場所

| 画面 | パス |
| --- | --- |
| ホーム | `/` |
| 講義動画 | `/video` |
| 確認クイズ | `/quiz` |
| 次サバDAY | `/next-server-day` |
| ゲーム | `/game` |
| アカウント | `/account` |
