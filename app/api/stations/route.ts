import { NextResponse } from "next/server";
import { getStations_async, getArrivalRecords_async, getStationCrowdingData_async } from "@/lib/dataStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stationId = searchParams.get("stationId");
  const withCrowding = searchParams.get("withCrowding") === "true";
  const hour = searchParams.get("hour");
  const routeId = searchParams.get("routeId") || undefined;

  let stations = await getStations_async();
  if (stationId) {
    stations = stations.filter((s) => s.id === stationId);
  }

  if (withCrowding) {
    const crowdingData = await getStationCrowdingData_async({
      routeId,
      hour: hour ? parseInt(hour) : undefined,
      includeDetour: false,
    });

    const crowdingMap: Record<string, any> = {};
    crowdingData.forEach((item) => {
      crowdingMap[item.stationId] = item;
    });

    const stationsWithCrowding = stations.map((s) => {
      const stats = crowdingMap[s.id] || {
        avgLoadFactor: 0,
        crowdingLevel: "low",
        totalPassengers: 0,
        arrivalCount: 0,
      };
      return {
        ...s,
        avgLoadFactor: stats.avgLoadFactor,
        crowdingLevel: stats.crowdingLevel,
        totalPassengers: stats.totalPassengers,
        arrivalCount: stats.arrivalCount,
      };
    });

    return NextResponse.json(stationsWithCrowding);
  }

  return NextResponse.json(stations);
}
