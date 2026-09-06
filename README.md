# HAE — How to Expand Acronym

ランダムな頭文字の並び(例: `CIA`)を、意味のある英語フレーズに広げるワードゲーム。
遊びながら英単語力・英作文力を鍛えることを狙ったプロジェクトです。

- **ソロプレイ**: AIが4つの観点で採点する。
  - 文法 (Grammar) / テーマ一致 (Theme match) / 単語難易度 (Difficulty) / メタフィクション性 (Metafiction — 自己言及・ゲームやAI自体をネタにした発想へのボーナス)
- **マルチプレイ「座布団」モード**: 全員が同じ頭文字に挑戦し、回答を伏せて公開 → お互いに投票 → 得票数だけ座布団(得点)獲得。ラウンドを重ねて総合順位を競う。AI採点は使わず、完全にプレイヤー同士の投票で決まる。

## スタック

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19, TypeScript)
- [Tailwind CSS 4](https://tailwindcss.com/)
- AI採点: [Anthropic API](https://docs.anthropic.com/) または [OpenCode Go](https://opencode.ai/docs/ja/go)(OpenAI互換ゲートウェイ)のどちらか。両方未設定の場合は、キーワード/単語長ベースの簡易オフライン採点にフォールバックする。
- マルチプレイの部屋状態: [Upstash Redis](https://upstash.com/)(無料枠あり)。未設定時はメモリ上のMapにフォールバック(`next dev` や単一インスタンスの検証用。本番のサーバーレス複数インスタンスでは正しく共有されないので、実運用では必ずUpstashを設定すること)。

## セットアップ

```bash
npm install
cp .env.example .env.local   # 中身を編集
npm run dev
```

`.env.local` に設定できる値は `.env.example` を参照。最低限、以下のどちらかを設定するとソロプレイがAI採点になる:

```
ANTHROPIC_API_KEY=sk-ant-...
# または
OPENCODE_API_KEY=sk-...
OPENCODE_MODEL=kimi-k2.6   # 好みのモデルに変更可
```

マルチプレイを複数人・複数デバイスで安定して使うには Upstash Redis の `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` を設定する(無料枠で十分)。

## デプロイ (Vercel 無料枠)

1. このリポジトリを Vercel にインポート。
2. 上記の環境変数を Vercel の Project Settings → Environment Variables に設定。
3. デプロイ。追加設定は不要(Next.jsのゼロコンフィグ)。

Upstash を使わない場合、マルチプレイの部屋状態はサーバーレス関数インスタンス間で共有されないため、本番では正しく動かないことがある。ソロプレイのみで良ければ Upstash 設定は不要。

## 遊び方

1. ランダムな頭文字が出題される(3〜6文字、テーマ付きのこともある)。
2. 各文字から始まる単語を、その順番どおりに並べて意味のある英語フレーズを作る。
3. ソロプレイはAIが4項目・各25点、計100点満点で採点しフィードバックをくれる。
4. マルチプレイは全員の回答が出揃うと投票フェーズになり、自分以外の回答に座布団(1票)を贈れる。得票数が多いほど座布団を多く獲得。指定ラウンド数(3/5/7)を終えると総合順位が確定する。

## ディレクトリ構成のポイント

- `src/lib/acronym.ts` — 頭文字生成・テーマ一覧・初期文字検証
- `src/lib/scoring.ts` — AI採点(Anthropic → OpenCode Go → オフライン簡易採点、の優先順でフォールバック)
- `src/lib/room.ts` — マルチプレイの部屋状態・フェーズ進行ロジック(lobby → writing → voting → results → ended)
- `src/lib/kv.ts` — Upstash Redis / インメモリのKV抽象化
- `src/app/solo/` — ソロプレイ画面 + Server Actions
- `src/app/play/` — マルチプレイのロビー・部屋画面(REST APIをポーリング)
- `src/app/api/room/` — マルチプレイ用のRoute Handlers
