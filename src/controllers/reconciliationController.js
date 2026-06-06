const db = require('../db');
const { logger } = require('../utils/logger');
const { NotFoundError, ValidationError } = require('../middleware/error');

async function getReconciliations(req, res, next) {
  try {
    const { month, status, page = 1, pageSize = 20 } = req.query;
    
    let query = `
      SELECT mr.*, si.item_name, si.item_code, si.unit,
             u1.real_name as prepared_by_name,
             u2.real_name as verified_by_name
      FROM monthly_reconciliations mr
      LEFT JOIN supply_items si ON mr.supply_item_id = si.id
      LEFT JOIN users u1 ON mr.prepared_by = u1.id
      LEFT JOIN users u2 ON mr.verified_by = u2.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (month) {
      query += ` AND mr.reconciliation_month = $${paramIndex}`;
      params.push(month);
      paramIndex++;
    }

    if (status) {
      query += ` AND mr.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY mr.reconciliation_month DESC, mr.created_at DESC`;

    const offset = (page - 1) * pageSize;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(pageSize), parseInt(offset));

    const result = await db.query(query, params);
    const countResult = await db.query('SELECT COUNT(*) FROM monthly_reconciliations');

    res.json({
      success: true,
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    next(error);
  }
}

async function generateReconciliation(req, res, next) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { month } = req.body;

    if (!month) {
      throw new ValidationError('请选择对账月份');
    }

    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59);

    const supplyItems = await client.query('SELECT * FROM supply_items ORDER BY item_code');

    for (const item of supplyItems.rows) {
      const openingResult = await client.query(`
        SELECT COALESCE(SUM(quantity), 0) as total_qty,
               COALESCE(SUM(quantity * unit_price), 0) as total_amount
        FROM inventory_ledger
        WHERE supply_item_id = $1
          AND transaction_time < $2
          AND transaction_type IN ('purchase_in', 'return_in', 'adjust_in')
      `, [item.id, startDate]);

      const openingQty = parseInt(openingResult.rows[0].total_qty);
      const openingAmount = parseFloat(openingResult.rows[0].total_amount) || 0;

      const purchaseResult = await client.query(`
        SELECT COALESCE(SUM(quantity), 0) as total_qty,
               COALESCE(SUM(quantity * unit_price), 0) as total_amount
        FROM inventory_ledger
        WHERE supply_item_id = $1
          AND transaction_time >= $2
          AND transaction_time <= $3
          AND transaction_type = 'purchase_in'
      `, [item.id, startDate, endDate]);

      const usedResult = await client.query(`
        SELECT COALESCE(SUM(ABS(quantity)), 0) as total_qty,
               COALESCE(SUM(ABS(quantity * unit_price)), 0) as total_amount
        FROM inventory_ledger
        WHERE supply_item_id = $1
          AND transaction_time >= $2
          AND transaction_time <= $3
          AND transaction_type = 'prepare_out'
      `, [item.id, startDate, endDate]);

      const returnResult = await client.query(`
        SELECT COALESCE(SUM(quantity), 0) as total_qty,
               COALESCE(SUM(quantity * unit_price), 0) as total_amount
        FROM inventory_ledger
        WHERE supply_item_id = $1
          AND transaction_time >= $2
          AND transaction_time <= $3
          AND transaction_type = 'return_in'
      `, [item.id, startDate, endDate]);

      const discardResult = await client.query(`
        SELECT COALESCE(SUM(ABS(quantity)), 0) as total_qty,
               COALESCE(SUM(ABS(quantity * unit_price)), 0) as total_amount
        FROM inventory_ledger
        WHERE supply_item_id = $1
          AND transaction_time >= $2
          AND transaction_time <= $3
          AND transaction_type = 'discard_out'
      `, [item.id, startDate, endDate]);

      const closingQty = openingQty + parseInt(purchaseResult.rows[0].total_qty) 
                          - parseInt(usedResult.rows[0].total_qty) 
                          + parseInt(returnResult.rows[0].total_qty)
                          - parseInt(discardResult.rows[0].total_qty);
      const closingAmount = openingAmount + parseFloat(purchaseResult.rows[0].total_amount)
                            - parseFloat(usedResult.rows[0].total_amount)
                            + parseFloat(returnResult.rows[0].total_amount)
                            - parseFloat(discardResult.rows[0].total_amount);

      await client.query(`
        INSERT INTO monthly_reconciliations 
        (reconciliation_month, supply_item_id, 
         opening_quantity, opening_amount,
         purchase_in_quantity, purchase_in_amount,
         used_quantity, used_amount,
         returned_quantity, returned_amount,
         discarded_quantity, discarded_amount,
         closing_quantity, closing_amount,
         status, prepared_by, prepared_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'draft', $15, CURRENT_TIMESTAMP)
        ON CONFLICT (reconciliation_month, supply_item_id) 
        DO UPDATE SET
          opening_quantity = EXCLUDED.opening_quantity,
          opening_amount = EXCLUDED.opening_amount,
          purchase_in_quantity = EXCLUDED.purchase_in_quantity,
          purchase_in_amount = EXCLUDED.purchase_in_amount,
          used_quantity = EXCLUDED.used_quantity,
          used_amount = EXCLUDED.used_amount,
          returned_quantity = EXCLUDED.returned_quantity,
          returned_amount = EXCLUDED.returned_amount,
          discarded_quantity = EXCLUDED.discarded_quantity,
          discarded_amount = EXCLUDED.discarded_amount,
          closing_quantity = EXCLUDED.closing_quantity,
          closing_amount = EXCLUDED.closing_amount,
          status = 'draft',
          prepared_by = EXCLUDED.prepared_by,
          prepared_at = EXCLUDED.prepared_at,
          updated_at = CURRENT_TIMESTAMP
      `, [
        month, item.id,
        openingQty, openingAmount,
        parseInt(purchaseResult.rows[0].total_qty), parseFloat(purchaseResult.rows[0].total_amount) || 0,
        parseInt(usedResult.rows[0].total_qty), parseFloat(usedResult.rows[0].total_amount) || 0,
        parseInt(returnResult.rows[0].total_qty), parseFloat(returnResult.rows[0].total_amount) || 0,
        parseInt(discardResult.rows[0].total_qty), parseFloat(discardResult.rows[0].total_amount) || 0,
        closingQty, closingAmount,
        req.user.id
      ]);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: '月度对账数据生成成功' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

async function updateReconciliation(req, res, next) {
  try {
    const { id } = req.params;
    const { physicalQuantity, remarks } = req.body;

    const result = await db.query(`
      UPDATE monthly_reconciliations SET
        physical_quantity = $1,
        variance_quantity = $1 - closing_quantity,
        remarks = COALESCE($2, remarks),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [physicalQuantity, remarks, id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('对账记录不存在');
    }

    res.json({ success: true, data: result.rows[0], message: '对账记录更新成功' });
  } catch (error) {
    next(error);
  }
}

async function submitReconciliation(req, res, next) {
  try {
    const { month } = req.body;

    const result = await db.query(`
      UPDATE monthly_reconciliations SET
        status = 'submitted',
        updated_at = CURRENT_TIMESTAMP
      WHERE reconciliation_month = $1 AND status = 'draft'
      RETURNING *
    `, [month]);

    res.json({ 
      success: true, 
      message: `已提交 ${result.rows.length} 条对账记录`,
      count: result.rows.length
    });
  } catch (error) {
    next(error);
  }
}

async function verifyReconciliation(req, res, next) {
  try {
    const { month, verified } = req.body;

    const result = await db.query(`
      UPDATE monthly_reconciliations SET
        status = CASE WHEN $1 THEN 'verified' ELSE 'adjusted' END,
        verified_by = $2,
        verified_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE reconciliation_month = $3 AND status = 'submitted'
      RETURNING *
    `, [verified !== false, req.user.id, month]);

    res.json({ 
      success: true, 
      message: `已审核 ${result.rows.length} 条对账记录`,
      count: result.rows.length
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getReconciliations,
  generateReconciliation,
  updateReconciliation,
  submitReconciliation,
  verifyReconciliation,
};
