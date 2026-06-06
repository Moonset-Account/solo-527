import { Router } from "express";
import { pool } from "../db.js";
import { requireRole } from "../middleware/auth.js";
import { logAction } from "../audit.js";

export const inventoryRouter = Router();

inventoryRouter.get("/", async (req, res) => {
  try {
    const { part_id, part_code, batch_no, page = 1, limit = 50 } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (part_id) {
      conditions.push(`i.part_id = $${paramIndex}`);
      params.push(part_id);
      paramIndex++;
    }

    if (batch_no) {
      conditions.push(`i.batch_no ILIKE $${paramIndex}`);
      params.push(`%${batch_no}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT i.*, sp.part_name, sp.part_code, sp.unit
       FROM inventory i
       JOIN spare_parts sp ON i.part_id = sp.id
       ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, Number(limit), offset]
    );

    res.json({ inventory: result.rows });
  } catch (err) {
    console.error("Get inventory error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

inventoryRouter.get("/scan/:batchNo", requireRole("warehouse"), async (req, res) => {
  try {
    const { batchNo } = req.params;
    const result = await pool.query(
      `SELECT i.*, sp.part_name, sp.part_code, sp.unit, sp.photo_url
       FROM inventory i
       JOIN spare_parts sp ON i.part_id = sp.id
       WHERE i.batch_no = $1`,
      [batchNo]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Batch not found" });
    }

    res.json({ inventory: result.rows[0] });
  } catch (err) {
    console.error("Scan inventory error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

inventoryRouter.post("/", requireRole("warehouse"), async (req, res) => {
  try {
    const { part_id, batch_no, quantity, location, expire_date } = req.body;

    const result = await pool.query(
      `INSERT INTO inventory (part_id, batch_no, quantity, available_quantity, locked_quantity, location, expire_date)
       VALUES ($1, $2, $3, $3, 0, $4, $5)
       ON CONFLICT (part_id, batch_no) 
       DO UPDATE SET 
         quantity = inventory.quantity + EXCLUDED.quantity,
         available_quantity = inventory.available_quantity + EXCLUDED.quantity,
         location = COALESCE(EXCLUDED.location, inventory.location),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [part_id, batch_no, quantity, location, expire_date || null]
    );

    await logAction(req, {
      action: "stock_in",
      resourceType: "inventory",
      resourceId: result.rows[0].id,
      newValue: { part_id, batch_no, quantity, location },
    });

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("Stock in error:", err);
    res.status(500).json({ error: err.message });
  }
});
