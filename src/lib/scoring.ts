import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { COMMON_WORDS, FUNCTION_WORDS } from "./words";
import type { Theme } from "./acronym";

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

// OpenCode Go (https://opencode.ai/docs/ja/go) is an OpenAI-compatible
// gateway to third-party models. It's used as a fallback AI grader when no
// native Anthropic key is configured.
function getOpenCodeClient(): OpenAI | null {
  if (openCodeClient !== undefined) return openCodeClient;
  const apiKey = process.env.OPENCODE_API_KEY;
  openCodeClient = apiKey
    ? new OpenAI({ apiKey, baseURL: "https://opencode.ai/zen/go/v1" })
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
        "0-25. How well the phrase fits the given theme. If there is no theme, judge general coherence/cleverness instead and still score 0-25.",
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
  "You are the judge for HAE (How to Expand Acronym), a word game where players turn a random string of letters into an English phrase, one word per letter, in order. Grade the player's expansion fairly and encouragingly. Always call the submit_score tool exactly once.";

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
  const themeLine =
    theme.id === "none"
      ? "No theme was assigned for this round."
      : `The assigned theme is "${theme.label.replace(/\s*\(.+\)/, "")}".`;

  try {
    const message = await client.messages.create({
      model,
      max_tokens: 300,
      system: SCORE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Acronym: ${acronym.toUpperCase()}\n${themeLine}\nPlayer's expansion: "${answer}"\n\nGrade this expansion.`,
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
  const themeLine =
    theme.id === "none"
      ? "No theme was assigned for this round."
      : `The assigned theme is "${theme.label.replace(/\s*\(.+\)/, "")}".`;

  try {
    const completion = await client.chat.completions.create({
      model,
      max_tokens: 800,
      messages: [
        { role: "system", content: SCORE_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Acronym: ${acronym.toUpperCase()}\n${themeLine}\nPlayer's expansion: "${answer}"\n\nGrade this expansion.`,
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

  // Theme match: keyword overlap against the theme's curated keyword list.
  let themeMatch: number;
  if (theme.id === "none" || theme.keywords.length === 0) {
    themeMatch = clampScore(14 + Math.round(uniqueRatio * 8));
  } else {
    const text = lower.join(" ");
    const hits = theme.keywords.filter((k) => text.includes(k)).length;
    themeMatch = clampScore(6 + hits * 8);
  }

  // Difficulty: reward longer / less-common words.
  const rareCount = lower.filter(
    (w) => w.length >= 3 && !COMMON_WORDS.has(w)
  ).length;
  const avgLen = lower.reduce((s, w) => s + w.length, 0) / lower.length;
  let difficulty = Math.round((rareCount / lower.length) * 18 + avgLen);
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
