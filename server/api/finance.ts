import { Router } from "express";
import ExcelJS from "exceljs";
import { pool } from "../db.js";
import { requireRole, getCurrentUser } from "../middleware/auth.js";
import { logAction } from "../audit.js";

export const financeRouter = Router();

financeRouter.get("/deposits", requireRole("finance", "supervisor"), async (req, res) => {
  try {
    const { status, start_date, end_date, page = 1, limit = 50 } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (status && status !== "all") {
      conditions.push(`bo.deposit_status = $${paramIndex++}`);
      params.push(status);
    }

    if (start_date) {
      conditions.push(`bo.created_at >= $${paramIndex++}`);
      params.push(start_date);
    }

    if (end_date) {
      conditions.push(`bo.created_at <= $${paramIndex++}`);
      params.push(end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT bo.id, bo.order_no, bo.deposit_amount, bo.deposit_status, bo.damage_amount,
              bo.created_at, sp.part_name, u.real_name as applicant_name
       FROM borrow_orders bo
       JOIN spare_parts sp ON bo.part_id = sp.id
       JOIN users u ON bo.applicant_id = u.id
       ${whereClause}
       ORDER BY bo.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, Number(limit), offset]
    );

    const statsResult = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN deposit_status = 'frozen' THEN deposit_amount ELSE 0 END), 0) as total_frozen,
        COALESCE(SUM(CASE WHEN deposit_status = 'deducted' THEN deposit_amount ELSE 0 END), 0) as total_deducted,
        COALESCE(SUM(CASE WHEN deposit_status = 'refunded' THEN deposit_amount ELSE 0 END), 0) as total_refunded,
        COALESCE(SUM(damage_amount), 0) as total_damage
       FROM borrow_orders bo
       ${whereClause}`,
      params
    );

    res.json({
      deposits: result.rows,
      stats: statsResult.rows[0],
      total: result.rows.length,
    });
  } catch (err) {
    console.error("Get deposits error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

financeRouter.get("/transactions", requireRole("finance", "supervisor"), async (req, res) => {
  try {
    const { type, start_date, end_date, page = 1, limit = 50 } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (type && type !== "all") {
      conditions.push(`dt.transaction_type = $${paramIndex++}`);
      params.push(type);
    }

    if (start_date) {
      conditions.push(`dt.created_at >= $${paramIndex++}`);
      params.push(start_date);
    }

    if (end_date) {
      conditions.push(`dt.created_at <= $${paramIndex++}`);
      params.push(end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT dt.*, bo.order_no, u.real_name as operator_name
       FROM deposit_transactions dt
       JOIN borrow_orders bo ON dt.borrow_order_id = bo.id
       LEFT JOIN users u ON dt.operator_id = u.id
       ${whereClause}
       ORDER BY dt.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, Number(limit), offset]
    );

    res.json({ transactions: result.rows });
  } catch (err) {
    console.error("Get transactions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

financeRouter.get("/export", requireRole("finance", "supervisor"), async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { start_date, end_date } = req.query;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (start_date) {
      conditions.push(`bo.created_at >= $${paramIndex++}`);
      params.push(start_date);
    }
    if (end_date) {
      conditions.push(`bo.created_at <= $${paramIndex++}`);
      params.push(end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT bo.order_no, u.real_name as applicant_name, sp.part_name, sp.part_code,
              bo.quantity, bo.deposit_amount, bo.deposit_status, bo.damage_amount,
              bo.status, bo.created_at, bo.expected_return_date, bo.actual_return_date
       FROM borrow_orders bo
       JOIN spare_parts sp ON bo.part_id = sp.id
       JOIN users u ON bo.applicant_id = u.id
       ${whereClause}
       ORDER BY bo.created_at DESC`,
      params
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("对账明细");

    worksheet.columns = [
      { header: "借用单号", key: "order_no", width: 20 },
      { header: "借用人", key: "applicant_name", width: 12 },
      { header: "备件编码", key: "part_code", width: 15 },
      { header: "备件名称", key: "part_name", width: 20 },
      { header: "数量", key: "quantity", width: 8 },
      { header: "押金金额", key: "deposit_amount", width: 12 },
      { header: "押金状态", key: "deposit_status", width: 12 },
      { header: "赔付金额", key: "damage_amount", width: 12 },
      { header: "单据状态", key: "status", width: 12 },
      { header: "申请时间", key: "created_at", width: 20 },
      { header: "预计归还", key: "expected_return_date", width: 12 },
      { header: "实际归还", key: "actual_return_date", width: 12 },
    ];

    const statusMap: Record<string, string> = {
      pending: "待审批", approved: "已批准", rejected: "已拒绝",
      picked: "已领取", extended: "已延期", returned: "已归还",
      damaged: "有损坏", lost: "已丢失",
    };

    const depositStatusMap: Record<string, string> = {
      unfrozen: "未冻结", frozen: "已冻结", deducted: "已扣除", refunded: "已退还",
    };

    for (const row of result.rows) {
      worksheet.addRow({
        ...row,
        deposit_status: depositStatusMap[row.deposit_status] || row.deposit_status,
        status: statusMap[row.status] || row.status,
        created_at: new Date(row.created_at).toLocaleString("zh-CN"),
      });
    }

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };

    await logAction(req, {
      userId: user!.id,
      action: "export_finance",
      resourceType: "finance",
      newValue: { start_date, end_date },
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="对账明细_${new Date().toISOString().split("T")[0]}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
