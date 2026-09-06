import { NextResponse } from "next/server";
import { submitAnswer } from "@/lib/room";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/room/[code]/submit">
) {
  const { code } = await ctx.params;
  const body = await request.json().catch(() => null);
  const playerId = typeof body?.playerId === "string" ? body.playerId : "";
  const text = typeof body?.text === "string" ? body.text : "";

  const result = await submitAnswer(code, playerId, text);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
