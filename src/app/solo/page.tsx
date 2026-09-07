"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { THEMES } from "@/lib/acronym";
import type { ScoreBreakdown } from "@/lib/scoring";
import { startRound, submitSoloAnswer } from "./actions";
import { AcronymBadge } from "@/components/AcronymBadge";
import { ScoreBreakdownView } from "@/components/ScoreBreakdownView";
import { StatsPanel } from "@/components/StatsPanel";
import {
  addHistoryEntry,
  clearHistory,
  computeStats,
  loadHistory,
  type HistoryEntry,
} from "./soloHistory";

type Round = { acronym: string; themeId: string };

export default function SoloPage() {
  const [length, setLength] = useState(4);
  const [themeChoice, setThemeChoice] = useState("random");
  const [round, setRound] = useState<Round | null>(null);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [isPending, startTransition] = useTransition();

  const theme = round ? THEMES.find((t) => t.id === round.themeId) ?? THEMES[0] : null;
  const stats = computeStats(history);

  function newRound() {
    setError(null);
    setScore(null);
    setAnswer("");
    startTransition(async () => {
      const r = await startRound(length, themeChoice);
      setRound(r);
    });
  }

  function submit() {
    if (!round) return;
    setError(null);
    startTransition(async () => {
      const result = await submitSoloAnswer(round.acronym, round.themeId, answer);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setScore(result.score);
      setHistory(
        addHistoryEntry({
          acronym: round.acronym,
          themeId: round.themeId,
          answer,
          score: result.score,
        })
      );
    });
  }

  function resetStats() {
    clearHistory();
    setHistory([]);
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-zinc-500 transition hover:text-zinc-300">
          ← トップへ
        </Link>
        <h1 className="text-xl font-bold">
          <span className="gradient-text">ソロプレイ</span>
        </h1>
        <span className="w-16" />
      </div>

      {!round && (
        <div className="card space-y-5 p-7">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">頭文字の数</label>
            <div className="flex gap-2">
              {[3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => setLength(n)}
                  className={`h-10 w-10 rounded-xl border font-semibold transition ${
                    length === n
                      ? "border-violet-400 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
                      : "border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.06]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">テーマ</label>
            <select
              value={themeChoice}
              onChange={(e) => setThemeChoice(e.target.value)}
              className="input-field"
            >
              <option value="random">ランダム(テーマあり)</option>
              {THEMES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <button onClick={newRound} disabled={isPending} className="btn-violet w-full">
            {isPending ? "生成中..." : "スタート"}
          </button>
        </div>
      )}

      {round && (
        <div className="card space-y-5 p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <AcronymBadge acronym={round.acronym} />
            {theme && theme.id !== "none" && (
              <span className="chip border-violet-400/30 bg-violet-500/10 text-violet-300">
                {theme.label}
              </span>
            )}
          </div>
          {theme && theme.id !== "none" && (
            <p className="text-sm text-zinc-400">{theme.hint}</p>
          )}

          {!score && (
            <>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={`例: ${round.acronym
                  .split("")
                  .map((l) => l + "...")
                  .join(" ")}`}
                rows={2}
                className="input-field resize-none text-lg"
              />
              <p className="text-xs text-zinc-500">
                <span className="font-mono text-zinc-400">by / of / and</span>{" "}
                のような小文字の助詞は自由に挟んでOK(頭文字にはカウントされません)。
              </p>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={submit}
                  disabled={isPending || !answer.trim()}
                  className="btn-violet flex-1"
                >
                  {isPending ? "採点中..." : "採点する"}
                </button>
                <button onClick={() => setRound(null)} className="btn-ghost">
                  やめる
                </button>
              </div>
            </>
          )}

          {score && (
            <>
              <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-lg">
                {answer}
              </p>
              <ScoreBreakdownView score={score} />
              <button onClick={newRound} disabled={isPending} className="btn-violet w-full">
                次のラウンド
              </button>
            </>
          )}
        </div>
      )}

      <StatsPanel stats={stats} />

      {history.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-zinc-400 uppercase">
              履歴
            </h2>
            <button
              onClick={resetStats}
              className="text-xs text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
            >
              履歴をリセット
            </button>
          </div>
          <ul className="space-y-2">
            {history.slice(0, 10).map((h) => (
              <li
                key={h.id}
                className="card flex items-center justify-between px-4 py-3 text-sm"
              >
                <span>
                  <span className="font-mono font-bold text-violet-300">{h.acronym}</span>{" "}
                  — {h.answer}
                </span>
                <span className="font-semibold text-zinc-200">{h.score.total}/100</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
