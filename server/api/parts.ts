import { Router } from "express";
import { pool } from "../db.js";
import { requireRole } from "../middleware/auth.js";
import { logAction } from "../audit.js";

export const partsRouter = Router();

partsRouter.get("/", async (req, res) => {
  try {
    const { keyword, category, page = 1, limit = 50 } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (keyword) {
      conditions.push(`(part_name ILIKE $${paramIndex} OR part_code ILIKE $${paramIndex})`);
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (category) {
      conditions.push(`category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT sp.*, 
        COALESCE(SUM(i.available_quantity), 0) as total_available,
        COALESCE(SUM(i.locked_quantity), 0) as total_locked
       FROM spare_parts sp
       LEFT JOIN inventory i ON sp.id = i.part_id
       ${whereClause}
       GROUP BY sp.id
       ORDER BY sp.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, Number(limit), offset]
    );

    res.json({ parts: result.rows });
  } catch (err) {
    console.error("Get parts error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

partsRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT * FROM spare_parts WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Part not found" });
    }

    res.json({ part: result.rows[0] });
  } catch (err) {
    console.error("Get part error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

partsRouter.post("/", requireRole("supervisor", "warehouse"), async (req, res) => {
  try {
    const { part_code, part_name, category, specification, unit, price, deposit_ratio, photo_url, description } = req.body;

    const result = await pool.query(
      `INSERT INTO spare_parts 
       (part_code, part_name, category, specification, unit, price, deposit_ratio, photo_url, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [part_code, part_name, category, specification, unit || "个", price, deposit_ratio || 1.0, photo_url, description]
    );

    await logAction(req, {
      action: "create_part",
      resourceType: "spare_part",
      resourceId: result.rows[0].id,
      newValue: result.rows[0],
    });

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error("Create part error:", err);
    if (err.code === "23505") {
      return res.status(400).json({ error: "Part code already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});
