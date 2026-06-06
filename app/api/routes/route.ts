import { NextResponse } from "next/server";
import { getRoutes_async } from "@/lib/dataStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get("routeId");

  let routes = await getRoutes_async();
  if (routeId) {
    routes = routes.filter((r) => r.id === routeId);
  }

  return NextResponse.json(routes);
}
