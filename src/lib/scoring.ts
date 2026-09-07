import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { COMMON_WORDS, FUNCTION_WORDS } from "./words";
import { checkInitials, type Theme } from "./acronym";

export type ScoreBreakdown = {
  grammar: number; // 0-25
  themeMatch: number; // 0-25
  difficulty: number; // 0-25
  metafiction: number; // 0-25
  total: number; // 0-100
  comment: string;
  engine: "ai" | "heuristic";
};

const CATEGORY_MAX = 25;

function clampScore(n: unknown): number {
  const num = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.min(CATEGORY_MAX, Math.round(num)));
}

let anthropicClient: Anthropic | null | undefined;

function getClient(): Anthropic | null {
  if (anthropicClient !== undefined) return anthropicClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  anthropicClient = apiKey ? new Anthropic({ apiKey }) : null;
  return anthropicClient;
}

let openCodeClient: OpenAI | null | undefined;

// A stable per-process id so OpenCode Go can route/cache consistently. Our
// calls are one-off (no multi-turn conversation), so per-process is enough —
// it just needs to not be blank or change every request.
const OPENCODE_SESSION_ID = `hae-${crypto.randomUUID()}`;

// OpenCode Go (https://opencode.ai/docs/ja/go) is an OpenAI-compatible
// gateway to third-party models. It's used as a fallback AI grader when no
// native Anthropic key is configured. It expects an x-opencode-session
// header (stable per-conversation id, for routing/caching) and a
// descriptive User-Agent — omitting them gets requests rejected with
// "cannot be routed efficiently".
function getOpenCodeClient(): OpenAI | null {
  if (openCodeClient !== undefined) return openCodeClient;
  const apiKey = process.env.OPENCODE_API_KEY;
  openCodeClient = apiKey
    ? new OpenAI({
        apiKey,
        baseURL: "https://opencode.ai/zen/go/v1",
        defaultHeaders: {
          "x-opencode-session": OPENCODE_SESSION_ID,
          "User-Agent": "hae-word-game/1.0",
        },
      })
    : null;
  return openCodeClient;
}

export function aiScoringAvailable(): boolean {
  return getClient() !== null || getOpenCodeClient() !== null;
}

const SCORE_TOOL_NAME = "submit_score";
const SCORE_TOOL_DESCRIPTION =
  "Submit the graded score breakdown for a HAE acronym-expansion answer.";
const SCORE_SCHEMA = {
  type: "object",
  properties: {
    grammar: {
      type: "integer",
      description:
        "0-25. Is the phrase grammatically well-formed English (word order, agreement, sensible parts of speech)?",
    },
    themeMatch: {
      type: "integer",
      description:
        "0-25. Judge the OVERALL MEANING of the phrase as a whole against the theme scenario — read it like a sentence or title, never word-by-word. A phrase built entirely from plain, non-'thematic' vocabulary can still score high if the situation it describes genuinely fits the scenario; conversely, cramming in obviously theme-related buzzwords that don't add up to a coherent, fitting scenario should score LOW. If there is no theme, judge general coherence/cleverness of the whole phrase instead and still score 0-25.",
    },
    difficulty: {
      type: "integer",
      description:
        "0-25. Vocabulary sophistication: rarer, more advanced, or more precise English words score higher than basic function words.",
    },
    metafiction: {
      type: "integer",
      description:
        "0-25. Creative/self-referential bonus: wordplay, humor, or the phrase cleverly commenting on itself, the game, acronyms, or AI/being judged.",
    },
    comment: {
      type: "string",
      description:
        "One short, friendly English sentence (max ~25 words) of feedback for an English-language learner, mentioning one concrete strength or tip.",
    },
  },
  required: ["grammar", "themeMatch", "difficulty", "metafiction", "comment"],
};

const SCORE_TOOL: Anthropic.Tool = {
  name: SCORE_TOOL_NAME,
  description: SCORE_TOOL_DESCRIPTION,
  input_schema: SCORE_SCHEMA as Anthropic.Tool.InputSchema,
};

