// Letter pool weighted toward common English word-initial letters so rounds
// stay solvable (raw 26-letter uniform picks land on Q/X/Z far too often).
const LETTER_WEIGHTS: Record<string, number> = {
  A: 8, B: 5, C: 7, D: 5, E: 4, F: 5, G: 4, H: 5, I: 5, J: 2,
  K: 2, L: 5, M: 6, N: 4, O: 4, P: 6, R: 5, S: 8, T: 6, U: 2,
  V: 2, W: 4, Y: 2, Z: 1,
};

const WEIGHTED_LETTERS: string[] = Object.entries(LETTER_WEIGHTS).flatMap(
  ([letter, weight]) => Array(weight).fill(letter)
);

export type Theme = {
  id: string;
  label: string;
  hint: string;
  keywords: string[];
};

export const THEMES: Theme[] = [
  {
    id: "none",
    label: "テーマなし (Free)",
    hint: "Anything goes.",
    keywords: [],
  },
  {
    id: "space",
    label: "宇宙 (Space)",
    hint: "Rockets, planets, astronauts...",
    keywords: [
      "space", "star", "planet", "rocket", "orbit", "galaxy", "moon",
      "astronaut", "alien", "comet", "nebula", "cosmic", "satellite", "mars",
    ],
  },
  {
    id: "office",
    label: "オフィス (Office Life)",
    hint: "Meetings, deadlines, coffee...",
    keywords: [
      "meeting", "email", "deadline", "coffee", "boss", "report", "office",
      "spreadsheet", "manager", "printer", "salary", "overtime", "colleague",
    ],
  },
  {
    id: "fantasy",
    label: "ファンタジー (Fantasy)",
    hint: "Dragons, wizards, quests...",
    keywords: [
      "dragon", "wizard", "sword", "castle", "quest", "magic", "knight",
      "potion", "elf", "kingdom", "spell", "goblin", "sorcerer",
    ],
  },
  {
    id: "food",
    label: "料理 (Food)",
    hint: "Kitchens, chefs, flavors...",
    keywords: [
      "kitchen", "chef", "recipe", "flavor", "spice", "dinner", "restaurant",
      "delicious", "noodle", "bake", "grill", "dessert", "ingredient",
    ],
  },
  {
    id: "internet",
    label: "ネット文化 (Internet Culture)",
    hint: "Memes, streams, algorithms...",
    keywords: [
      "meme", "viral", "stream", "algorithm", "follower", "upload", "server",
      "wifi", "browser", "notification", "influencer", "comment", "avatar",
    ],
  },
  {
    id: "school",
    label: "学校 (School)",
    hint: "Exams, homework, classrooms...",
    keywords: [
      "exam", "homework", "teacher", "classroom", "lecture", "student",
      "textbook", "grade", "quiz", "semester", "library", "principal",
    ],
  },
  {
    id: "meta",
    label: "メタ (Meta / Self-Aware)",
    hint: "Bonus points for breaking the fourth wall.",
    keywords: [
      "game", "player", "acronym", "score", "algorithm", "artificial",
      "prompt", "model", "developer", "screen", "code", "fourth wall",
    ],
  },
];

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

function randomLetter(): string {
  return WEIGHTED_LETTERS[Math.floor(Math.random() * WEIGHTED_LETTERS.length)];
}

export function generateAcronym(length: number): string {
  const len = Math.min(6, Math.max(3, Math.floor(length) || 4));
  return Array.from({ length: len }, randomLetter).join("");
}

export function pickRandomTheme(): Theme {
  return THEMES[Math.floor(Math.random() * THEMES.length)];
}

/** Splits an answer into words and checks each initial against the acronym. */
export function checkInitials(
  acronym: string,
  answer: string
): { ok: true; words: string[] } | { ok: false; reason: string } {
  const words = answer
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return { ok: false, reason: "Answer is empty." };
  }
  if (words.length !== acronym.length) {
    return {
      ok: false,
      reason: `Expected ${acronym.length} words, got ${words.length}.`,
    };
  }
  for (let i = 0; i < acronym.length; i++) {
    const expected = acronym[i].toUpperCase();
    const actual = words[i][0]?.toUpperCase();
    if (expected !== actual) {
      return {
        ok: false,
        reason: `Word ${i + 1} ("${words[i]}") must start with "${expected}".`,
      };
    }
  }
  return { ok: true, words };
}
