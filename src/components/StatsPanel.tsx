import type { Stats } from "@/app/solo/soloHistory";
import { Sparkline } from "./Sparkline";

const CATEGORY_LABELS: { key: keyof Stats["avgByCategory"]; label: string }[] = [
  { key: "grammar", label: "文法" },
  { key: "themeMatch", label: "テーマ" },
  { key: "difficulty", label: "難易度" },
  { key: "metafiction", label: "メタ" },
];

export function StatsPanel({ stats }: { stats: Stats }) {
  if (stats.gamesPlayed === 0) return null;

  return (
    <div className="card space-y-6 p-6">
      <h2 className="text-sm font-semibold tracking-wide text-zinc-400 uppercase">
        マイ統計
      </h2>

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="プレイ回数" value={stats.gamesPlayed} />
        <StatTile label="平均スコア" value={stats.avgTotal} suffix="/100" />
        <StatTile label="ベストスコア" value={stats.bestTotal} suffix="/100" accent />
      </div>

      <div>
        <p className="mb-2 text-xs text-zinc-500">直近{stats.recentScores.length}回の推移</p>
        <Sparkline values={stats.recentScores} />
      </div>

      <div>
        <p className="mb-2 text-xs text-zinc-500">項目別平均 (各25点満点)</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {CATEGORY_LABELS.map(({ key, label }) => (
            <div key={key}>
              <div className="mb-1 flex justify-between text-xs text-zinc-400">
                <span>{label}</span>
                <span className="font-mono">{stats.avgByCategory[key]}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400"
                  style={{ width: `${(stats.avgByCategory[key] / 25) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {stats.vocab.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-zinc-500">
            覚えた単語(直近使った、辞書によく出ない単語)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {stats.vocab.map((v) => (
              <span key={v.word} className="chip">
                {v.word}
                {v.count > 1 && <span className="ml-1 text-zinc-500">×{v.count}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: number;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
      <p className={`text-2xl font-bold ${accent ? "gradient-text" : "text-zinc-100"}`}>
        {value}
        {suffix && <span className="text-sm font-normal text-zinc-500">{suffix}</span>}
      </p>
      <p className="mt-1 text-[11px] text-zinc-500">{label}</p>
    </div>
  );
}
