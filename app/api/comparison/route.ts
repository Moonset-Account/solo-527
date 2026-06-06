import { NextResponse } from "next/server";
import { calculateComparisonMetrics, getRoutes } from "@/lib/serverDataStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const routeIds = searchParams.get("routeIds")?.split(",") || [];
  const peakPeriod = searchParams.get("peakPeriod") as any;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const startHour = searchParams.get("startHour")
    ? parseInt(searchParams.get("startHour")!)
    : undefined;
  const endHour = searchParams.get("endHour")
    ? parseInt(searchParams.get("endHour")!)
    : undefined;

  let ids = routeIds;
  if (ids.length === 0) {
    const routes = await getRoutes();
    ids = routes.map((r) => r.id);
  }

  const metrics = await calculateComparisonMetrics(ids, peakPeriod, {
    startDate,
    endDate,
    startHour,
    endHour,
    peakPeriod: peakPeriod || "all",
  });

  return NextResponse.json(metrics);
}
