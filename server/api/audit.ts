import { Router } from "express";
import { pool } from "../db.js";
import { requireRole, getCurrentUser } from "../middleware/auth.js";

export const auditRouter = Router();

auditRouter.get("/", requireRole("supervisor"), async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { action, resource_type, user_id, start_date, end_date, page = 1, limit = 50 } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (action) {
      conditions.push(`al.action = $${paramIndex++}`);
      params.push(action);
    }

    if (resource_type) {
      conditions.push(`al.resource_type = $${paramIndex++}`);
      params.push(resource_type);
    }

    if (user_id) {
      conditions.push(`al.user_id = $${paramIndex++}`);
      params.push(user_id);
    }

    if (start_date) {
      conditions.push(`al.created_at >= $${paramIndex++}`);
      params.push(start_date);
    }

    if (end_date) {
      conditions.push(`al.created_at <= $${paramIndex++}`);
      params.push(end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT al.*, u.username, u.real_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, Number(limit), offset]
    );

    res.json({ logs: result.rows });
  } catch (err) {
    console.error("Get audit logs error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
