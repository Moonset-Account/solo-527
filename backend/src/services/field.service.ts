import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { Field } from '../types';
import { logAudit } from '../utils/audit';
import { z } from 'zod';

export const createFieldSchema = z.object({
  name: z.string().min(2, '地块名称至少2个字符'),
  area: z.number().positive('面积必须大于0'),
  location: z.string().optional(),
  polygon_coords: z.array(z.array(z.number())).optional(),
  soil_type: z.string().optional(),
  owner_id: z.string().uuid('所有者ID格式错误')
});

export class FieldService {
  async getAll(filters?: {
    owner_id?: string;
    keyword?: string;
  }): Promise<any[]> {
    let query = db('fields')
      .leftJoin('users', 'fields.owner_id', 'users.id')
      .select(
        'fields.*',
        'users.name as owner_name'
      )
      .orderBy('fields.created_at', 'desc');

    if (filters?.owner_id) {
      query = query.where('fields.owner_id', filters.owner_id);
    }
    if (filters?.keyword) {
      query = query.where(function() {
        this.where('fields.name', 'like', `%${filters.keyword}%`)
          .orWhere('fields.location', 'like', `%${filters.keyword}%`);
      });
    }

    const fields = await query;
    return fields.map(f => ({
      ...f,
      polygon_coords: f.polygon_coords ? JSON.parse(f.polygon_coords) : null
    }));
  }

  async getById(id: string): Promise<any> {
    const field = await db('fields')
      .leftJoin('users', 'fields.owner_id', 'users.id')
      .select(
        'fields.*',
        'users.name as owner_name',
        'users.phone as owner_phone'
      )
      .where('fields.id', id)
      .first();

    if (!field) return null;

    const workRecords = await db('work_records')
      .join('equipment', 'work_records.equipment_id', 'equipment.id')
      .join('users', 'work_records.operator_id', 'users.id')
      .where('work_records.field_id', id)
      .select(
        'work_records.*',
        'equipment.name as equipment_name',
        'users.name as operator_name'
      )
      .orderBy('work_records.completed_at', 'desc')
      .limit(10);

    const reservations = await db('reservations')
      .join('equipment', 'reservations.equipment_id', 'equipment.id')
      .where('reservations.field_id', id)
      .where('reservations.is_cancelled', false)
      .select(
        'reservations.*',
        'equipment.name as equipment_name'
      )
      .orderBy('reservations.start_time', 'desc')
      .limit(10);

    return {
      ...field,
      polygon_coords: field.polygon_coords ? JSON.parse(field.polygon_coords) : null,
      work_records: workRecords,
      reservations: reservations
    };
  }

  async create(userId: string, data: z.infer<typeof createFieldSchema>, ipAddress: string = '127.0.0.1'): Promise<Field> {
    const validation = createFieldSchema.safeParse(data);
    if (!validation.success) {
      throw new Error(validation.error.errors[0].message);
    }

    const id = uuidv4();
    const field: Partial<Field> = {
      id,
      name: data.name,
      area: data.area,
      location: data.location || '',
      polygon_coords: data.polygon_coords ? JSON.stringify(data.polygon_coords) : null,
      soil_type: data.soil_type || '',
      owner_id: data.owner_id,
      created_at: new Date().toISOString()
    };

    await db('fields').insert(field);
    await logAudit(userId, 'create_field', 'field', id, null, field, ipAddress);

    return field as Field;
  }
}
