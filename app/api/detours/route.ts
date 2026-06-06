import { NextResponse } from "next/server";
import { getDetourInfos_async } from "@/lib/dataStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get("routeId");
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  const detours = await getDetourInfos_async(routeId || undefined, { startDate, endDate });

  return NextResponse.json(detours);
}
