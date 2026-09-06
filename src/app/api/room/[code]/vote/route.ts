import { NextResponse } from "next/server";
import { castVote } from "@/lib/room";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/room/[code]/vote">
) {
  const { code } = await ctx.params;
  const body = await request.json().catch(() => null);
  const voterId = typeof body?.playerId === "string" ? body.playerId : "";
  const targetPlayerId =
    typeof body?.targetPlayerId === "string" ? body.targetPlayerId : "";

  const result = await castVote(code, voterId, targetPlayerId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
