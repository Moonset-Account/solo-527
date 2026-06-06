import { getDB, initDB } from "~/server/db";
import type { APIEvent } from "@solidjs/start/server";

initDB();

export async function GET(event: APIEvent) {
  const db = getDB();
  const url = new URL(event.request.url);
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");
  const operator = url.searchParams.get("operator");
  const action = url.searchParams.get("action");
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "50");

  let query = "SELECT * FROM audit_logs WHERE 1=1";
  const params: any[] = [];

  if (entityType) {
    query += " AND entity_type = ?";
    params.push(entityType);
  }
  if (entityId) {
    query += " AND entity_id = ?";
    params.push(entityId);
  }
  if (operator) {
    query += " AND operator LIKE ?";
    params.push(`%${operator}%`);
  }
  if (action) {
    query += " AND action = ?";
    params.push(action);
  }
  if (startDate) {
    query += " AND created_at >= ?";
    params.push(parseInt(startDate));
  }
  if (endDate) {
    query += " AND created_at <= ?";
    params.push(parseInt(endDate));
  }

  const countQuery = query.replace("SELECT *", "SELECT COUNT(*) as total");
  const total = (db.prepare(countQuery).get(...params) as any).total;

  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  const logs = db.prepare(query).all(...params, pageSize, (page - 1) * pageSize);

  return Response.json({
    logs,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
