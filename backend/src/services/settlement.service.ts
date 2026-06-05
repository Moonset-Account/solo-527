import { db } from '../database/db';
import { logAudit } from '../utils/audit';
import { z } from 'zod';

export class SettlementService {
  async getAll(filters?: {
    user_id?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any[]> {
    let query = db('settlements')
      .join('reservations', 'settlements.reservation_id', 'reservations.id')
      .join('users', 'settlements.user_id', 'users.id')
      .join('equipment', 'reservations.equipment_id', 'equipment.id')
      .join('fields', 'reservations.field_id', 'fields.id')
      .select(
        'settlements.*',
        'users.name as user_name',
        'equipment.name as equipment_name',
        'fields.name as field_name',
        'reservations.crop_type',
        'reservations.start_time as work_time'
      )
      .orderBy('settlements.created_at', 'desc');

    if (filters?.user_id) {
      query = query.where('settlements.user_id', filters.user_id);
    }
    if (filters?.status) {
      query = query.where('settlements.status', filters.status);
    }
    if (filters?.start_date) {
      query = query.where('settlements.created_at', '>=', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.where('settlements.created_at', '<=', filters.end_date);
    }

    return await query;
  }

  async getById(id: string): Promise<any> {
    const settlement = await db('settlements')
      .join('reservations', 'settlements.reservation_id', 'reservations.id')
      .join('users', 'settlements.user_id', 'users.id')
      .join('equipment', 'reservations.equipment_id', 'equipment.id')
      .join('fields', 'reservations.field_id', 'fields.id')
      .leftJoin('work_records', 'settlements.reservation_id', 'work_records.reservation_id')
      .select(
        'settlements.*',
        'users.name as user_name',
        'users.phone as user_phone',
        'equipment.name as equipment_name',
        'fields.name as field_name',
        'fields.area as field_area',
        'reservations.crop_type',
        'work_records.fuel_consumption',
        'work_records.work_hours',
        'work_records.notes as work_notes'
      )
      .where('settlements.id', id)
      .first();

    if (settlement) {
      const priceLabels: Record<string, string> = {
        self_use: '社员自用',
        cooperative_subsidy: '合作社补贴',
        cross_village: '跨村租赁'
      };
      settlement.price_type_label = priceLabels[settlement.price_type] || settlement.price_type;
    }

    return settlement;
  }

  async confirm(id: string, userId: string, ipAddress: string = '127.0.0.1'): Promise<boolean> {
    const settlement = await db('settlements').where({ id }).first();
    if (!settlement) {
      throw new Error('结算单不存在');
    }
    if (settlement.status !== 'pending') {
      throw new Error('只有待确认的结算单可以确认');
    }

    const beforeData = { ...settlement };

    await db('settlements')
      .where({ id })
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      });

    await logAudit(userId, 'confirm_settlement', 'settlement', id, beforeData, {
      status: 'confirmed'
    }, ipAddress);

    return true;
  }

  async getStatistics(userId?: string): Promise<any> {
    let query = db('settlements');
    
    if (userId) {
      query = query.where({ user_id: userId });
    }

    const totalAmount = await query.clone().sum('total_amount as total').first();
    const pendingCount = await query.clone().where('status', 'pending').count('id as count').first();
    const confirmedCount = await query.clone().where('status', 'confirmed').count('id as count').first();

    return {
      total_amount: (totalAmount as any).total || 0,
      pending_count: (pendingCount as any).count || 0,
      confirmed_count: (confirmedCount as any).count || 0
    };
  }
}
