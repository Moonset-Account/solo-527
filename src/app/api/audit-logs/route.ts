import { NextResponse } from "next/server";
import { auditLogService } from "@/services/auditLogService";
import type { EntityType } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType") as EntityType | undefined;
    const entityId = searchParams.get("entityId") || undefined;

    const data = await auditLogService.getAuditLogs(entityType, entityId);
    return NextResponse.json({
      success: true,
      data,
      message: "获取审计日志成功",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "获取审计日志失败",
      },
      { status: 500 }
    );
  }
}
