import { NextResponse } from "next/server";
import { calculateComparisonMetrics, getRoutes } from "@/lib/dataStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const routeIds = searchParams.get("routeIds")?.split(",") || [];
  const peakPeriod = searchParams.get("peakPeriod");

  let ids = routeIds;
  if (ids.length === 0) {
    ids = getRoutes().map((r) => r.id);
  }

  const metrics = calculateComparisonMetrics(
    ids,
    peakPeriod as any
  );

  return NextResponse.json(metrics);
}
