import { Router } from "express";
import { z } from "zod";
import { pool, withTransaction } from "../db.js";
import { requireRole, getCurrentUser, getUserId } from "../middleware/auth.js";
import { logAction } from "../audit.js";
import { lockInventory, confirmInventoryOutbound, unlockInventory, returnInventory } from "../inventory-service.js";
import { notifyUser } from "../queue.js";
import type { BorrowOrderStatus } from "../../app/types/index.js";

export const borrowOrdersRouter = Router();

borrowOrdersRouter.use((req, res, next) => {
  const user = getCurrentUser(req);
  if (user?.role === "finance") {
    return res.status(403).json({ error: "Forbidden: Finance can only access finance endpoints" });
  }
  next();
});

const createSchema = z.object({
  part_id: z.string().uuid(),
  inventory_id: z.string().uuid().optional(),
  quantity: z.number().int().min(1),
  expected_return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  work_order_no: z.string().optional(),
  customer_machine_no: z.string().optional(),
  customer_name: z.string().optional(),
  borrow_reason: z.string().min(1),
});

borrowOrdersRouter.get("/", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { status, page = 1, limit = 20, view = "default" } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (user.role === "engineer") {
      conditions.push(`bo.applicant_id = $${paramIndex++}`);
      params.push(user.id);
    }

    if (status && status !== "all") {
      conditions.push(`bo.status = $${paramIndex++}`);
      params.push(status);
    }

    if (view === "today") {
      conditions.push(`bo.expected_return_date = CURRENT_DATE AND bo.status IN ('picked', 'extended')`);
    } else if (view === "overdue") {
      conditions.push(`bo.expected_return_date < CURRENT_DATE AND bo.status IN ('picked', 'extended')`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT bo.*, sp.part_name, sp.part_code, u.real_name as applicant_name,
              sup.real_name as supervisor_name
       FROM borrow_orders bo
       JOIN spare_parts sp ON bo.part_id = sp.id
       JOIN users u ON bo.applicant_id = u.id
       LEFT JOIN users sup ON bo.supervisor_id = sup.id
       ${whereClause}
       ORDER BY bo.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, Number(limit), offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM borrow_orders bo ${whereClause}`,
      params
    );

    res.json({
      orders: result.rows,
      total: Number(countResult.rows[0].count),
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

borrowOrdersRouter.get("/:id", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;

    const result = await pool.query(
      `SELECT bo.*, sp.part_name, sp.part_code, sp.photo_url, sp.price, sp.deposit_ratio,
              sp.specification, u.real_name as applicant_name, u.email as applicant_email,
              sup.real_name as supervisor_name, inv.batch_no, inv.location
       FROM borrow_orders bo
       JOIN spare_parts sp ON bo.part_id = sp.id
       JOIN users u ON bo.applicant_id = u.id
       LEFT JOIN users sup ON bo.supervisor_id = sup.id
       LEFT JOIN inventory inv ON bo.inventory_id = inv.id
       WHERE bo.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = result.rows[0];

    if (user.role === "engineer" && order.applicant_id !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const [returnRecords, extensions, deposits] = await Promise.all([
      pool.query(
        `SELECT rr.*, u.real_name as inspector_name, w.real_name as warehouse_name
         FROM return_records rr
         LEFT JOIN users u ON rr.inspector_id = u.id
         LEFT JOIN users w ON rr.warehouse_operator_id = w.id
         WHERE rr.borrow_order_id = $1
         ORDER BY rr.created_at DESC`,
        [id]
      ),
      pool.query(
        `SELECT er.*, u.real_name as approver_name
         FROM extension_records er
         LEFT JOIN users u ON er.approver_id = u.id
         WHERE er.borrow_order_id = $1
         ORDER BY er.created_at DESC`,
        [id]
      ),
      pool.query(
        `SELECT dt.*, u.real_name as operator_name
         FROM deposit_transactions dt
         LEFT JOIN users u ON dt.operator_id = u.id
         WHERE dt.borrow_order_id = $1
         ORDER BY dt.created_at DESC`,
        [id]
      ),
    ]);

    res.json({
      order,
      return_records: returnRecords.rows,
      extension_records: extensions.rows,
      deposit_transactions: deposits.rows,
    });
  } catch (err) {
    console.error("Get order detail error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

borrowOrdersRouter.post("/", requireRole("engineer", "supervisor"), async (req, res) => {
  try {
    const user = getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }

    const { part_id, inventory_id, quantity, expected_return_date, 
            work_order_no, customer_machine_no, customer_name, borrow_reason } = parsed.data;

    const partResult = await pool.query(
      `SELECT price, deposit_ratio FROM spare_parts WHERE id = $1`,
      [part_id]
    );
    if (partResult.rows.length === 0) {
      return res.status(404).json({ error: "Part not found" });
    }

    const part = partResult.rows[0];
    const depositAmount = part.price * part.deposit_ratio * quantity;

    const orderNo = `BO${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const inventoryData = inventory_id 
      ? await pool.query(`SELECT batch_no FROM inventory WHERE id = $1`, [inventory_id])
      : { rows: [] };
    const batchNo = inventoryData.rows[0]?.batch_no;

    const result = await pool.query(
      `INSERT INTO borrow_orders 
       (order_no, applicant_id, part_id, inventory_id, batch_no, quantity, 
        expected_return_date, work_order_no, customer_machine_no, customer_name,
        borrow_reason, deposit_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [orderNo, user.id, part_id, inventory_id || null, batchNo || null, quantity,
       expected_return_date, work_order_no, customer_machine_no, customer_name,
       borrow_reason, depositAmount]
    );

    const order = result.rows[0];

    await logAction(req, {
      userId: user.id,
      action: "create_order",
      resourceType: "borrow_order",
      resourceId: order.id,
      newValue: order,
    });

    const supervisors = await pool.query(
      `SELECT id FROM users WHERE role = 'supervisor' AND region = $1`,
      [user.region]
    );
    for (const sup of supervisors.rows) {
      await notifyUser(
        sup.id,
        "新的借用申请待审批",
        `${user.real_name} 提交了新的备件借用申请，单号：${orderNo}`,
        order.id
      );
    }

    res.status(201).json(order);
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

borrowOrdersRouter.post("/:id/approve", requireRole("supervisor"), async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { id } = req.params;

    const result = await withTransaction(async (client) => {
      const orderResult = await client.query(
        `SELECT * FROM borrow_orders WHERE id = $1 FOR UPDATE`,
        [id]
      );

      if (orderResult.rows.length === 0) {
        throw new Error("Order not found");
      }

      const order = orderResult.rows[0];
      if (order.status !== "pending") {
        throw new Error("Order cannot be approved");
      }

      let inventoryId = order.inventory_id;
      let batchNo = order.batch_no;

      if (!inventoryId) {
        const invResult = await client.query(
          `SELECT id, batch_no FROM inventory 
           WHERE part_id = $1 AND available_quantity >= $2
           ORDER BY created_at ASC LIMIT 1 FOR UPDATE`,
          [order.part_id, order.quantity]
        );

        if (invResult.rows.length === 0) {
          throw new Error("Insufficient inventory");
        }

        inventoryId = invResult.rows[0].id;
        batchNo = invResult.rows[0].batch_no;
      } else {
        const invResult = await client.query(
          `SELECT id, available_quantity FROM inventory WHERE id = $1 FOR UPDATE`,
          [inventoryId]
        );

        if (invResult.rows.length === 0) {
          throw new Error("Inventory not found");
        }

        if (invResult.rows[0].available_quantity < order.quantity) {
          throw new Error("Insufficient inventory");
        }
      }

      await client.query(
        `UPDATE inventory 
         SET available_quantity = available_quantity - $1,
             locked_quantity = locked_quantity + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [order.quantity, inventoryId]
      );

      const updateResult = await client.query(
        `UPDATE borrow_orders 
         SET status = 'approved', supervisor_id = $1, inventory_id = $2, batch_no = $3,
             deposit_status = 'frozen', updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [user!.id, inventoryId, batchNo, id]
      );

      await client.query(
        `INSERT INTO deposit_transactions (borrow_order_id, transaction_type, amount, operator_id, remark)
         VALUES ($1, 'freeze', $2, $3, '审批通过，冻结押金')`,
        [id, order.deposit_amount, user!.id]
      );

      return updateResult.rows[0];
    });

    await logAction(req, {
      userId: user!.id,
      action: "approve_order",
      resourceType: "borrow_order",
      resourceId: id,
      newValue: { status: "approved" },
    });

    await notifyUser(
      result.applicant_id,
      "借用申请已批准",
      `您的借用申请 ${result.order_no} 已批准，请前往仓库领取备件`,
      id
    );

    res.json(result);
  } catch (err: any) {
    console.error("Approve order error:", err);
    res.status(400).json({ error: err.message });
  }
});

borrowOrdersRouter.post("/:id/reject", requireRole("supervisor"), async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { id } = req.params;
    const { reason } = req.body;

    const result = await pool.query(
      `UPDATE borrow_orders 
       SET status = 'rejected', supervisor_id = $1, rejection_reason = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND status = 'pending'
       RETURNING *`,
      [user!.id, reason, id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Order cannot be rejected" });
    }

    await logAction(req, {
      userId: user!.id,
      action: "reject_order",
      resourceType: "borrow_order",
      resourceId: id,
      newValue: { status: "rejected", reason },
    });

    await notifyUser(
      result.rows[0].applicant_id,
      "借用申请被拒绝",
      `您的借用申请 ${result.rows[0].order_no} 被拒绝，原因：${reason}`,
      id
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Reject order error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

borrowOrdersRouter.post("/:id/pickup", requireRole("warehouse"), async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { id } = req.params;

    const result = await withTransaction(async (client) => {
      const orderResult = await client.query(
        `SELECT * FROM borrow_orders WHERE id = $1 FOR UPDATE`,
        [id]
      );

      if (orderResult.rows.length === 0) {
        throw new Error("Order not found");
      }

      const order = orderResult.rows[0];
      if (order.status !== "approved") {
        throw new Error("Order cannot be picked up");
      }

      if (!order.inventory_id) {
        throw new Error("Inventory not assigned");
      }

      await confirmInventoryOutbound(order.inventory_id, order.quantity, client);

      const updateResult = await client.query(
        `UPDATE borrow_orders 
         SET status = 'picked', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      return updateResult.rows[0];
    });

    await logAction(req, {
      userId: user!.id,
      action: "pickup_order",
      resourceType: "borrow_order",
      resourceId: id,
      newValue: { status: "picked" },
    });

    res.json(result);
  } catch (err: any) {
    console.error("Pickup order error:", err);
    res.status(400).json({ error: err.message });
  }
});

borrowOrdersRouter.post("/:id/extend", requireRole("engineer", "supervisor"), async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { id } = req.params;
    const { new_return_date, reason } = req.body;

    const orderResult = await pool.query(
      `SELECT * FROM borrow_orders WHERE id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult.rows[0];

    if (user!.role === "engineer" && order.applicant_id !== user!.id) {
      return res.status(403).json({ error: "Forbidden: You can only extend your own orders" });
    }

    if (!["picked", "extended"].includes(order.status)) {
      return res.status(400).json({ error: "Order cannot be extended" });
    }

    const extensionResult = await pool.query(
      `INSERT INTO extension_records 
       (borrow_order_id, original_return_date, new_return_date, reason)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, order.expected_return_date, new_return_date, reason]
    );

    if (user!.role === "supervisor") {
      await pool.query(
        `UPDATE borrow_orders 
         SET expected_return_date = $1, status = 'extended', updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [new_return_date, id]
      );

      await pool.query(
        `UPDATE extension_records 
         SET approver_id = $1, approved = true
         WHERE id = $2`,
        [user!.id, extensionResult.rows[0].id]
      );

      await notifyUser(
        order.applicant_id,
        "延期已批准",
        `您的借用单 ${order.order_no} 延期已批准，新的归还日期：${new_return_date}`,
        id
      );
    } else {
      const supervisors = await pool.query(
        `SELECT id FROM users WHERE role = 'supervisor'`
      );
      for (const sup of supervisors.rows) {
        await notifyUser(
          sup.id,
          "延期申请待审批",
          `${user!.real_name} 申请延期借用单 ${order.order_no}`,
          id
        );
      }
    }

    await logAction(req, {
      userId: user!.id,
      action: "extend_order",
      resourceType: "borrow_order",
      resourceId: id,
      newValue: { new_return_date, reason },
    });

    res.json(extensionResult.rows[0]);
  } catch (err) {
    console.error("Extend order error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const returnSchema = z.object({
  returned_quantity: z.number().int().min(0),
  damaged_quantity: z.number().int().min(0).default(0),
  lost_quantity: z.number().int().min(0).default(0),
  inspection_result: z.string().optional(),
  photos: z.array(z.string()).optional(),
});

borrowOrdersRouter.post("/:id/return", requireRole("warehouse", "supervisor"), async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { id } = req.params;

    const parsed = returnSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }

    const { returned_quantity, damaged_quantity, lost_quantity, inspection_result, photos } = parsed.data;

    const result = await withTransaction(async (client) => {
      const orderResult = await client.query(
        `SELECT * FROM borrow_orders WHERE id = $1 FOR UPDATE`,
        [id]
      );

      if (orderResult.rows.length === 0) {
        throw new Error("Order not found");
      }

      const order = orderResult.rows[0];
      const totalReturned = returned_quantity + damaged_quantity + lost_quantity;

      if (totalReturned !== order.quantity) {
        throw new Error("Total returned quantity must match borrowed quantity");
      }

      if (order.inventory_id && returned_quantity > 0) {
        await returnInventory(order.inventory_id, returned_quantity, client);
      }

      let newStatus: BorrowOrderStatus = "returned";
      let damageAmount = 0;

      if (damaged_quantity > 0 || lost_quantity > 0) {
        const partResult = await client.query(
          `SELECT price FROM spare_parts WHERE id = $1`,
          [order.part_id]
        );
        const unitPrice = partResult.rows[0].price;
        damageAmount = (damaged_quantity + lost_quantity) * unitPrice;
        newStatus = lost_quantity > 0 ? "lost" : "damaged";
      }

      await client.query(
        `UPDATE borrow_orders 
         SET status = $1, actual_return_date = CURRENT_DATE, damage_amount = $2,
             deposit_status = CASE WHEN $3 > 0 THEN 'deducted' ELSE 'refunded' END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [newStatus, damageAmount, damageAmount, id]
      );

      if (damageAmount > 0) {
        await client.query(
          `INSERT INTO deposit_transactions (borrow_order_id, transaction_type, amount, operator_id, remark)
           VALUES ($1, 'deduct', $2, $3, $4)`,
          [id, damageAmount, user!.id, `损坏/丢失赔付：${damaged_quantity}个损坏，${lost_quantity}个丢失`]
        );
      } else {
        await client.query(
          `INSERT INTO deposit_transactions (borrow_order_id, transaction_type, amount, operator_id, remark)
           VALUES ($1, 'unfreeze', $2, $3, '归还验收通过，解冻押金')`,
          [id, order.deposit_amount, user!.id]
        );
      }

      const returnRecord = await client.query(
        `INSERT INTO return_records 
         (borrow_order_id, returned_quantity, damaged_quantity, lost_quantity, 
          inspection_result, inspector_id, warehouse_operator_id, photos)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [id, returned_quantity, damaged_quantity, lost_quantity, 
         inspection_result, user!.role === "supervisor" ? user!.id : null, 
         user!.id, photos || []]
      );

      return returnRecord.rows[0];
    });

    await logAction(req, {
      userId: user!.id,
      action: "return_order",
      resourceType: "borrow_order",
      resourceId: id,
      newValue: parsed.data,
    });

    res.json(result);
  } catch (err: any) {
    console.error("Return order error:", err);
    res.status(400).json({ error: err.message });
  }
});
