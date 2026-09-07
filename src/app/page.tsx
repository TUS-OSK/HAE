import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-6 py-20 sm:py-28">
      <span className="chip">Word game / 英単語学習</span>

      <h1 className="mt-6 text-center text-5xl font-bold tracking-tight sm:text-6xl">
        <span className="gradient-text">HAE</span>
      </h1>
      <p className="mt-2 text-center text-lg font-medium text-zinc-400">
        How to Expand Acronym
      </p>
      <p className="mt-6 max-w-xl text-center text-base leading-relaxed text-zinc-400">
        ランダムな頭文字の並びを、意味のある英語フレーズに広げるワードゲーム。
        <br className="hidden sm:block" />
        遊びながら英単語力を鍛えよう。
      </p>

      <div className="mt-12 grid w-full gap-5 sm:grid-cols-2">
        <Link
          href="/solo"
          className="card group relative overflow-hidden p-7 text-left transition-transform hover:-translate-y-1"
        >
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-violet-500/20 blur-2xl transition-opacity group-hover:opacity-80" />
          <span className="chip border-violet-400/30 bg-violet-500/10 text-violet-300">
            Solo
          </span>
          <h2 className="mt-4 text-xl font-semibold text-zinc-50">
            ソロプレイ
            <span
              aria-hidden
              className="ml-2 inline-block text-violet-400 transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            AIが4つの観点で採点: 文法・テーマ一致・単語難易度・メタフィクション性。
          </p>
        </Link>

        <Link
          href="/play"
          className="card group relative overflow-hidden p-7 text-left transition-transform hover:-translate-y-1"
        >
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-amber-400/20 blur-2xl transition-opacity group-hover:opacity-80" />
          <span className="chip border-amber-400/30 bg-amber-400/10 text-amber-300">
            Multiplayer
          </span>
          <h2 className="mt-4 text-xl font-semibold text-zinc-50">
            マルチプレイ(座布団)
            <span
              aria-hidden
              className="ml-2 inline-block text-amber-400 transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            全員で同じ頭文字に挑戦し、お互いの回答に投票。座布団を一番集めた人が勝ち。
          </p>
        </Link>
      </div>

      <section className="card mt-8 w-full p-7">
        <h3 className="text-sm font-semibold tracking-wide text-zinc-300 uppercase">
          遊び方
        </h3>
        <ol className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-400">
          <li>
            <span className="mr-2 font-mono text-violet-400">1</span>
            ランダムな頭文字(例: <span className="font-mono text-zinc-200">CIA</span>)とテーマが出題される。
          </li>
          <li>
            <span className="mr-2 font-mono text-violet-400">2</span>
            各文字から始まる単語をその順番どおりに並べ、意味のある英語フレーズを作る
            (<span className="font-mono text-zinc-200">by / of / and</span> のような小文字の助詞は自由に挟んでOK)。
          </li>
          <li>
            <span className="mr-2 font-mono text-violet-400">3</span>
            ソロプレイはAIが採点、マルチプレイはプレイヤー同士の投票(座布団)でスコアが決まる。
          </li>
        </ol>
      </section>
    </main>
  );
}
