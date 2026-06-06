import { NextResponse } from "next/server";
import { getCardRecords } from "@/lib/dataStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get("routeId");
  const stationId = searchParams.get("stationId");
  const tripId = searchParams.get("tripId");

  const records = getCardRecords(
    routeId || undefined,
    stationId || undefined,
    tripId || undefined
  );

  return NextResponse.json(records);
}
