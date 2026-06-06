import { getDB, initDB } from "~/server/db";
import { generateId, writeAuditLog } from "~/server/utils";
import type { APIEvent } from "@solidjs/start/server";

initDB();

export async function GET(event: APIEvent) {
  const db = getDB();
  const url = new URL(event.request.url);
  const plate = url.searchParams.get("plate");
  const active = url.searchParams.get("active");

  let query = "SELECT * FROM blacklist WHERE 1=1";
  const params: any[] = [];

  if (plate) {
    query += " AND plate_number LIKE ?";
    params.push(`%${plate}%`);
  }
  if (active !== undefined && active !== null) {
    query += " AND is_active = ?";
    params.push(active === "true" ? 1 : 0);
  }

  query += " ORDER BY added_at DESC";

  const blacklist = db.prepare(query).all(...params);
  return Response.json(blacklist);
}

export async function POST({ request }: APIEvent) {
  const db = getDB();
  const body = await request.json();
  const now = Date.now();

  const { plateNumber, reason, addedBy, expiresAt } = body;

  if (!plateNumber || !reason || !addedBy) {
    return Response.json({ error: "请提供车牌号、原因和添加人" }, { status: 400 });
  }

  const id = generateId();

  try {
    const stmt = db.prepare(`
      INSERT INTO blacklist (id, plate_number, reason, added_by, added_at, expires_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    stmt.run(
      id,
      plateNumber.toUpperCase(),
      reason,
      addedBy,
      now,
      expiresAt || null
    );
  } catch (e: any) {
    if (e.message.includes("UNIQUE")) {
      return Response.json({ error: "该车已在黑名单中" }, { status: 409 });
    }
    throw e;
  }

  writeAuditLog(
    "add",
    "blacklist",
    id,
    addedBy,
    "admin",
    null,
    { plateNumber, reason, expiresAt },
    "添加黑名单车辆"
  );

  return Response.json({ id, plateNumber: plateNumber.toUpperCase() }, { status: 201 });
}
