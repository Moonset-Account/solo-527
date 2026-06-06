import { NextResponse } from "next/server";
import { getStations, getArrivalRecords } from "@/lib/dataStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stationId = searchParams.get("stationId");
  const withCrowding = searchParams.get("withCrowding") === "true";
  const hour = searchParams.get("hour");

  let stations = getStations();
  if (stationId) {
    stations = stations.filter((s) => s.id === stationId);
  }

  if (withCrowding) {
    const arrivals = getArrivalRecords();
    const stationStats: Record<string, { load: number; count: number; passengers: number }> = {};

    arrivals.forEach((a) => {
      if (!stationStats[a.stationId]) {
        stationStats[a.stationId] = { load: 0, count: 0, passengers: 0 };
      }
      stationStats[a.stationId].load += a.loadFactor;
      stationStats[a.stationId].count += 1;
      stationStats[a.stationId].passengers += a.passengerCount;
    });

    const stationsWithCrowding = stations.map((s) => {
      const stats = stationStats[s.id] || { load: 0, count: 0, passengers: 0 };
      const avgLoad = stats.count > 0 ? stats.load / stats.count : 0;
      let crowdingLevel = "low";
      if (avgLoad >= 0.9) crowdingLevel = "extreme";
      else if (avgLoad >= 0.7) crowdingLevel = "high";
      else if (avgLoad >= 0.4) crowdingLevel = "medium";

      return {
        ...s,
        avgLoadFactor: Number(avgLoad.toFixed(4)),
        crowdingLevel,
        totalPassengers: stats.passengers,
      };
    });

    return NextResponse.json(stationsWithCrowding);
  }

  return NextResponse.json(stations);
}
