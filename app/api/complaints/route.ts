import { NextResponse } from "next/server";
import { getComplaints } from "@/lib/dataStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get("routeId");
  const status = searchParams.get("status") as "open" | "resolved" | "closed" | undefined;

  const complaints = getComplaints(routeId || undefined, status);

  return NextResponse.json(complaints);
}
