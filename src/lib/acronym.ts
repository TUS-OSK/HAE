import { FUNCTION_WORDS } from "./words";

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
  /** A concrete scenario description, shown to the player and fed to the AI judge. */
  hint: string;
  keywords: string[];
};

// "none" stays selectable by hand (some players want a completely free round)
// but pickRandomTheme() below always excludes it — themed rounds are more
// interesting and give the AI judge something concrete to grade against.
const NONE_THEME: Theme = {
  id: "none",
  label: "テーマなし (Free)",
  hint: "Anything goes — no scenario is assigned.",
  keywords: [],
};

const THEMED: Theme[] = [
  {
    id: "space-colony",
    label: "火星移住 (Mars Colonization)",
    hint: "Astronauts building humanity's first permanent colony on Mars.",
    keywords: [
      "mars", "rocket", "astronaut", "colony", "orbit", "oxygen", "dust",
      "habitat", "gravity", "rover", "airlock", "crater",
    ],
  },
  {
    id: "detective-noir",
    label: "探偵ノワール (Detective Noir)",
    hint: "A hard-boiled detective investigating a crime in a rain-soaked city at night.",
    keywords: [
      "detective", "suspect", "clue", "alley", "rain", "cigarette", "witness",
      "murder", "shadow", "informant", "case", "trench coat",
    ],
  },
  {
    id: "cooking-show",
    label: "料理対決番組 (Cooking Competition)",
    hint: "Chefs racing the clock in a televised cooking competition.",
    keywords: [
      "chef", "kitchen", "timer", "judge", "plate", "flavor", "knife",
      "recipe", "garnish", "whisk", "oven", "sauce",
    ],
  },
  {
    id: "high-school-romance",
    label: "青春恋愛 (High School Romance)",
    hint: "A shy student confessing their feelings under the cherry blossoms after class.",
    keywords: [
      "classroom", "crush", "blossom", "confession", "locker", "notebook",
      "blush", "rooftop", "friendship", "heartbeat", "uniform",
    ],
  },
  {
    id: "superhero-origin",
    label: "ヒーロー誕生 (Superhero Origin)",
    hint: "An ordinary person discovering they suddenly have superpowers.",
    keywords: [
      "power", "cape", "villain", "rescue", "mask", "city", "explosion",
      "hero", "transform", "gravity", "shield", "secret identity",
    ],
  },
  {
    id: "pirate-treasure",
    label: "海賊の宝探し (Pirate Treasure Hunt)",
    hint: "Pirates racing rivals to dig up buried treasure on a tropical island.",
    keywords: [
      "pirate", "treasure", "map", "island", "ship", "parrot", "cannon",
      "compass", "gold", "mutiny", "cove", "captain",
    ],
  },
  {
    id: "startup-pitch",
    label: "起業ピッチ (Startup Pitch)",
    hint: "A scrappy startup founder pitching investors before the money runs out.",
    keywords: [
      "startup", "investor", "pitch", "funding", "app", "launch", "deadline",
      "revenue", "founder", "prototype", "runway", "valuation",
    ],
  },
  {
    id: "haunted-mansion",
    label: "幽霊屋敷 (Haunted Mansion)",
    hint: "Explorers spending one night in an abandoned, haunted mansion.",
    keywords: [
      "ghost", "haunted", "creak", "candle", "attic", "whisper", "shadow",
      "curse", "mansion", "flashlight", "cobweb", "scream",
    ],
  },
  {
    id: "idol-concert",
    label: "アイドルライブ (Idol Concert)",
    hint: "A pop idol group preparing backstage for the biggest concert of their career.",
    keywords: [
      "stage", "fans", "concert", "encore", "spotlight", "rehearsal",
      "costume", "microphone", "setlist", "cheer", "glitter",
    ],
  },
  {
    id: "ninja-mission",
    label: "忍者の潜入 (Ninja Infiltration)",
    hint: "A ninja sneaking into a heavily-guarded castle under cover of darkness.",
    keywords: [
      "ninja", "castle", "shadow", "stealth", "shuriken", "rooftop", "guard",
      "silent", "moonlight", "scroll", "smoke bomb",
    ],
  },
  {
    id: "typhoon-forecast",
    label: "台風の進路 (Typhoon Forecast)",
    hint: "Meteorologists racing to track an approaching super typhoon before landfall.",
    keywords: [
      "typhoon", "forecast", "storm", "wind", "evacuate", "radar", "flood",
      "warning", "pressure", "shelter", "satellite",
    ],
  },
  {
    id: "dragon-quest",
    label: "ドラゴン討伐 (Dragon-Slaying Quest)",
    hint: "A party of adventurers marching to slay a dragon and save the kingdom.",
    keywords: [
      "dragon", "sword", "quest", "kingdom", "wizard", "shield", "castle",
      "potion", "knight", "treasure", "spell", "armor",
    ],
  },
  {
    id: "streamer-life",
    label: "配信者の日常 (Streamer Life)",
    hint: "A live streamer's chat reacting in real time during a viral gaming moment.",
    keywords: [
      "stream", "chat", "viral", "clip", "subscriber", "donation", "lag",
      "highlight", "emote", "raid", "webcam",
    ],
  },
  {
    id: "safari-documentary",
    label: "野生動物ドキュメンタリー (Safari Documentary)",
    hint: "A nature documentary crew filming lions hunting on the African savanna.",
    keywords: [
      "savanna", "lion", "herd", "camera", "predator", "migration",
      "waterhole", "narrator", "safari", "wildlife", "drought",
    ],
  },
  {
    id: "time-travel",
    label: "タイムトラベル (Time Travel Mishap)",
    hint: "A scientist's experiment accidentally sends them back to ancient Rome.",
    keywords: [
      "time machine", "paradox", "ancient", "future", "portal", "history",
      "scientist", "empire", "gladiator", "timeline", "invention",
    ],
  },
  {
    id: "office-monday",
    label: "月曜の残業 (Chaotic Office Monday)",
    hint: "An overworked employee surviving another chaotic Monday full of meetings.",
    keywords: [
      "meeting", "deadline", "email", "boss", "coffee", "spreadsheet",
      "overtime", "printer", "commute", "inbox", "report",
    ],
  },
  {
    id: "final-exam",
    label: "期末試験前夜 (Final Exam Cram)",
    hint: "Students pulling an all-nighter to cram for a make-or-break final exam.",
    keywords: [
      "exam", "textbook", "cram", "flashcard", "deadline", "classroom",
      "grade", "professor", "caffeine", "notes", "anxiety",
    ],
  },
  {
    id: "music-festival",
    label: "夏フェス (Summer Music Festival)",
    hint: "Fans camping out for three days at a massive outdoor summer music festival.",
    keywords: [
      "festival", "stage", "crowd", "headliner", "tent", "mosh pit",
      "sunscreen", "encore", "lineup", "speaker", "wristband",
    ],
  },
  {
    id: "meta",
    label: "メタ・自己言及 (Meta / Self-Aware)",
    hint: "The phrase cleverly comments on itself, on being an acronym, or on being graded by an AI right now.",
    keywords: [
      "game", "player", "acronym", "score", "algorithm", "artificial",
      "prompt", "model", "developer", "screen", "code", "judge",
    ],
  },
];