const SCORE_TOOL_OPENAI: OpenAI.Chat.ChatCompletionTool = {
  type: "function",
  function: {
    name: SCORE_TOOL_NAME,
    description: SCORE_TOOL_DESCRIPTION,
    parameters: SCORE_SCHEMA,
  },
};

const SCORE_SYSTEM_PROMPT =
  "You are the judge for HAE (How to Expand Acronym), a word game where players turn a random string of letters into an English phrase, one word per letter, in order. The letter-mapping has already been validated by code before you see it, so don't re-check or penalize it — some lowercase connector words (\"by\"/\"of\"/\"and\"/\"the\"/\"that\"/etc.) may appear between the letter words by design. Grade the player's expansion fairly and encouragingly. For themeMatch specifically, evaluate the phrase's overall meaning and implied scenario against the theme — do NOT just check whether individual words look 'thematic' in isolation; a coherent phrase describing the right situation beats a pile of theme keywords that don't form a sensible picture. Always call the submit_score tool exactly once.";

function buildUserPrompt(acronym: string, theme: Theme, answer: string): string {
  const themeLine =
    theme.id === "none"
      ? "No theme was assigned for this round — judge general coherence and cleverness."
      : `Theme scenario: ${theme.hint}`;
  return `Acronym: ${acronym.toUpperCase()}\n${themeLine}\nPlayer's expansion: "${answer}"\n\nGrade this expansion.`;
}

function buildScoreFromToolInput(input: Record<string, unknown>): {
  grammar: number;
  themeMatch: number;
  difficulty: number;
  metafiction: number;
  comment: string;
} {
  const grammar = clampScore(input.grammar);
  const themeMatch = clampScore(input.themeMatch);
  const difficulty = clampScore(input.difficulty);
  const metafiction = clampScore(input.metafiction);
  const comment =
    typeof input.comment === "string" && input.comment.trim()
      ? input.comment.trim()
      : "Nice try!";
  return { grammar, themeMatch, difficulty, metafiction, comment };
}

async function scoreWithAI(
  acronym: string,
  theme: Theme,
  answer: string
): Promise<ScoreBreakdown | null> {
  const client = getClient();
  if (!client) return null;

  const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

  try {
    const message = await client.messages.create({
      model,
      max_tokens: 300,
      system: SCORE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserPrompt(acronym, theme, answer),
        },
      ],
      tools: [SCORE_TOOL],
      tool_choice: { type: "tool", name: SCORE_TOOL_NAME },
    });

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );
    if (!toolUse) return null;

    const parsed = buildScoreFromToolInput(toolUse.input as Record<string, unknown>);
    return {
      ...parsed,
      total: parsed.grammar + parsed.themeMatch + parsed.difficulty + parsed.metafiction,
      engine: "ai",
    };
  } catch (err) {
    console.error("[scoring] Anthropic call failed, falling back:", err);
    return null;
  }
}

async function scoreWithOpenCode(
  acronym: string,
  theme: Theme,
  answer: string
): Promise<ScoreBreakdown | null> {
  const client = getOpenCodeClient();
  if (!client) return null;

  const model = process.env.OPENCODE_MODEL || "kimi-k2.6";

  try {
    const completion = await client.chat.completions.create({
      model,
      max_tokens: 800,
      messages: [
        { role: "system", content: SCORE_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildUserPrompt(acronym, theme, answer),
        },
      ],
      tools: [SCORE_TOOL_OPENAI],
      tool_choice: { type: "function", function: { name: SCORE_TOOL_NAME } },
    });

    const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.type !== "function") return null;

    const input = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
    const parsed = buildScoreFromToolInput(input);
    return {
      ...parsed,
      total: parsed.grammar + parsed.themeMatch + parsed.difficulty + parsed.metafiction,
      engine: "ai",
    };
  } catch (err) {
    console.error("[scoring] OpenCode Go call failed, falling back:", err);
    return null;
  }
}

