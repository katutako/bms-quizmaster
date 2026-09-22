# BMS QUIZ

知識と考察をバランスよく問う、BMS文化クイズの静的サイトです。

## 開発

```bash
npm install
npm run dev
```

## 確認・公開ビルド

```bash
npm test
npm run build
```

`dist/` はGitHub Pages、Cloudflare Pagesなどの静的ホスティングへそのまま配置できます。問題は `src/questions.ts` で管理し、追加時は4分類（知識/思考 × 選択/記述）の数を揃えてください。

## Cloudflare Pages への公開

1. このフォルダをGitHubリポジトリへpushします。
2. Cloudflare Pagesでそのリポジトリを選びます。
3. Build command に `npm run build`、Build output directory に `dist` を設定してデプロイします。

GitHub Pagesへ公開する場合は、リポジトリ名を含む公開パスに合わせて Vite の `base` 設定を追加してください。
