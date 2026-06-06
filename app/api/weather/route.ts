import { NextResponse } from "next/server";
import { getWeatherRecords } from "@/lib/dataStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  const records = getWeatherRecords(date || undefined);

  return NextResponse.json(records);
}
