import { db } from '../database/db';
import { AuditLog } from '../types';

export class AuditService {
  async getAll(filters?: {
    user_id?: string;
    action?: string;
    resource_type?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ data: any[]; total: number }> {
    const page = filters?.page || 1;
    const pageSize = filters?.page_size || 20;
    const offset = (page - 1) * pageSize;

    let query = db('audit_logs')
      .leftJoin('users', 'audit_logs.user_id', 'users.id')
      .select(
        'audit_logs.*',
        'users.name as user_name',
        'users.role as user_role'
      )
      .orderBy('audit_logs.created_at', 'desc')
      .limit(pageSize)
      .offset(offset);

    let countQuery = db('audit_logs').count('id as count');

    if (filters?.user_id) {
      query = query.where('audit_logs.user_id', filters.user_id);
      countQuery = countQuery.where('user_id', filters.user_id);
    }
    if (filters?.action) {
      query = query.where('audit_logs.action', 'like', `%${filters.action}%`);
      countQuery = countQuery.where('action', 'like', `%${filters.action}%`);
    }
    if (filters?.resource_type) {
      query = query.where('audit_logs.resource_type', filters.resource_type);
      countQuery = countQuery.where('resource_type', filters.resource_type);
    }
    if (filters?.start_date) {
      query = query.where('audit_logs.created_at', '>=', filters.start_date);
      countQuery = countQuery.where('created_at', '>=', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.where('audit_logs.created_at', '<=', filters.end_date);
      countQuery = countQuery.where('created_at', '<=', filters.end_date);
    }

    const data = await query;
    const totalResult = await countQuery.first();

    return {
      data,
      total: (totalResult as any).count
    };
  }
}
