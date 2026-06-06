const db = require('../db');
const { logger, logAudit } = require('../utils/logger');
const { AppError, ValidationError, NotFoundError } = require('../middleware/error');
const { v4: uuidv4 } = require('uuid');

async function getPackages(req, res, next) {
  try {
    const { status, surgeryTypeId, preparerId, dateStart, dateEnd, page = 1, pageSize = 20 } = req.query;
    
    let query = `
      SELECT p.*, st.name as surgery_type_name, st.code as surgery_type_code,
             ors.room_name, ors.room_code,
             pt.template_name, pt.template_code,
             u.real_name as preparer_name,
             s.patient_name, s.surgeon_name, s.scheduled_start_time
      FROM package_preparations p
      LEFT JOIN surgery_types st ON p.surgery_type_id = st.id
      LEFT JOIN operating_rooms ors ON p.operating_room_id = ors.id
      LEFT JOIN package_templates pt ON p.template_id = pt.id
      LEFT JOIN users u ON p.preparer_id = u.id
      LEFT JOIN surgery_schedules s ON p.schedule_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (surgeryTypeId) {
      query += ` AND p.surgery_type_id = $${paramIndex}`;
      params.push(surgeryTypeId);
      paramIndex++;
    }

    if (preparerId) {
      query += ` AND p.preparer_id = $${paramIndex}`;
      params.push(preparerId);
      paramIndex++;
    }

    if (dateStart) {
      query += ` AND p.created_at >= $${paramIndex}`;
      params.push(dateStart);
      paramIndex++;
    }

    if (dateEnd) {
      query += ` AND p.created_at <= $${paramIndex}`;
      params.push(dateEnd);
      paramIndex++;
    }

    query += ` ORDER BY p.created_at DESC`;

    const offset = (page - 1) * pageSize;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(pageSize), parseInt(offset));

    const result = await db.query(query, params);

    const countResult = await db.query('SELECT COUNT(*) FROM package_preparations');

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

async function getPackageById(req, res, next) {
  try {
    const { id } = req.params;
    
    const packageResult = await db.query(`
      SELECT p.*, st.name as surgery_type_name, st.code as surgery_type_code,
             ors.room_name, ors.room_code,
             pt.template_name, pt.template_code,
             u.real_name as preparer_name,
             s.patient_name, s.surgeon_name, s.scheduled_start_time, s.schedule_no
      FROM package_preparations p
      LEFT JOIN surgery_types st ON p.surgery_type_id = st.id
      LEFT JOIN operating_rooms ors ON p.operating_room_id = ors.id
      LEFT JOIN package_templates pt ON p.template_id = pt.id
      LEFT JOIN users u ON p.preparer_id = u.id
      LEFT JOIN surgery_schedules s ON p.schedule_id = s.id
      WHERE p.id = $1
    `, [id]);

    if (packageResult.rows.length === 0) {
      throw new NotFoundError('备包记录不存在');
    }

    const itemsResult = await db.query(`
      SELECT pi.*, si.item_name, si.item_code, si.specification, si.unit, si.category, si.is_high_value,
             sb.batch_no, sb.expiry_date, sb.status as batch_status,
             u.real_name as scanned_by_name
      FROM package_items pi
      LEFT JOIN supply_items si ON pi.supply_item_id = si.id
      LEFT JOIN supply_batches sb ON pi.batch_id = sb.id
      LEFT JOIN users u ON pi.scanned_by = u.id
      WHERE pi.package_id = $1
      ORDER BY pi.created_at
    `, [id]);

    res.json({
      success: true,
      data: {
        ...packageResult.rows[0],
        items: itemsResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function createPackageFromTemplate(req, res, next) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { scheduleId, templateId, operatingRoomId, remarks } = req.body;

    if (!templateId) {
      throw new ValidationError('请选择耗材包模板');
    }

    let schedule = null;
    if (scheduleId) {
      const scheduleResult = await client.query('SELECT * FROM surgery_schedules WHERE id = $1', [scheduleId]);
      if (scheduleResult.rows.length === 0) {
        throw new NotFoundError('排班记录不存在');
      }
      schedule = scheduleResult.rows[0];
    }

    const templateResult = await client.query('SELECT * FROM package_templates WHERE id = $1 AND is_active = true', [templateId]);
    if (templateResult.rows.length === 0) {
      throw new NotFoundError('耗材包模板不存在或已停用');
    }
    const template = templateResult.rows[0];

    const templateItemsResult = await client.query(`
      SELECT pti.*, si.is_high_value, si.safety_stock
      FROM package_template_items pti
      JOIN supply_items si ON pti.supply_item_id = si.id
      WHERE pti.template_id = $1
    `, [templateId]);

    if (templateItemsResult.rows.length === 0) {
      throw new ValidationError('耗材包模板为空，请先配置模板明细');
    }

    const packageNo = `PKG${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    const surgeryTypeId = schedule?.surgery_type_id || template.surgery_type_id;
    const finalOperatingRoomId = operatingRoomId || schedule?.operating_room_id;

    const packageResult = await client.query(`
      INSERT INTO package_preparations 
      (package_no, schedule_id, surgery_type_id, operating_room_id, template_id, 
       package_name, preparer_id, preparer_name, status, remarks, patient_name, surgeon_name, scheduled_time)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      packageNo, scheduleId || null, surgeryTypeId, finalOperatingRoomId, templateId,
      template.template_name, req.user.id, req.user.realName, 'draft', remarks,
      schedule?.patient_name || null, schedule?.surgeon_name || null, schedule?.scheduled_start_time || null
    ]);

    const packageId = packageResult.rows[0].id;

    const stockWarnings = [];
    const expiryWarnings = [];

    for (const templateItem of templateItemsResult.rows) {
      const batchResult = await client.query(`
        SELECT * FROM supply_batches 
        WHERE supply_item_id = $1 AND status = 'normal' AND expiry_date > CURRENT_DATE
        ORDER BY expiry_date ASC, received_date ASC
        LIMIT 1
      `, [templateItem.supply_item_id]);

      const totalStockResult = await client.query(`
        SELECT COALESCE(SUM(quantity), 0) as total_stock
        FROM supply_batches
        WHERE supply_item_id = $1 AND status = 'normal' AND expiry_date > CURRENT_DATE
      `, [templateItem.supply_item_id]);

      const totalStock = parseInt(totalStockResult.rows[0].total_stock);
      if (totalStock < templateItem.quantity) {
        stockWarnings.push({
          supplyItemId: templateItem.supply_item_id,
          required: templateItem.quantity,
          available: totalStock,
        });
      }

      let batchId = null;
      let batchNo = null;
      let expiryDate = null;
      let unitPrice = null;

      if (batchResult.rows.length > 0) {
        const batch = batchResult.rows[0];
        batchId = batch.id;
        batchNo = batch.batch_no;
        expiryDate = batch.expiry_date;
        unitPrice = batch.unit_price;

        const now = new Date();
        const expiry = new Date(batch.expiry_date);
        const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 30) {
          expiryWarnings.push({
            supplyItemId: templateItem.supply_item_id,
            batchNo: batch.batch_no,
            daysUntilExpiry,
          });
        }
      }

      await client.query(`
        INSERT INTO package_items 
        (package_id, supply_item_id, batch_id, batch_no, quantity_needed, quantity_prepared, 
         is_high_value, unit_price, expiry_date, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      `, [
        packageId, templateItem.supply_item_id, batchId, batchNo,
        templateItem.quantity, 0, templateItem.is_high_value, unitPrice, expiryDate
      ]);
    }

    await logAudit(req.user.id, req.user.realName, 'create_package', 'package', 'package_preparation', packageId, null, packageResult.rows[0], req);

    await client.query('COMMIT');

    res.json({
      success: true,
      data: packageResult.rows[0],
      warnings: {
        stock: stockWarnings,
        expiry: expiryWarnings,
      },
      message: '备包创建成功，请完善批次信息',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

async function updatePackageItem(req, res, next) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { packageId, itemId } = req.params;
    const { batchId, quantityPrepared, scanCode } = req.body;

    const packageResult = await client.query('SELECT * FROM package_preparations WHERE id = $1', [packageId]);
    if (packageResult.rows.length === 0) {
      throw new NotFoundError('备包记录不存在');
    }

    if (packageResult.rows[0].status !== 'draft') {
      throw new ValidationError('备包状态不允许修改');
    }

    const itemResult = await client.query('SELECT * FROM package_items WHERE id = $1 AND package_id = $2', [itemId, packageId]);
    if (itemResult.rows.length === 0) {
      throw new NotFoundError('备包明细不存在');
    }

    let batch = null;
    if (batchId) {
      const batchResult = await client.query('SELECT * FROM supply_batches WHERE id = $1', [batchId]);
      if (batchResult.rows.length === 0) {
        throw new NotFoundError('批次不存在');
      }
      batch = batchResult.rows[0];

      if (batch.status === 'expired') {
        throw new ValidationError(`批号 ${batch.batch_no} 已过期，不能加入备包`);
      }

      if (batch.status === 'quarantined') {
        throw new ValidationError(`批号 ${batch.batch_no} 已被隔离，不能使用`);
      }

      if (batch.expiry_date < new Date()) {
        throw new ValidationError(`批号 ${batch.batch_no} 已过期，不能加入备包`);
      }

      if (quantityPrepared > batch.quantity) {
        throw new ValidationError(`库存不足，可用数量: ${batch.quantity}`);
      }
    }

    const updateResult = await client.query(`
      UPDATE package_items SET
        batch_id = COALESCE($1, batch_id),
        batch_no = COALESCE($2, batch_no),
        quantity_prepared = COALESCE($3, quantity_prepared),
        scan_code = COALESCE($4, scan_code),
        scan_time = CASE WHEN $4 IS NOT NULL THEN CURRENT_TIMESTAMP ELSE scan_time END,
        scanned_by = CASE WHEN $4 IS NOT NULL THEN $5 ELSE scanned_by END,
        unit_price = COALESCE($6, unit_price),
        expiry_date = COALESCE($7, expiry_date),
        status = CASE 
          WHEN COALESCE($3, quantity_prepared) >= quantity_needed AND $1 IS NOT NULL THEN 'prepared'
          ELSE 'pending'
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [
      batchId, batch?.batch_no, quantityPrepared, scanCode,
      req.user.id, batch?.unit_price, batch?.expiry_date, itemId
    ]);

    await logAudit(req.user.id, req.user.realName, 'update_package_item', 'package', 'package_item', itemId, itemResult.rows[0], updateResult.rows[0], req);

    await client.query('COMMIT');
    res.json({ success: true, data: updateResult.rows[0], message: '明细更新成功' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

async function submitPackageForReview(req, res, next) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    const packageResult = await client.query('SELECT * FROM package_preparations WHERE id = $1', [id]);
    if (packageResult.rows.length === 0) {
      throw new NotFoundError('备包记录不存在');
    }

    if (packageResult.rows[0].status !== 'draft') {
      throw new ValidationError('备包状态不允许提交审核');
    }

    const itemsResult = await client.query(`
      SELECT * FROM package_items WHERE package_id = $1 AND status != 'prepared'
    `, [id]);

    if (itemsResult.rows.length > 0) {
      const itemNames = itemsResult.rows.map(item => item.supply_item_id).join(', ');
      throw new ValidationError(`还有 ${itemsResult.rows.length} 项耗材未准备完成，请完善后再提交`);
    }

    const result = await client.query(`
      UPDATE package_preparations 
      SET status = 'pending_review', prepared_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);

    await logAudit(req.user.id, req.user.realName, 'submit_package', 'package', 'package_preparation', id, packageResult.rows[0], result.rows[0], req);

    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0], message: '备包已提交审核' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

async function reviewPackage(req, res, next) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { passed, reviewNotes } = req.body;

    if (typeof passed !== 'boolean') {
      throw new ValidationError('请明确指定审核结果（通过/驳回）');
    }

    const packageResult = await client.query('SELECT * FROM package_preparations WHERE id = $1', [id]);
    if (packageResult.rows.length === 0) {
      throw new NotFoundError('备包记录不存在');
    }

    if (packageResult.rows[0].status !== 'pending_review') {
      throw new ValidationError('备包状态不允许审核');
    }

    const newStatus = passed ? 'reviewed' : 'draft';

    const result = await client.query(`
      UPDATE package_preparations 
      SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, 
          remarks = COALESCE($3, remarks), updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [newStatus, req.user.id, reviewNotes, id]);

    await logAudit(req.user.id, req.user.realName, passed ? 'approve_package' : 'reject_package', 'package', 'package_preparation', id, packageResult.rows[0], result.rows[0], req);

    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0], message: passed ? '备包审核通过' : '备包已驳回，请修改' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

async function confirmPackage(req, res, next) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    const packageResult = await client.query('SELECT * FROM package_preparations WHERE id = $1', [id]);
    if (packageResult.rows.length === 0) {
      throw new NotFoundError('备包记录不存在');
    }

    if (packageResult.rows[0].status !== 'reviewed') {
      throw new ValidationError('备包状态不允许确认');
    }

    const itemsResult = await client.query('SELECT * FROM package_items WHERE package_id = $1', [id]);

    for (const item of itemsResult.rows) {
      if (item.batch_id && item.quantity_prepared > 0) {
        const batchResult = await client.query('SELECT * FROM supply_batches WHERE id = $1', [item.batch_id]);
        if (batchResult.rows.length > 0) {
          const batch = batchResult.rows[0];
          if (batch.quantity < item.quantity_prepared) {
            throw new ValidationError(`批号 ${batch.batch_no} 库存不足，可用: ${batch.quantity}, 需要: ${item.quantity_prepared}`);
          }

          const newQuantity = batch.quantity - item.quantity_prepared;
          await client.query(`
            UPDATE supply_batches SET quantity = $1, status = CASE WHEN $1 = 0 THEN 'depleted' ELSE status END, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [newQuantity, item.batch_id]);

          const ledgerNo = `LED${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
          await client.query(`
            INSERT INTO inventory_ledger 
            (ledger_no, transaction_type, supply_item_id, batch_id, quantity, unit_price, total_amount,
             reference_type, reference_id, reference_no, operating_room_id, operator_id, operator_name, remarks)
            VALUES ($1, 'prepare_out', $2, $3, $4, $5, $6, 'package', $7, $8, $9, $10, $11, $12)
          `, [
            ledgerNo, item.supply_item_id, item.batch_id, -item.quantity_prepared,
            item.unit_price, -item.quantity_prepared * (item.unit_price || 0),
            id, packageResult.rows[0].package_no, packageResult.rows[0].operating_room_id,
            req.user.id, req.user.realName, '备包出库'
          ]);
        }
      }
    }

    const result = await client.query(`
      UPDATE package_preparations 
      SET status = 'confirmed', confirmed_by = $1, confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [req.user.id, id]);

    await client.query(`
      UPDATE package_items SET status = 'verified', updated_at = CURRENT_TIMESTAMP
      WHERE package_id = $1
    `, [id]);

    await logAudit(req.user.id, req.user.realName, 'confirm_package', 'package', 'package_preparation', id, packageResult.rows[0], result.rows[0], req);

    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0], message: '备包已确认，库存已扣减' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

async function distributePackage(req, res, next) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    const packageResult = await client.query('SELECT * FROM package_preparations WHERE id = $1', [id]);
    if (packageResult.rows.length === 0) {
      throw new NotFoundError('备包记录不存在');
    }

    if (packageResult.rows[0].status !== 'confirmed') {
      throw new ValidationError('备包状态不允许发放');
    }

    const pickupNo = `PICK${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    await client.query(`
      INSERT INTO pickup_records 
      (pickup_no, package_id, operating_room_id, picked_up_by, picked_up_by_name, status)
      VALUES ($1, $2, $3, $4, $5, 'picked_up')
    `, [pickupNo, id, packageResult.rows[0].operating_room_id, req.user.id, req.user.realName]);

    const result = await client.query(`
      UPDATE package_preparations 
      SET status = 'distributed', distributed_to_room_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);

    await logAudit(req.user.id, req.user.realName, 'distribute_package', 'package', 'package_preparation', id, packageResult.rows[0], result.rows[0], req);

    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0], message: '备包已发放至手术间' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

async function markPackageUsed(req, res, next) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { itemsUsed } = req.body;

    const packageResult = await client.query('SELECT * FROM package_preparations WHERE id = $1', [id]);
    if (packageResult.rows.length === 0) {
      throw new NotFoundError('备包记录不存在');
    }

    if (packageResult.rows[0].status !== 'distributed') {
      throw new ValidationError('备包状态不允许标记使用');
    }

    const highValueItemsResult = await client.query(`
      SELECT pi.*, si.is_high_value, si.requires_scan
      FROM package_items pi
      JOIN supply_items si ON pi.supply_item_id = si.id
      WHERE pi.package_id = $1 AND (si.is_high_value = true OR si.requires_scan = true)
    `, [id]);

    const unscannedHighValue = highValueItemsResult.rows.filter(item => !item.is_scanned);
    if (unscannedHighValue.length > 0) {
      throw new ValidationError(`还有 ${unscannedHighValue.length} 件高值耗材未扫码，请先完成扫码再标记使用`);
    }

    if (itemsUsed && itemsUsed.length > 0) {
      for (const itemUsed of itemsUsed) {
        await client.query(`
          UPDATE package_items SET quantity_used = $1, status = 'used', updated_at = CURRENT_TIMESTAMP
          WHERE id = $2 AND package_id = $3
        `, [itemUsed.quantityUsed, itemUsed.itemId, id]);
      }
    } else {
      await client.query(`
        UPDATE package_items SET quantity_used = quantity_prepared, status = 'used', updated_at = CURRENT_TIMESTAMP
        WHERE package_id = $1
      `, [id]);
    }

    const result = await client.query(`
      UPDATE package_preparations 
      SET status = 'used', used_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);

    await logAudit(req.user.id, req.user.realName, 'use_package', 'package', 'package_preparation', id, packageResult.rows[0], result.rows[0], req);

    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0], message: '备包已标记使用' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

async function scanPackageItem(req, res, next) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { item_id, batch_code } = req.body;

    if (!item_id || !batch_code) {
      throw new ValidationError('请提供耗材项ID和批号');
    }

    const packageResult = await client.query('SELECT * FROM package_preparations WHERE id = $1', [id]);
    if (packageResult.rows.length === 0) {
      throw new NotFoundError('备包记录不存在');
    }

    if (packageResult.rows[0].status !== 'distributed') {
      throw new ValidationError('备包状态不允许扫码，只有已发放的备包才能扫码');
    }

    const itemResult = await client.query(`
      SELECT pi.*, si.item_name, si.is_high_value, si.requires_scan
      FROM package_items pi
      JOIN supply_items si ON pi.supply_item_id = si.id
      WHERE pi.id = $1 AND pi.package_id = $2
    `, [item_id, id]);

    if (itemResult.rows.length === 0) {
      throw new NotFoundError('备包明细不存在');
    }

    const item = itemResult.rows[0];
    if (!item.is_high_value && !item.requires_scan) {
      throw new ValidationError('该耗材不需要扫码');
    }

    if (item.is_scanned) {
      throw new ValidationError('该耗材已扫码');
    }

    const batchResult = await client.query(`
      SELECT sb.*, si.item_name
      FROM supply_batches sb
      JOIN supply_items si ON sb.supply_item_id = si.id
      WHERE sb.batch_no = $1 AND sb.supply_item_id = $2
    `, [batch_code, item.supply_item_id]);

    if (batchResult.rows.length === 0) {
      throw new ValidationError(`批号 ${batch_code} 不存在`);
    }

    const batch = batchResult.rows[0];
    if (batch.status === 'expired') {
      throw new ValidationError(`批号 ${batch.batch_no} 已过期`);
    }

    const updateResult = await client.query(`
      UPDATE package_items SET
        is_scanned = true,
        scanned_batch_code = $1,
        scanned_at = CURRENT_TIMESTAMP,
        scanned_by = $2,
        batch_id = COALESCE($3, batch_id),
        batch_no = COALESCE($4, batch_no),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [batch_code, req.user.id, batch.id, batch.batch_no, item_id]);

    await logAudit(req.user.id, req.user.realName, 'scan_item', 'package', 'package_item', item_id, item, updateResult.rows[0], req);

    await client.query('COMMIT');
    res.json({ 
      success: true, 
      data: updateResult.rows[0], 
      message: `扫码成功，${item.item_name} 已关联到手术 ${packageResult.rows[0].package_no}` 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

async function createPackage(req, res, next) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { schedule_id, template_id, package_name } = req.body;

    if (!package_name) {
      throw new ValidationError('请输入备包名称');
    }

    const packageNo = `PKG${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    let schedule = null;
    let surgeryTypeId = null;
    let operatingRoomId = null;
    let patientName = null;
    let surgeonName = null;
    let scheduledTime = null;

    if (schedule_id) {
      const scheduleResult = await client.query('SELECT * FROM surgery_schedules WHERE id = $1', [schedule_id]);
      if (scheduleResult.rows.length === 0) {
        throw new NotFoundError('排班记录不存在');
      }
      schedule = scheduleResult.rows[0];
      surgeryTypeId = schedule.surgery_type_id;
      operatingRoomId = schedule.operating_room_id;
      patientName = schedule.patient_name;
      surgeonName = schedule.surgeon_name;
      scheduledTime = schedule.scheduled_start_time;
    }

    const packageResult = await client.query(`
      INSERT INTO package_preparations 
      (package_no, schedule_id, surgery_type_id, operating_room_id, template_id, 
       package_name, preparer_id, preparer_name, status, patient_name, surgeon_name, scheduled_time)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', $9, $10, $11)
      RETURNING *
    `, [
      packageNo, schedule_id || null, surgeryTypeId, operatingRoomId, template_id || null,
      package_name, req.user.id, req.user.realName, patientName, surgeonName, scheduledTime
    ]);

    const packageId = packageResult.rows[0].id;

    if (template_id) {
      const templateItemsResult = await client.query(`
        SELECT pti.*, si.is_high_value, si.safety_stock
        FROM package_template_items pti
        JOIN supply_items si ON pti.supply_item_id = si.id
        WHERE pti.template_id = $1
      `, [template_id]);

      for (const templateItem of templateItemsResult.rows) {
        await client.query(`
          INSERT INTO package_items 
          (package_id, supply_item_id, quantity_needed, quantity_prepared, is_high_value, status)
          VALUES ($1, $2, $3, 0, $4, 'pending')
        `, [packageId, templateItem.supply_item_id, templateItem.quantity, templateItem.is_high_value]);
      }
    }

    await logAudit(req.user.id, req.user.realName, 'create_package', 'package', 'package_preparation', packageId, null, packageResult.rows[0], req);

    await client.query('COMMIT');

    res.json({
      success: true,
      data: packageResult.rows[0],
      message: '备包创建成功',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

module.exports = {
  getPackages,
  getPackageById,
  createPackage,
  createPackageFromTemplate,
  updatePackageItem,
  submitPackageForReview,
  reviewPackage,
  approvePackage: reviewPackage,
  confirmPackage,
  deliverPackage: distributePackage,
  distributePackage,
  markPackageUsed,
  scanPackageItem,
};
