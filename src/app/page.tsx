import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <div className="w-full max-w-2xl">
        <p className="text-sm font-medium tracking-wide text-indigo-500 dark:text-indigo-400">
          HAE
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          How to Expand Acronym
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          ランダムな頭文字の並びを、意味のある英語フレーズに広げるワードゲーム。
          遊びながら英単語力を鍛えよう。
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/solo"
            className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-indigo-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h2 className="text-xl font-semibold">
              ソロプレイ{" "}
              <span aria-hidden className="inline-block transition group-hover:translate-x-1">
                →
              </span>
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              AIが4つの観点で採点: 文法・テーマ一致・単語難易度・メタフィクション性。
            </p>
          </Link>

          <Link
            href="/play"
            className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-amber-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h2 className="text-xl font-semibold">
              マルチプレイ(座布団){" "}
              <span aria-hidden className="inline-block transition group-hover:translate-x-1">
                →
              </span>
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              全員で同じ頭文字に挑戦し、お互いの回答に投票。座布団(得点)を一番集めた人が勝ち。
            </p>
          </Link>
        </div>

        <section className="mt-12 rounded-2xl bg-zinc-100 p-6 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">遊び方</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>ランダムな頭文字(例: &quot;CIA&quot;)が出題される。</li>
            <li>各文字から始まる単語をその順番どおりに並べ、意味のある英語フレーズを作る。</li>
            <li>
              ソロプレイはAIが採点、マルチプレイはプレイヤー同士の投票(座布団)でスコアが決まる。
            </li>
          </ol>
        </section>
      </div>
    </main>
  );
}
