import { NextResponse } from "next/server";
import { joinRoom } from "@/lib/room";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/room/[code]/join">
) {
  const { code } = await ctx.params;
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const result = await joinRoom(code, name);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
