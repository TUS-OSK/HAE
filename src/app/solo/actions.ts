"use server";

import { generateAcronym, pickRandomTheme, getTheme, checkInitials } from "@/lib/acronym";
import { scoreAnswer, type ScoreBreakdown } from "@/lib/scoring";

export async function startRound(
  length: number,
  themeChoice: string
): Promise<{ acronym: string; themeId: string }> {
  const acronym = generateAcronym(length);
  const themeId = themeChoice === "random" ? pickRandomTheme().id : themeChoice;
  return { acronym, themeId };
}

export async function submitSoloAnswer(
  acronym: string,
  themeId: string,
  answer: string
): Promise<{ score: ScoreBreakdown } | { error: string }> {
  // Letter-matching is a mechanical, deterministic check — code does this
  // reliably and instantly. The AI grader is much better spent purely on
  // the qualitative judgment calls (grammar, theme fit, difficulty, wit)
  // once validity is already confirmed, rather than re-deriving/verifying
  // the letter mapping itself, which it can get wrong on an otherwise
  // correct phrase.
  const check = checkInitials(acronym, answer);
  if (!check.ok) return { error: check.reason };

  const theme = getTheme(themeId);
  const score = await scoreAnswer(acronym, theme, check.words);
  return { score };
}
