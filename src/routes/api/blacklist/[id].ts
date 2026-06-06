import { getDB, initDB } from "~/server/db";
import { writeAuditLog } from "~/server/utils";
import type { APIEvent } from "@solidjs/start/server";

initDB();

export async function PUT({ params, request }: APIEvent) {
  const db = getDB();
  const id = params.id;
  const body = await request.json();
  const now = Date.now();

  const oldItem = db.prepare("SELECT * FROM blacklist WHERE id = ?").get(id);
  if (!oldItem) {
    return Response.json({ error: "记录不存在" }, { status: 404 });
  }

  const { isActive, reason, expiresAt, operator = "system" } = body;

  db.prepare(`
    UPDATE blacklist SET
      reason = COALESCE(?, reason),
      expires_at = COALESCE(?, expires_at),
      is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(
    reason || null,
    expiresAt || null,
    isActive !== undefined ? (isActive ? 1 : 0) : null,
    id
  );

  const newItem = db.prepare("SELECT * FROM blacklist WHERE id = ?").get(id);

  writeAuditLog(
    "update",
    "blacklist",
    id,
    operator,
    "admin",
    oldItem,
    newItem,
    isActive === 0 ? "从黑名单移除" : "更新黑名单信息"
  );

  return Response.json(newItem);
}

export async function DELETE({ params, request }: APIEvent) {
  const db = getDB();
  const id = params.id;
  let operator = "system";
  
  try {
    const body = await request.json();
    operator = body.operator || "system";
  } catch (e) {}

  const oldItem = db.prepare("SELECT * FROM blacklist WHERE id = ?").get(id);
  if (!oldItem) {
    return Response.json({ error: "记录不存在" }, { status: 404 });
  }

  db.prepare("DELETE FROM blacklist WHERE id = ?").run(id);

  writeAuditLog(
    "delete",
    "blacklist",
    id,
    operator,
    "admin",
    oldItem,
    null,
    "删除黑名单记录"
  );

  return Response.json({ success: true });
}
