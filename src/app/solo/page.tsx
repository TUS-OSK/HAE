"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { THEMES } from "@/lib/acronym";
import type { ScoreBreakdown } from "@/lib/scoring";
import { startRound, submitSoloAnswer } from "./actions";
import { AcronymBadge } from "@/components/AcronymBadge";
import { ScoreBreakdownView } from "@/components/ScoreBreakdownView";

type Round = { acronym: string; themeId: string };
type HistoryEntry = { round: Round; answer: string; score: ScoreBreakdown };

export default function SoloPage() {
  const [length, setLength] = useState(4);
  const [themeChoice, setThemeChoice] = useState("random");
  const [round, setRound] = useState<Round | null>(null);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isPending, startTransition] = useTransition();

  const theme = round ? THEMES.find((t) => t.id === round.themeId) ?? THEMES[0] : null;

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
      setHistory((h) => [{ round, answer, score: result.score }, ...h].slice(0, 10));
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← トップへ
        </Link>
        <h1 className="text-xl font-bold">ソロプレイ</h1>
        <span />
      </div>

      {!round && (
        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <label className="mb-1 block text-sm font-medium">頭文字の数</label>
            <div className="flex gap-2">
              {[3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => setLength(n)}
                  className={`h-10 w-10 rounded-lg border font-semibold ${
                    length === n
                      ? "border-indigo-500 bg-indigo-500 text-white"
                      : "border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">テーマ</label>
            <select
              value={themeChoice}
              onChange={(e) => setThemeChoice(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="random">ランダム</option>
              {THEMES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={newRound}
            disabled={isPending}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {isPending ? "生成中..." : "スタート"}
          </button>
        </div>
      )}

      {round && (
        <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <AcronymBadge acronym={round.acronym} />
            {theme && theme.id !== "none" && (
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {theme.label}
              </span>
            )}
          </div>
          {theme && theme.id !== "none" && (
            <p className="text-sm text-zinc-500">{theme.hint}</p>
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
                className="w-full resize-none rounded-lg border border-zinc-300 bg-white p-3 text-lg dark:border-zinc-700 dark:bg-zinc-800"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={submit}
                  disabled={isPending || !answer.trim()}
                  className="flex-1 rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isPending ? "採点中..." : "採点する"}
                </button>
                <button
                  onClick={() => setRound(null)}
                  className="rounded-xl border border-zinc-300 px-4 py-3 text-sm dark:border-zinc-700"
                >
                  やめる
                </button>
              </div>
            </>
          )}

          {score && (
            <>
              <p className="rounded-lg bg-zinc-50 p-3 text-lg dark:bg-zinc-800">{answer}</p>
              <ScoreBreakdownView score={score} />
              <button
                onClick={newRound}
                disabled={isPending}
                className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                次のラウンド
              </button>
            </>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-500">履歴</h2>
          <ul className="space-y-2">
            {history.map((h, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg bg-white p-3 text-sm dark:bg-zinc-900"
              >
                <span>
                  <span className="font-mono font-bold">{h.round.acronym}</span> — {h.answer}
                </span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {h.score.total}/100
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