function scoreHeuristically(
  acronym: string,
  theme: Theme,
  words: string[]
): ScoreBreakdown {
  // This scorer can't judge free-form phrasing the way the AI grader can, so
  // it still needs the strict structural check here — unlike the AI paths,
  // which decide lettersMatch themselves.
  const check = checkInitials(acronym, words.join(" "));
  if (!check.ok) {
    return {
      grammar: 0,
      themeMatch: 0,
      difficulty: 0,
      metafiction: 0,
      total: 0,
      comment: `${check.reason} (offline scorer — no AI key configured)`,
      engine: "heuristic",
    };
  }

  const lower = words.map((w) => w.toLowerCase().replace(/[^a-z']/g, ""));

  // Grammar (rough proxy): reward a healthy mix of function words + content
  // words and penalize obvious repetition; this is deliberately conservative.
  const functionCount = lower.filter((w) => FUNCTION_WORDS.has(w)).length;
  const uniqueRatio = new Set(lower).size / lower.length;
  const hasSomeStructure = functionCount > 0 && functionCount < lower.length;
  let grammar = 12;
  if (hasSomeStructure) grammar += 7;
  grammar += Math.round(uniqueRatio * 6);
  grammar = clampScore(grammar);

  // Theme match: this offline fallback can't judge overall *meaning* the way
  // the AI grader does, so it leans on whole-phrase coherence (the same
  // proxy used for grammar above) and treats keyword overlap as a lighter
  // supporting signal rather than the whole score — a coherent phrase with
  // zero exact keyword hits still gets partial credit, while keyword-stuffed
  // but incoherent phrases are capped lower.
  const coherence = hasSomeStructure ? 1 : 0.4;
  let themeMatch: number;
  if (theme.id === "none" || theme.keywords.length === 0) {
    themeMatch = clampScore(10 + Math.round(uniqueRatio * 7) + Math.round(coherence * 8));
  } else {
    const text = lower.join(" ");
    const hits = theme.keywords.filter((k) => text.includes(k)).length;
    const relevance = Math.min(1, hits / 2);
    themeMatch = clampScore(4 + relevance * 13 + coherence * 8);
  }

  // Difficulty: reward longer / less-common *content* words. Connector
  // filler (by/of/and/...) is excluded so it can't dilute or inflate this.
  const contentLower = lower.filter((w) => !FUNCTION_WORDS.has(w));
  const difficultyWords = contentLower.length > 0 ? contentLower : lower;
  const rareCount = difficultyWords.filter(
    (w) => w.length >= 3 && !COMMON_WORDS.has(w)
  ).length;
  const avgLen =
    difficultyWords.reduce((s, w) => s + w.length, 0) / difficultyWords.length;
  let difficulty = Math.round((rareCount / difficultyWords.length) * 18 + avgLen);
  difficulty = clampScore(difficulty);

  // Metafiction: keyword-spot for self-aware / game-referential vocabulary.
  const metaKeywords = [
    "game", "player", "acronym", "score", "algorithm", "artificial",
    "prompt", "model", "developer", "screen", "code", "ai", "judge",
    "letter", "meta", "fourth", "wall", "claude", "robot",
  ];
  const metaHits = metaKeywords.filter((k) => lower.includes(k)).length;
  const metafiction = clampScore(4 + metaHits * 10);

  return {
    grammar,
    themeMatch,
    difficulty,
    metafiction,
    total: grammar + themeMatch + difficulty + metafiction,
    comment:
      "Offline scorer (no ANTHROPIC_API_KEY / OPENCODE_API_KEY set) — rough estimate only. Set a key for real AI grading.",
    engine: "heuristic",
  };
}

export async function scoreAnswer(
  acronym: string,
  theme: Theme,
  words: string[]
): Promise<ScoreBreakdown> {
  const answer = words.join(" ");
  const aiResult =
    (await scoreWithAI(acronym, theme, answer)) ??
    (await scoreWithOpenCode(acronym, theme, answer));
  if (aiResult) return aiResult;
  return scoreHeuristically(acronym, theme, words);
}
