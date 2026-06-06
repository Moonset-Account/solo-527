import { NextResponse } from "next/server";
import { getComplaints } from "@/lib/dataStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get("routeId") || undefined;
  const status = searchParams.get("status") as "open" | "resolved" | "closed" | undefined;
  const category = searchParams.get("category") as any;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const startHour = searchParams.get("startHour")
    ? parseInt(searchParams.get("startHour")!)
    : undefined;
  const endHour = searchParams.get("endHour")
    ? parseInt(searchParams.get("endHour")!)
    : undefined;
  const peakPeriod = searchParams.get("peakPeriod") as any;

  const complaints = getComplaints(routeId, status, category, {
    startDate,
    endDate,
    startHour,
    endHour,
    peakPeriod: peakPeriod || "all",
  });

  return NextResponse.json(complaints);
}
