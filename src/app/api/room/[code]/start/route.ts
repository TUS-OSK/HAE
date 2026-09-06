import { NextResponse } from "next/server";
import { startGame } from "@/lib/room";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/room/[code]/start">
) {
  const { code } = await ctx.params;
  const body = await request.json().catch(() => null);
  const playerId = typeof body?.playerId === "string" ? body.playerId : "";

  const result = await startGame(code, playerId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
