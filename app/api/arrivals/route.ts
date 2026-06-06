import { NextResponse } from "next/server";
import {
  getArrivalRecords,
  getStationCrowdingData,
  getDrillDownData,
  getHourlyTrendData,
  type TimeWindow,
} from "@/lib/dataStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get("routeId") || undefined;
  const stationId = searchParams.get("stationId") || undefined;
  const tripId = searchParams.get("tripId") || undefined;
  const includeDetour = searchParams.get("includeDetour") !== "false";
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const startHour = searchParams.get("startHour")
    ? parseInt(searchParams.get("startHour")!)
    : undefined;
  const endHour = searchParams.get("endHour")
    ? parseInt(searchParams.get("endHour")!)
    : undefined;
  const peakPeriod = (searchParams.get("peakPeriod") as TimeWindow["peakPeriod"]) || undefined;
  const drillDown = searchParams.get("drillDown") as "route" | "station" | "trip" | "record" | null;
  const drillId = searchParams.get("drillId") || undefined;

  if (drillDown && drillId) {
    const result = getDrillDownData(drillDown, drillId, {
      startDate,
      endDate,
      startHour,
      endHour,
      peakPeriod,
    });
    return NextResponse.json(result);
  }

  const crowdingMode = searchParams.get("crowdingMode") === "true";
  if (crowdingMode) {
    const data = getStationCrowdingData({
      routeId,
      startHour,
      endHour,
      hour: searchParams.get("hour") ? parseInt(searchParams.get("hour")!) : undefined,
      includeDetour,
      window: {
        startDate,
        endDate,
        startHour,
        endHour,
        peakPeriod,
      },
    });
    return NextResponse.json(data);
  }

  const hourlyMode = searchParams.get("hourlyMode") === "true";
  if (hourlyMode) {
    const data = getHourlyTrendData(routeId, {
      startDate,
      endDate,
      startHour,
      endHour,
      peakPeriod,
    });
    return NextResponse.json(data);
  }

  const records = getArrivalRecords(
    routeId,
    stationId,
    tripId,
    includeDetour,
    {
      startDate,
      endDate,
      startHour,
      endHour,
      peakPeriod,
    }
  );

  return NextResponse.json(records);
}
