import { query, getClient } from '../db';

export const checkMaterialAvailability = async (
  materialId: string,
  startDate: string,
  endDate: string,
  excludeApplicationId?: string
): Promise<boolean> => {
  const params: any[] = [materialId, startDate, endDate];
  let excludeClause = '';
  
  if (excludeApplicationId) {
    params.push(excludeApplicationId);
    excludeClause = `AND ir.application_id != $${params.length}`;
  }
  
  const result = await query(
    `SELECT COUNT(*) as count
     FROM inventory_reservations ir
     WHERE ir.material_id = $1
       AND ir.is_active = true
       AND ir.reserve_start_date <= $3
       AND ir.reserve_end_date >= $2
       ${excludeClause}`,
    params
  );
  
  return parseInt(result.rows[0].count) === 0;
};

export const createInventoryReservation = async (
  materialId: string,
  applicationId: string,
  startDate: string,
  endDate: string,
  createdBy: string
) => {
  const isAvailable = await checkMaterialAvailability(materialId, startDate, endDate);
  
  if (!isAvailable) {
    throw new Error('该物资在所选日期范围内已被预占');
  }
  
  const result = await query(
    `INSERT INTO inventory_reservations (material_id, application_id, reserve_start_date, reserve_end_date, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [materialId, applicationId, startDate, endDate, createdBy]
  );
  
  await query(
    `UPDATE materials SET status = 'reserved' WHERE id = $1 AND status = 'available'`,
    [materialId]
  );
  
  return result.rows[0];
};

export const cancelInventoryReservation = async (applicationId: string) => {
  await query(
    `UPDATE inventory_reservations SET is_active = false WHERE application_id = $1`,
    [applicationId]
  );
  
  await query(
    `UPDATE materials m
     SET status = 'available'
     WHERE m.status = 'reserved'
       AND NOT EXISTS (
         SELECT 1 FROM inventory_reservations ir
         WHERE ir.material_id = m.id
           AND ir.is_active = true
       )`,
    []
  );
};

export const getMaterialReservations = async (materialId: string) => {
  const result = await query(
    `SELECT ir.*, ba.expected_borrow_date, ba.expected_return_date, a.title as activity_title
     FROM inventory_reservations ir
     JOIN borrow_applications ba ON ir.application_id = ba.id
     JOIN activities a ON ba.activity_id = a.id
     WHERE ir.material_id = $1 AND ir.is_active = true
     ORDER BY ir.reserve_start_date`,
    [materialId]
  );
  return result.rows;
};

export const checkOverlappingReservations = async (
  materialIds: string[],
  startDate: string,
  endDate: string
): Promise<string[]> => {
  const conflicts: string[] = [];
  
  for (const materialId of materialIds) {
    const available = await checkMaterialAvailability(materialId, startDate, endDate);
    if (!available) {
      conflicts.push(materialId);
    }
  }
  
  return conflicts;
};
