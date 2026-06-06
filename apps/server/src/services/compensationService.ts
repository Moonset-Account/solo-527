import { query, getClient } from '../db';
import { createNotification } from './notificationService';
import { createAuditLog } from './auditService';

export const handleCompensation = async (
  compensationId: string,
  action: 'paid' | 'waived',
  handledBy: string,
  remarks?: string
) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const result = await client.query(
      `UPDATE compensation_orders 
       SET status = $2, handled_by = $3, handled_at = NOW(), remarks = $4, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [compensationId, action, handledBy, remarks]
    );
    
    if (result.rows.length === 0) {
      throw new Error('赔付单不存在');
    }
    
    const compensation = result.rows[0];
    
    const pendingCount = await client.query(
      `SELECT COUNT(*) as count FROM compensation_orders 
       WHERE applicant_id = $1 AND status = 'pending'`,
      [compensation.applicant_id]
    );
    
    if (parseInt(pendingCount.rows[0].count) === 0) {
      await client.query(
        `UPDATE users SET is_frozen = false, frozen_reason = NULL WHERE id = $1`,
        [compensation.applicant_id]
      );
    }
    
    const borrowItem = await client.query(
      `SELECT * FROM borrow_items WHERE id = $1`,
      [compensation.borrow_item_id]
    );
    
    if (borrowItem.rows[0].damage_description) {
      await client.query(
        `UPDATE materials SET status = 'repairing' WHERE id = $1`,
        [borrowItem.rows[0].material_id]
      );
    }
    
    await createNotification({
      userId: compensation.applicant_id,
      type: 'compensation_handled',
      title: '赔付单已处理',
      content: `您的赔付单已${action === 'paid' ? '确认收款' : '豁免'}，账户已解冻。`
    });
    
    await createAuditLog({
      userId: handledBy,
      action: `handle_compensation_${action}`,
      entityType: 'compensation_order',
      entityId: compensationId,
      newValue: { status: action, remarks }
    });
    
    await client.query('COMMIT');
    
    return compensation;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getCompensationOrders = async (status?: string, applicantId?: string) => {
  let queryText = `
    SELECT co.*, u.real_name as applicant_name, bi.material_id, m.name as material_name
    FROM compensation_orders co
    JOIN users u ON co.applicant_id = u.id
    JOIN borrow_items bi ON co.borrow_item_id = bi.id
    JOIN materials m ON bi.material_id = m.id
  `;
  const params: any[] = [];
  
  if (status) {
    params.push(status);
    queryText += ` WHERE co.status = $${params.length}`;
  }
  
  if (applicantId) {
    params.push(applicantId);
    queryText += params.length === 1 ? ' WHERE' : ' AND';
    queryText += ` co.applicant_id = $${params.length}`;
  }
  
  queryText += ` ORDER BY co.created_at DESC`;
  
  const result = await query(queryText, params);
  return result.rows;
};

interface ManualEntryParams {
  entryType: 'borrow' | 'return' | 'material' | 'compensation';
  entityId?: string;
  enteredBy: string;
  entryReason: string;
  entryDetails: any;
}

export const createManualEntry = async (params: ManualEntryParams) => {
  const { entryType, entityId, enteredBy, entryReason, entryDetails } = params;
  
  const result = await query(
    `INSERT INTO manual_entries (entry_type, entity_id, entered_by, entry_reason, entry_details)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [entryType, entityId, enteredBy, entryReason, JSON.stringify(entryDetails)]
  );
  
  await createAuditLog({
    userId: enteredBy,
    action: `manual_entry_${entryType}`,
    entityType: 'manual_entry',
    entityId: result.rows[0].id,
    newValue: { entryType, entityId, entryReason, entryDetails }
  });
  
  return result.rows[0];
};

export const getManualEntries = async (entryType?: string) => {
  let queryText = `
    SELECT me.*, u.real_name as entered_by_name
    FROM manual_entries me
    JOIN users u ON me.entered_by = u.id
  `;
  const params: any[] = [];
  
  if (entryType) {
    params.push(entryType);
    queryText += ` WHERE me.entry_type = $${params.length}`;
  }
  
  queryText += ` ORDER BY me.created_at DESC`;
  
  const result = await query(queryText, params);
  return result.rows;
};
