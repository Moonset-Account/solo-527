import { NextResponse } from "next/server";
import { getArrivalRecords } from "@/lib/dataStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get("routeId");
  const stationId = searchParams.get("stationId");
  const tripId = searchParams.get("tripId");
  const includeDetour = searchParams.get("includeDetour") !== "false";

  const records = getArrivalRecords(
    routeId || undefined,
    stationId || undefined,
    tripId || undefined,
    includeDetour
  );

  return NextResponse.json(records);
}
