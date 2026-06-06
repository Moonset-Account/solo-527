const db = require('../db');
const { logger, logAudit } = require('../utils/logger');
const { AppError, ValidationError, NotFoundError } = require('../middleware/error');

async function getReturnRecords(req, res, next) {
  try {
    const { status, startDate, endDate, page = 1, pageSize = 20 } = req.query;
    
    let query = `
      SELECT r.*, p.package_no, p.package_name, p.patient_name,
             u1.real_name as returned_by_name,
             u2.real_name as received_by_name,
             u3.real_name as checked_by_name
      FROM return_records r
      LEFT JOIN package_preparations p ON r.package_id = p.id
      LEFT JOIN users u1 ON r.returned_by = u1.id
      LEFT JOIN users u2 ON r.received_by = u2.id
      LEFT JOIN users u3 ON r.checked_by = u3.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND r.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND r.return_time >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND r.return_time <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY r.return_time DESC`;

    const offset = (page - 1) * pageSize;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(pageSize), parseInt(offset));

    const result = await db.query(query, params);
    const countResult = await db.query('SELECT COUNT(*) FROM return_records');

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

async function getReturnRecordById(req, res, next) {
  try {
    const { id } = req.params;
    
    const returnResult = await db.query(`
      SELECT r.*, p.package_no, p.package_name, p.patient_name,
             u1.real_name as returned_by_name,
             u2.real_name as received_by_name,
             u3.real_name as checked_by_name
      FROM return_records r
      LEFT JOIN package_preparations p ON r.package_id = p.id
      LEFT JOIN users u1 ON r.returned_by = u1.id
      LEFT JOIN users u2 ON r.received_by = u2.id
      LEFT JOIN users u3 ON r.checked_by = u3.id
      WHERE r.id = $1
    `, [id]);

    if (returnResult.rows.length === 0) {
      throw new NotFoundError('退包记录不存在');
    }

    const itemsResult = await db.query(`
      SELECT ri.*, si.item_name, si.item_code, si.specification, si.unit,
             sb.batch_no, sb.expiry_date
      FROM return_items ri
      LEFT JOIN supply_items si ON ri.supply_item_id = si.id
      LEFT JOIN supply_batches sb ON ri.batch_id = sb.id
      WHERE ri.return_id = $1
      ORDER BY ri.created_at
    `, [id]);

    res.json({
      success: true,
      data: {
        ...returnResult.rows[0],
        items: itemsResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function createReturnRecord(req, res, next) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { packageId, returnReason, returnReasonDetail, items, remarks } = req.body;

    if (!packageId || !returnReason || !items || items.length === 0) {
      throw new ValidationError('请填写必填项并选择退回耗材');
    }

    const packageResult = await client.query('SELECT * FROM package_preparations WHERE id = $1', [packageId]);
    if (packageResult.rows.length === 0) {
      throw new NotFoundError('备包记录不存在');
    }

    const returnNo = `RET${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    const returnResult = await client.query(`
      INSERT INTO return_records 
      (return_no, package_id, returned_by, returned_by_name, return_reason, return_reason_detail, remarks, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *
    `, [returnNo, packageId, req.user.id, req.user.realName, returnReason, returnReasonDetail, remarks]);

    const returnId = returnResult.rows[0].id;

    for (const item of items) {
      const packageItemResult = await client.query('SELECT * FROM package_items WHERE id = $1 AND package_id = $2', [item.packageItemId, packageId]);
      if (packageItemResult.rows.length === 0) {
        throw new NotFoundError('备包明细不存在');
      }
      const packageItem = packageItemResult.rows[0];

      const maxReturnable = (packageItem.quantity_prepared || 0) - (packageItem.quantity_used || 0) - (packageItem.quantity_returned || 0);
      if (item.quantityReturned > maxReturnable) {
        throw new ValidationError(`退回数量超过可退数量，最大可退: ${maxReturnable}`);
      }

      await client.query(`
        INSERT INTO return_items 
        (return_id, package_item_id, supply_item_id, batch_id, quantity_returned, condition, is_restockable, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [returnId, item.packageItemId, packageItem.supply_item_id, packageItem.batch_id, 
          item.quantityReturned, item.condition || 'good', item.isRestockable !== false, item.notes]);

      await client.query(`
        UPDATE package_items 
        SET quantity_returned = COALESCE(quantity_returned, 0) + $1,
            status = CASE 
              WHEN COALESCE(quantity_used, 0) + COALESCE(quantity_returned, 0) + $1 >= quantity_prepared THEN 'returned'
              ELSE status
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [item.quantityReturned, item.packageItemId]);
    }

    await logAudit(req.user.id, req.user.realName, 'create_return', 'return', 'return_record', returnId, null, returnResult.rows[0], req);

    await client.query('COMMIT');
    res.json({ success: true, data: returnResult.rows[0], message: '退包记录创建成功' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

async function checkReturnRecord(req, res, next) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { passed, checkNotes } = req.body;

    const returnResult = await client.query('SELECT * FROM return_records WHERE id = $1', [id]);
    if (returnResult.rows.length === 0) {
      throw new NotFoundError('退包记录不存在');
    }

    if (returnResult.rows[0].status !== 'pending') {
      throw new ValidationError('退包记录状态不允许核验');
    }

    const itemsResult = await client.query('SELECT * FROM return_items WHERE return_id = $1', [id]);

    for (const item of itemsResult.rows) {
      if (item.is_restockable && item.condition === 'good') {
        const batchResult = await client.query('SELECT * FROM supply_batches WHERE id = $1', [item.batch_id]);
        if (batchResult.rows.length > 0) {
          const batch = batchResult.rows[0];
          if (batch.expiry_date >= new Date()) {
            await client.query(`
              UPDATE supply_batches 
              SET quantity = quantity + $1, status = CASE WHEN quantity = 0 AND $1 > 0 THEN 'normal' ELSE status END, updated_at = CURRENT_TIMESTAMP
              WHERE id = $2
            `, [item.quantity_returned, item.batch_id]);

            const ledgerNo = `LED${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
            await client.query(`
              INSERT INTO inventory_ledger 
              (ledger_no, transaction_type, supply_item_id, batch_id, quantity, unit_price, total_amount,
               reference_type, reference_id, reference_no, operator_id, operator_name, remarks)
              VALUES ($1, 'return_in', $2, $3, $4, $5, $6, 'return', $7, $8, $9, $10, $11)
            `, [
              ledgerNo, item.supply_item_id, item.batch_id, item.quantity_returned,
              batch.unit_price, item.quantity_returned * (batch.unit_price || 0),
              id, returnResult.rows[0].return_no, req.user.id, req.user.realName, '退包回库'
            ]);
          }
        }
      }
    }

    const result = await client.query(`
      UPDATE return_records 
      SET status = CASE WHEN $1 THEN 'completed' ELSE 'checked' END, 
          checked_by = $2, checked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [passed !== false, req.user.id, id]);

    const packageResult = await client.query('SELECT * FROM package_preparations WHERE id = $1', [returnResult.rows[0].package_id]);
    if (packageResult.rows.length > 0) {
      const pkg = packageResult.rows[0];
      if (pkg.status === 'used' || pkg.status === 'distributed') {
        await client.query(`
          UPDATE package_preparations SET status = 'returned', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1 AND NOT EXISTS (
            SELECT 1 FROM package_items 
            WHERE package_id = $1 AND status NOT IN ('used', 'returned')
          )
        `, [returnResult.rows[0].package_id]);
      }
    }

    await logAudit(req.user.id, req.user.realName, 'check_return', 'return', 'return_record', id, returnResult.rows[0], result.rows[0], req);

    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0], message: '退包核验完成' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

module.exports = {
  getReturnRecords,
  getReturnRecordById,
  createReturnRecord,
  checkReturnRecord,
};
