import { NextResponse } from "next/server";
import { getAnomalies, updateAnomalyNote } from "@/lib/dataStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get("routeId");
  const type = searchParams.get("type");
  const resolved = searchParams.get("resolved");

  const anomalies = getAnomalies(
    routeId || undefined,
    type as any,
    resolved !== null ? resolved === "true" : undefined
  );

  return NextResponse.json(anomalies);
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { anomalyId, notes, resolvedBy } = body;

    if (!anomalyId || !notes) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const updated = updateAnomalyNote(anomalyId, notes, resolvedBy || "系统管理员");

    if (!updated) {
      return NextResponse.json(
        { error: "异常记录不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "更新失败" },
      { status: 500 }
    );
  }
}
