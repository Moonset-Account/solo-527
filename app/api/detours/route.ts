import { NextResponse } from "next/server";
import { getDetourInfos } from "@/lib/dataStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get("routeId");

  const detours = getDetourInfos(routeId || undefined);

  return NextResponse.json(detours);
}
