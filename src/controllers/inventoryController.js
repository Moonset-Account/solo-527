const db = require('../db');
const { logger, logAudit } = require('../utils/logger');
const { AppError, ValidationError, NotFoundError } = require('../middleware/error');

async function getSupplyItems(req, res, next) {
  try {
    const { keyword, category, isHighValue, page = 1, pageSize = 20 } = req.query;
    
    let query = `
      SELECT si.*, 
             COALESCE((SELECT SUM(quantity) FROM supply_batches WHERE supply_item_id = si.id AND status = 'normal' AND expiry_date > CURRENT_DATE), 0) as current_stock
      FROM supply_items si
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (keyword) {
      query += ` AND (si.item_name ILIKE $${paramIndex} OR si.item_code ILIKE $${paramIndex})`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (category) {
      query += ` AND si.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (isHighValue !== undefined) {
      query += ` AND si.is_high_value = $${paramIndex}`;
      params.push(isHighValue === 'true' || isHighValue === true);
      paramIndex++;
    }

    query += ` ORDER BY si.created_at DESC`;

    const offset = (page - 1) * pageSize;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(pageSize), parseInt(offset));

    const result = await db.query(query, params);
    const countResult = await db.query('SELECT COUNT(*) FROM supply_items');

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

async function getSupplyItemById(req, res, next) {
  try {
    const { id } = req.params;
    
    const result = await db.query('SELECT * FROM supply_items WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw new NotFoundError('耗材不存在');
    }

    const batchesResult = await db.query(`
      SELECT * FROM supply_batches 
      WHERE supply_item_id = $1
      ORDER BY expiry_date ASC
    `, [id]);

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        batches: batchesResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getBatches(req, res, next) {
  try {
    const { supplyItemId, status, expiryStart, expiryEnd, page = 1, pageSize = 20 } = req.query;
    
    let query = `
      SELECT sb.*, si.item_name, si.item_code, si.specification, si.unit, si.is_high_value
      FROM supply_batches sb
      LEFT JOIN supply_items si ON sb.supply_item_id = si.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (supplyItemId) {
      query += ` AND sb.supply_item_id = $${paramIndex}`;
      params.push(supplyItemId);
      paramIndex++;
    }

    if (status) {
      query += ` AND sb.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (expiryStart) {
      query += ` AND sb.expiry_date >= $${paramIndex}`;
      params.push(expiryStart);
      paramIndex++;
    }

    if (expiryEnd) {
      query += ` AND sb.expiry_date <= $${paramIndex}`;
      params.push(expiryEnd);
      paramIndex++;
    }

    query += ` ORDER BY sb.expiry_date ASC`;

    const offset = (page - 1) * pageSize;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(pageSize), parseInt(offset));

    const result = await db.query(query, params);

    let countQuery = 'SELECT COUNT(*) FROM supply_batches WHERE 1=1';
    const countParams = [];
    if (supplyItemId) {
      countQuery += ' AND supply_item_id = $1';
      countParams.push(supplyItemId);
    }
    const countResult = await db.query(countQuery, countParams);

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

async function createBatch(req, res, next) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const {
      supplyItemId, batchNo, quantity, unitPrice, manufactureDate,
      expiryDate, receivedDate, supplier, certificateNo, location
    } = req.body;

    if (!supplyItemId || !batchNo || !quantity || !expiryDate) {
      throw new ValidationError('请填写必填项');
    }

    const existingBatch = await client.query(
      'SELECT COUNT(*) FROM supply_batches WHERE batch_no = $1 AND supply_item_id = $2',
      [batchNo, supplyItemId]
    );

    if (parseInt(existingBatch.rows[0].count) > 0) {
      throw new ValidationError('该批号已存在');
    }

    const expiry = new Date(expiryDate);
    const now = new Date();
    let status = 'normal';
    if (expiry < now) {
      status = 'expired';
    }

    const result = await client.query(`
      INSERT INTO supply_batches 
      (batch_no, supply_item_id, quantity, unit_price, manufacture_date, 
       expiry_date, received_date, supplier, certificate_no, location, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [batchNo, supplyItemId, quantity, unitPrice, manufactureDate,
        expiryDate, receivedDate || new Date().toISOString().split('T')[0], supplier, certificateNo, location, status]);

    if (status === 'normal' && quantity > 0) {
      const ledgerNo = `LED${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      await client.query(`
        INSERT INTO inventory_ledger 
        (ledger_no, transaction_type, supply_item_id, batch_id, quantity, unit_price, total_amount,
         reference_type, reference_no, operator_id, operator_name, remarks)
        VALUES ($1, 'purchase_in', $2, $3, $4, $5, $6, 'batch', $7, $8, $9, $10)
      `, [
        ledgerNo, supplyItemId, result.rows[0].id, quantity,
        unitPrice, quantity * (unitPrice || 0),
        batchNo, req.user.id, req.user.realName, '采购入库'
      ]);
    }

    await logAudit(req.user.id, req.user.realName, 'create_batch', 'inventory', 'supply_batch', result.rows[0].id, null, result.rows[0], req);

    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0], message: '批次创建成功' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

async function verifyBatch(req, res, next) {
  try {
    const { batchNo, supplyItemId } = req.params;

    let query = `
      SELECT sb.*, si.item_name, si.item_code, si.specification, si.unit, si.is_high_value, si.requires_scan
      FROM supply_batches sb
      JOIN supply_items si ON sb.supply_item_id = si.id
      WHERE sb.batch_no = $1
    `;
    const params = [batchNo];

    if (supplyItemId) {
      query += ` AND sb.supply_item_id = $2`;
      params.push(supplyItemId);
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.json({ 
        success: false, 
        valid: false,
        message: '批号不存在' 
      });
    }

    const batch = result.rows[0];
    const now = new Date();
    const expiryDate = new Date(batch.expiry_date);
    const isExpired = expiryDate < now;
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      valid: !isExpired && batch.status === 'normal' && batch.quantity > 0,
      data: {
        ...batch,
        isExpired,
        daysUntilExpiry,
        canUse: !isExpired && batch.status === 'normal' && batch.quantity > 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getInventoryLedger(req, res, next) {
  try {
    const { supplyItemId, transactionType, startDate, endDate, page = 1, pageSize = 20 } = req.query;
    
    let query = `
      SELECT il.*, si.item_name, si.item_code, si.unit,
             sb.batch_no,
             ors.room_name
      FROM inventory_ledger il
      LEFT JOIN supply_items si ON il.supply_item_id = si.id
      LEFT JOIN supply_batches sb ON il.batch_id = sb.id
      LEFT JOIN operating_rooms ors ON il.operating_room_id = ors.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (supplyItemId) {
      query += ` AND il.supply_item_id = $${paramIndex}`;
      params.push(supplyItemId);
      paramIndex++;
    }

    if (transactionType) {
      query += ` AND il.transaction_type = $${paramIndex}`;
      params.push(transactionType);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND il.transaction_time >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND il.transaction_time <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY il.transaction_time DESC`;

    const offset = (page - 1) * pageSize;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(pageSize), parseInt(offset));

    const result = await db.query(query, params);
    const countResult = await db.query('SELECT COUNT(*) FROM inventory_ledger');

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

async function getStockAlerts(req, res, next) {
  try {
    const { alertType, isResolved, page = 1, pageSize = 20 } = req.query;
    
    let query = `
      SELECT sa.*, si.item_name, si.item_code, si.specification, si.unit
      FROM stock_alerts sa
      LEFT JOIN supply_items si ON sa.supply_item_id = si.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (alertType) {
      query += ` AND sa.alert_type = $${paramIndex}`;
      params.push(alertType);
      paramIndex++;
    }

    if (isResolved !== undefined) {
      query += ` AND sa.is_resolved = $${paramIndex}`;
      params.push(isResolved === 'true');
      paramIndex++;
    }

    query += ` ORDER BY sa.created_at DESC`;

    const offset = (page - 1) * pageSize;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(pageSize), parseInt(offset));

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

async function getOperatingRooms(req, res, next) {
  try {
    const result = await db.query(`
      SELECT * FROM operating_rooms 
      ORDER BY room_code
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
}

async function getSurgeryTypes(req, res, next) {
  try {
    const result = await db.query(`
      SELECT st.*, pt.id as default_package_id, pt.template_name, pt.template_code
      FROM surgery_types st
      LEFT JOIN package_templates pt ON st.default_package_id = pt.id
      ORDER BY st.code
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
}

async function getPackageTemplates(req, res, next) {
  try {
    const { surgeryTypeId, isActive } = req.query;
    
    let query = `
      SELECT pt.*, st.name as surgery_type_name, st.code as surgery_type_code,
             u.real_name as created_by_name
      FROM package_templates pt
      LEFT JOIN surgery_types st ON pt.surgery_type_id = st.id
      LEFT JOIN users u ON pt.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (surgeryTypeId) {
      query += ` AND pt.surgery_type_id = $${paramIndex}`;
      params.push(surgeryTypeId);
      paramIndex++;
    }

    if (isActive !== undefined) {
      query += ` AND pt.is_active = $${paramIndex}`;
      params.push(isActive === 'true');
      paramIndex++;
    }

    query += ` ORDER BY pt.created_at DESC`;

    const result = await db.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
}

async function getPackageTemplateById(req, res, next) {
  try {
    const { id } = req.params;
    
    const templateResult = await db.query(`
      SELECT pt.*, st.name as surgery_type_name, st.code as surgery_type_code
      FROM package_templates pt
      LEFT JOIN surgery_types st ON pt.surgery_type_id = st.id
      WHERE pt.id = $1
    `, [id]);

    if (templateResult.rows.length === 0) {
      throw new NotFoundError('耗材包模板不存在');
    }

    const itemsResult = await db.query(`
      SELECT pti.*, si.item_name, si.item_code, si.specification, si.unit, si.is_high_value, si.category
      FROM package_template_items pti
      JOIN supply_items si ON pti.supply_item_id = si.id
      WHERE pti.template_id = $1
      ORDER BY pti.sort_order, pti.created_at
    `, [id]);

    res.json({
      success: true,
      data: {
        ...templateResult.rows[0],
        items: itemsResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSupplyItems,
  getSupplyItemById,
  getBatches,
  createBatch,
  verifyBatch,
  getInventoryLedger,
  getStockAlerts,
  getOperatingRooms,
  getSurgeryTypes,
  getPackageTemplates,
  getPackageTemplateById,
};
