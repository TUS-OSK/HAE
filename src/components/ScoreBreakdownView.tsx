import type { ScoreBreakdown } from "@/lib/scoring";

const CATEGORIES: {
  key: keyof Pick<ScoreBreakdown, "grammar" | "themeMatch" | "difficulty" | "metafiction">;
  label: string;
}[] = [
  { key: "grammar", label: "文法 Grammar" },
  { key: "themeMatch", label: "テーマ一致 Theme" },
  { key: "difficulty", label: "単語難易度 Difficulty" },
  { key: "metafiction", label: "メタ度 Metafiction" },
];

export function ScoreBreakdownView({ score }: { score: ScoreBreakdown }) {
  return (
    <div className="w-full space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-zinc-400 uppercase">
          スコア
        </h3>
        <span className="gradient-text text-4xl font-bold">
          {score.total}
          <span className="text-base font-normal text-zinc-500"> / 100</span>
        </span>
      </div>

      <div className="space-y-3">
        {CATEGORIES.map(({ key, label }) => (
          <div key={key}>
            <div className="mb-1 flex justify-between text-xs text-zinc-400">
              <span>{label}</span>
              <span className="font-mono">{score[key]} / 25</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all duration-500"
                style={{ width: `${(score[key] / 25) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-zinc-300">
        {score.comment}
      </p>
      {score.engine === "heuristic" && (
        <p className="text-xs text-amber-400">
          ⚠ AI採点用のAPIキー未設定のため、簡易オフライン採点を表示しています。
        </p>
      )}
    </div>
  );
}