export const THEMES: Theme[] = [NONE_THEME, ...THEMED];

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMED[0];
}

function randomLetter(): string {
  return WEIGHTED_LETTERS[Math.floor(Math.random() * WEIGHTED_LETTERS.length)];
}

export function generateAcronym(length: number): string {
  const len = Math.min(6, Math.max(3, Math.floor(length) || 4));
  return Array.from({ length: len }, randomLetter).join("");
}

/** Always returns a concrete theme — never the "no theme" option. */
export function pickRandomTheme(): Theme {
  return THEMED[Math.floor(Math.random() * THEMED.length)];
}

// Common function words (articles, prepositions, conjunctions, auxiliary
// verbs, pronouns, ...) can be inserted for free between the "letter words"
// as long as they're written lowercase — e.g. for WICD, "Wonder that I
// Can't Deal" is fine even though "that" doesn't map to a letter.
// Capitalizing one ("That") means the player intended it as a real letter
// word, so it's still checked normally.
const CONNECTOR_WORDS = new Set([...FUNCTION_WORDS, "up", "out", "off"]);

function isSkippableConnector(word: string): boolean {
  const stripped = word.replace(/[^a-zA-Z']/g, "");
  if (!/^[a-z]/.test(stripped)) return false; // must start lowercase
  return CONNECTOR_WORDS.has(stripped.toLowerCase());
}

/**
 * Splits an answer into words and checks each initial against the acronym.
 * Lowercase connector words (see CONNECTOR_WORDS) don't count toward the
 * acronym mapping, but the full phrase (connectors included) is returned so
 * scoring/display sees the natural, more grammatical sentence.
 */
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

  const contentWords = words.filter((w) => !isSkippableConnector(w));

  if (contentWords.length !== acronym.length) {
    return {
      ok: false,
      reason: `Expected ${acronym.length} main words, got ${contentWords.length}. (lowercase "by"/"of"/"and"-style connectors don't count)`,
    };
  }
  for (let i = 0; i < acronym.length; i++) {
    const expected = acronym[i].toUpperCase();
    const actual = contentWords[i][0]?.toUpperCase();
    if (expected !== actual) {
      return {
        ok: false,
        reason: `"${contentWords[i]}" (word ${i + 1} of ${acronym.length}) must start with "${expected}".`,
      };
    }
  }
  return { ok: true, words };
}
