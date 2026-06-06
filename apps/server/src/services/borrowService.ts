import { query, getClient } from '../db';
import { createInventoryReservation, cancelInventoryReservation, checkOverlappingReservations } from './inventoryService';
import { createNotification } from './notificationService';
import { createAuditLog } from './auditService';

interface CreateApplicationParams {
  activityId: string;
  applicantId: string;
  materialIds: string[];
  expectedBorrowDate: string;
  expectedReturnDate: string;
  remarks?: string;
}

export const createBorrowApplication = async (params: CreateApplicationParams, userId: string) => {
  const { activityId, applicantId, materialIds, expectedBorrowDate, expectedReturnDate, remarks } = params;
  
  const userCheck = await query('SELECT is_frozen FROM users WHERE id = $1', [applicantId]);
  if (userCheck.rows[0]?.is_frozen) {
    throw new Error('该用户账户已被冻结，无法提交借用申请');
  }
  
  const pendingCompensation = await query(
    `SELECT COUNT(*) as count FROM compensation_orders 
     WHERE applicant_id = $1 AND status = 'pending'`,
    [applicantId]
  );
  
  if (parseInt(pendingCompensation.rows[0].count) > 0) {
    throw new Error('存在未处理的赔付单，请先完成赔付后再申请');
  }
  
  const conflicts = await checkOverlappingReservations(materialIds, expectedBorrowDate, expectedReturnDate);
  if (conflicts.length > 0) {
    throw new Error(`以下物资在所选日期已被预占: ${conflicts.join(', ')}`);
  }
  
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const appResult = await client.query(
      `INSERT INTO borrow_applications (activity_id, applicant_id, expected_borrow_date, expected_return_date, remarks)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [activityId, applicantId, expectedBorrowDate, expectedReturnDate, remarks]
    );
    
    const application = appResult.rows[0];
    
    for (const materialId of materialIds) {
      await client.query(
        `INSERT INTO borrow_items (application_id, material_id) VALUES ($1, $2)`,
        [application.id, materialId]
      );
      
      await client.query(
        `INSERT INTO inventory_reservations (material_id, application_id, reserve_start_date, reserve_end_date, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [materialId, application.id, expectedBorrowDate, expectedReturnDate, userId]
      );
      
      await client.query(
        `UPDATE materials SET status = 'reserved' WHERE id = $1 AND status = 'available'`,
        [materialId]
      );
    }
    
    await client.query('COMMIT');
    
    await createNotification({
      userId: applicantId,
      type: 'application_submitted',
      title: '借用申请已提交',
      content: `您的借用申请已提交，请等待仓管审核。`
    });
    
    await createAuditLog({
      userId,
      action: 'create_application',
      entityType: 'borrow_application',
      entityId: application.id,
      newValue: application
    });
    
    return application;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const approveApplication = async (applicationId: string, warehouseManagerId: string) => {
  const result = await query(
    `UPDATE borrow_applications 
     SET status = 'approved', warehouse_manager_id = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [applicationId, warehouseManagerId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('申请不存在');
  }
  
  const application = result.rows[0];
  
  await createNotification({
    userId: application.applicant_id,
    type: 'application_approved',
    title: '借用申请已批准',
    content: `您的借用申请已被批准，请按时领取物资。`
  });
  
  await createAuditLog({
    userId: warehouseManagerId,
    action: 'approve_application',
    entityType: 'borrow_application',
    entityId: applicationId,
    newValue: { status: 'approved' }
  });
  
  return application;
};

interface BorrowMaterialParams {
  applicationId: string;
  materialId: string;
  qrCode: string;
  borrowCondition: string;
  warehouseManagerId: string;
}

export const borrowMaterial = async (params: BorrowMaterialParams) => {
  const { applicationId, materialId, qrCode, borrowCondition, warehouseManagerId } = params;
  
  const material = await query('SELECT * FROM materials WHERE id = $1 AND qr_code = $2', [materialId, qrCode]);
  if (material.rows.length === 0) {
    throw new Error('物资不存在或二维码不匹配');
  }
  
  if (material.rows[0].status === 'damaged' || material.rows[0].status === 'repairing') {
    throw new Error('该物资已损坏，无法借出');
  }
  
  const borrowItem = await query(
    `UPDATE borrow_items 
     SET status = 'borrowed', borrow_condition = $3, updated_at = NOW()
     WHERE application_id = $1 AND material_id = $2
     RETURNING *`,
    [applicationId, materialId, borrowCondition]
  );
  
  if (borrowItem.rows.length === 0) {
    throw new Error('借用记录不存在');
  }
  
  await query(
    `UPDATE materials SET status = 'borrowed', updated_at = NOW() WHERE id = $1`,
    [materialId]
  );
  
  const appResult = await query(
    `SELECT * FROM borrow_applications WHERE id = $1`,
    [applicationId]
  );
  
  const allBorrowed = await query(
    `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'borrowed' THEN 1 ELSE 0 END) as borrowed
     FROM borrow_items WHERE application_id = $1`,
    [applicationId]
  );
  
  if (parseInt(allBorrowed.rows[0].total) === parseInt(allBorrowed.rows[0].borrowed)) {
    await query(
      `UPDATE borrow_applications SET actual_borrow_date = CURRENT_DATE, updated_at = NOW() WHERE id = $1`,
      [applicationId]
    );
  }
  
  await createAuditLog({
    userId: warehouseManagerId,
    action: 'borrow_material',
    entityType: 'borrow_item',
    entityId: borrowItem.rows[0].id,
    newValue: { status: 'borrowed', borrowCondition }
  });
  
  return borrowItem.rows[0];
};

interface ReturnMaterialParams {
  applicationId: string;
  materialId: string;
  qrCode: string;
  returnCondition: string;
  damageDescription?: string;
  missingParts?: string;
  warehouseManagerId: string;
}

export const returnMaterial = async (params: ReturnMaterialParams) => {
  const { applicationId, materialId, qrCode, returnCondition, damageDescription, missingParts, warehouseManagerId } = params;
  
  const material = await query('SELECT * FROM materials WHERE id = $1 AND qr_code = $2', [materialId, qrCode]);
  if (material.rows.length === 0) {
    throw new Error('物资不存在或二维码不匹配');
  }
  
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const borrowItemResult = await client.query(
      `UPDATE borrow_items 
       SET status = 'returned', return_condition = $3, damage_description = $4, missing_parts = $5, updated_at = NOW()
       WHERE application_id = $1 AND material_id = $2
       RETURNING *`,
      [applicationId, materialId, returnCondition, damageDescription, missingParts]
    );
    
    if (borrowItemResult.rows.length === 0) {
      throw new Error('借用记录不存在');
    }
    
    const borrowItem = borrowItemResult.rows[0];
    
    let newMaterialStatus = 'available';
    let newCondition = returnCondition;
    
    if (damageDescription || missingParts) {
      newMaterialStatus = 'damaged';
      
      const appResult = await client.query(
        `SELECT * FROM borrow_applications WHERE id = $1`,
        [applicationId]
      );
      
      const purchasePrice = material.rows[0].purchase_price || 100;
      const compensationAmount = damageDescription ? purchasePrice * 0.5 : purchasePrice * 0.3;
      
      const compResult = await client.query(
        `INSERT INTO compensation_orders (borrow_item_id, application_id, applicant_id, amount, reason)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          borrowItem.id,
          applicationId,
          appResult.rows[0].applicant_id,
          compensationAmount.toFixed(2),
          missingParts ? `缺件: ${missingParts}` : `损坏: ${damageDescription}`
        ]
      );
      
      await client.query(
        `UPDATE users SET is_frozen = true, frozen_reason = $2 WHERE id = $1`,
        [appResult.rows[0].applicant_id, '存在未处理的赔付单']
      );
      
      await createNotification({
        userId: appResult.rows[0].applicant_id,
        type: 'compensation_created',
        title: '赔付通知',
        content: `您归还的物资存在${missingParts ? '缺件' : '损坏'}，已生成赔付单，金额：¥${compensationAmount.toFixed(2)}。请联系仓管处理。`
      });
      
      await createAuditLog({
        userId: warehouseManagerId,
        action: 'create_compensation',
        entityType: 'compensation_order',
        entityId: compResult.rows[0].id,
        newValue: compResult.rows[0]
      });
    }
    
    await client.query(
      `UPDATE materials SET status = $2, condition = $3, updated_at = NOW() WHERE id = $1`,
      [materialId, newMaterialStatus, newCondition]
    );
    
    const allReturned = await client.query(
      `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'returned' OR status = 'damaged' OR status = 'lost' THEN 1 ELSE 0 END) as returned
       FROM borrow_items WHERE application_id = $1`,
      [applicationId]
    );
    
    if (parseInt(allReturned.rows[0].total) === parseInt(allReturned.rows[0].returned)) {
      await client.query(
        `UPDATE borrow_applications SET actual_return_date = CURRENT_DATE, status = 'completed', updated_at = NOW() WHERE id = $1`,
        [applicationId]
      );
      
      await cancelInventoryReservation(applicationId);
    }
    
    await client.query('COMMIT');
    
    await createAuditLog({
      userId: warehouseManagerId,
      action: 'return_material',
      entityType: 'borrow_item',
      entityId: borrowItem.id,
      newValue: { status: 'returned', returnCondition, damageDescription, missingParts }
    });
    
    return borrowItem;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getApplicationDetails = async (applicationId: string) => {
  const appResult = await query(
    `SELECT ba.*, a.title as activity_title, a.activity_date, 
            u1.real_name as applicant_name, u2.real_name as warehouse_manager_name
     FROM borrow_applications ba
     JOIN activities a ON ba.activity_id = a.id
     JOIN users u1 ON ba.applicant_id = u1.id
     LEFT JOIN users u2 ON ba.warehouse_manager_id = u2.id
     WHERE ba.id = $1`,
    [applicationId]
  );
  
  if (appResult.rows.length === 0) {
    throw new Error('申请不存在');
  }
  
  const itemsResult = await query(
    `SELECT bi.*, m.name as material_name, m.qr_code, mc.name as category_name
     FROM borrow_items bi
     JOIN materials m ON bi.material_id = m.id
     JOIN material_categories mc ON m.category_id = mc.id
     WHERE bi.application_id = $1`,
    [applicationId]
  );
  
  return {
    ...appResult.rows[0],
    items: itemsResult.rows
  };
};
