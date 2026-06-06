import { NextResponse } from "next/server";
import { getCardRecords } from "@/lib/serverDataStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get("routeId");
  const stationId = searchParams.get("stationId");
  const tripId = searchParams.get("tripId");
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  const records = await getCardRecords(
    routeId || undefined,
    stationId || undefined,
    tripId || undefined,
    { startDate, endDate }
  );

  return NextResponse.json(records);
}
