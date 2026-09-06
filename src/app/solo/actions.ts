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
  const check = checkInitials(acronym, answer);
  if (!check.ok) return { error: check.reason };

  const theme = getTheme(themeId);
  const score = await scoreAnswer(acronym, theme, check.words);
  return { score };
}
