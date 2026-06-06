import { NextResponse } from "next/server";
import { getWeatherRecords } from "@/lib/serverDataStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const startHour = searchParams.get("startHour")
    ? parseInt(searchParams.get("startHour")!)
    : undefined;
  const endHour = searchParams.get("endHour")
    ? parseInt(searchParams.get("endHour")!)
    : undefined;

  const records = await getWeatherRecords(date || undefined, startHour, endHour);

  return NextResponse.json(records);
}
