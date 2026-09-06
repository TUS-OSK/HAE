import type { ScoreBreakdown } from "@/lib/scoring";

const CATEGORIES: { key: keyof Pick<ScoreBreakdown, "grammar" | "themeMatch" | "difficulty" | "metafiction">; label: string }[] = [
  { key: "grammar", label: "文法 Grammar" },
  { key: "themeMatch", label: "テーマ一致 Theme" },
  { key: "difficulty", label: "単語難易度 Difficulty" },
  { key: "metafiction", label: "メタ度 Metafiction" },
];

export function ScoreBreakdownView({ score }: { score: ScoreBreakdown }) {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold">スコア</h3>
        <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
          {score.total}
          <span className="text-base font-normal text-zinc-400"> / 100</span>
        </span>
      </div>

      <div className="space-y-2">
        {CATEGORIES.map(({ key, label }) => (
          <div key={key}>
            <div className="mb-1 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>{label}</span>
              <span>{score[key]} / 25</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${(score[key] / 25) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="rounded-lg bg-zinc-100 p-3 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
        {score.comment}
      </p>
      {score.engine === "heuristic" && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          ⚠ AI採点用のAPIキー未設定のため、簡易オフライン採点を表示しています。
        </p>
      )}
    </div>
  );
}
