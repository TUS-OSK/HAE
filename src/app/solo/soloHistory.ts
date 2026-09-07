import { COMMON_WORDS } from "@/lib/words";
import type { ScoreBreakdown } from "@/lib/scoring";

export type HistoryEntry = {
  id: string;
  timestamp: number;
  acronym: string;
  themeId: string;
  answer: string;
  score: ScoreBreakdown;
};

const STORAGE_KEY = "hae:solo:history:v1";
const MAX_ENTRIES = 300;

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function addHistoryEntry(
  entry: Omit<HistoryEntry, "id" | "timestamp">
): HistoryEntry[] {
  const history = loadHistory();
  const full: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  const updated = [full, ...history].slice(0, MAX_ENTRIES);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export type Stats = {
  gamesPlayed: number;
  avgTotal: number;
  bestTotal: number;
  avgByCategory: {
    grammar: number;
    themeMatch: number;
    difficulty: number;
    metafiction: number;
  };
  recentScores: number[]; // oldest -> newest, last 20 games
  vocab: { word: string; count: number; lastSeen: number }[];
};

export function computeStats(history: HistoryEntry[]): Stats {
  if (history.length === 0) {
    return {
      gamesPlayed: 0,
      avgTotal: 0,
      bestTotal: 0,
      avgByCategory: { grammar: 0, themeMatch: 0, difficulty: 0, metafiction: 0 },
      recentScores: [],
      vocab: [],
    };
  }

  const gamesPlayed = history.length;
  const sum = (f: (h: HistoryEntry) => number) =>
    history.reduce((acc, h) => acc + f(h), 0);

  const avgTotal = Math.round(sum((h) => h.score.total) / gamesPlayed);
  const bestTotal = Math.max(...history.map((h) => h.score.total));
  const avgByCategory = {
    grammar: Math.round(sum((h) => h.score.grammar) / gamesPlayed),
    themeMatch: Math.round(sum((h) => h.score.themeMatch) / gamesPlayed),
    difficulty: Math.round(sum((h) => h.score.difficulty) / gamesPlayed),
    metafiction: Math.round(sum((h) => h.score.metafiction) / gamesPlayed),
  };

  const recentScores = [...history]
    .reverse()
    .slice(-20)
    .map((h) => h.score.total);

  const vocabMap = new Map<string, { count: number; lastSeen: number }>();
  for (const h of history) {
    for (const raw of h.answer.split(/\s+/)) {
      const word = raw.toLowerCase().replace(/[^a-z']/g, "");
      if (word.length < 4 || COMMON_WORDS.has(word)) continue;
      const existing = vocabMap.get(word);
      if (existing) {
        existing.count += 1;
        existing.lastSeen = Math.max(existing.lastSeen, h.timestamp);
      } else {
        vocabMap.set(word, { count: 1, lastSeen: h.timestamp });
      }
    }
  }
  const vocab = [...vocabMap.entries()]
    .map(([word, v]) => ({ word, ...v }))
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .slice(0, 24);

  return { gamesPlayed, avgTotal, bestTotal, avgByCategory, recentScores, vocab };
}
