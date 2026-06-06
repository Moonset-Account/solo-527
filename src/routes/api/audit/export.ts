import { getDB, initDB } from "~/server/db";
import type { APIEvent } from "@solidjs/start/server";

initDB();

export async function GET(event: APIEvent) {
  const db = getDB();
  const url = new URL(event.request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const format = url.searchParams.get("format") || "json";
  const now = Date.now();
  const start = startDate ? parseInt(startDate) : now - 30 * 24 * 60 * 60 * 1000;
  const end = endDate ? parseInt(endDate) : now;

  const logs = db
    .prepare(
      "SELECT * FROM audit_logs WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC"
    )
    .all(start, end);

  if (format === "csv") {
    const headers = ["ID", "操作", "实体类型", "实体ID", "操作人", "角色", "备注", "时间"];
    const rows = logs.map((log: any) => [
      log.id,
      log.action,
      log.entity_type,
      log.entity_id,
      log.operator,
      log.operator_role,
      log.remark || "",
      new Date(log.created_at).toLocaleString("zh-CN"),
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    return new Response("\ufeff" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit-log-${Date.now()}.csv"`,
      },
    });
  }

  return Response.json(logs);
}
