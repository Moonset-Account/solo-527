import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVersionHistory, compareVersions } from "@/lib/version-history";
import type { EntityType } from "@/lib/version-history";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType") as EntityType;
  const entityId = searchParams.get("entityId");
  const versionA = searchParams.get("versionA");
  const versionB = searchParams.get("versionB");

  if (!entityType || !entityId) {
    return NextResponse.json(
      { error: "entityType and entityId are required" },
      { status: 400 }
    );
  }

  try {
    if (versionA && versionB) {
      const comparison = await compareVersions(
        entityType,
        entityId,
        parseInt(versionA, 10),
        parseInt(versionB, 10)
      );

      if (!comparison) {
        return NextResponse.json({ error: "Versions not found" }, { status: 404 });
      }

      return NextResponse.json(comparison);
    }

    const history = await getVersionHistory(entityType, entityId);
    return NextResponse.json(history);
  } catch (error) {
    console.error("Get version history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch version history" },
      { status: 500 }
    );
  }
}
