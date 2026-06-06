import { Router } from "express";
import { pool } from "../db.js";
import { getUserId } from "../middleware/auth.js";

export const notificationsRouter = Router();

notificationsRouter.get("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { unread_only, page = 1, limit = 20 } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    const conditions: string[] = ["user_id = $1"];
    const params: unknown[] = [userId];
    let paramIndex = 2;

    if (unread_only === "true") {
      conditions.push(`is_read = false`);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const result = await pool.query(
      `SELECT * FROM notifications
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, Number(limit), offset]
    );

    const unreadCount = await pool.query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    res.json({
      notifications: result.rows,
      unread_count: Number(unreadCount.rows[0].count),
    });
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

notificationsRouter.post("/:id/read", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;

    await pool.query(
      `UPDATE notifications 
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Mark notification read error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

notificationsRouter.post("/read-all", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    await pool.query(
      `UPDATE notifications 
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Mark all read error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
