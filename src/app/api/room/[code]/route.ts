import { NextResponse } from "next/server";
import { getRoom } from "@/lib/room";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/room/[code]">
) {
  const { code } = await ctx.params;
  const room = await getRoom(code);
  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }
  return NextResponse.json({ room });
}
