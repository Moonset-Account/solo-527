import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { logAudit } from '../utils/audit';

export class SettlementService {
  async getAll(filters?: {
    member_id?: string;
    status?: string;
    price_type?: string;
    month?: string;
  }): Promise<any[]> {
    let query = db('settlements')
      .join('reservations', 'settlements.reservation_id', 'reservations.id')
      .join('users as members', 'settlements.member_id', 'members.id')
      .join('equipment', 'reservations.equipment_id', 'equipment.id')
      .leftJoin('work_records', 'reservations.id', 'work_records.reservation_id')
      .select(
        'settlements.*',
        'members.name as member_name',
        'equipment.name as equipment_name',
        'work_records.fuel_consumption',
        'work_records.work_hours'
      )
      .orderBy('settlements.created_at', 'desc');

    if (filters?.member_id) {
      query = query.where('settlements.member_id', filters.member_id);
    }
    if (filters?.status) {
      query = query.where('settlements.status', filters.status);
    }
    if (filters?.price_type) {
      query = query.where('settlements.price_type', filters.price_type);
    }
    if (filters?.month) {
      const start = new Date(filters.month + '-01');
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      query = query.whereBetween('settlements.created_at', [start, end]);
    }

    return await query;
  }

  async getById(id: string): Promise<any> {
    const settlement = await db('settlements')
      .join('reservations', 'settlements.reservation_id', 'reservations.id')
      .join('users as members', 'settlements.member_id', 'members.id')
      .join('equipment', 'reservations.equipment_id', 'equipment.id')
      .join('fields', 'reservations.field_id', 'fields.id')
      .leftJoin('work_records', 'reservations.id', 'work_records.reservation_id')
      .select(
        'settlements.*',
        'members.name as member_name',
        'members.phone as member_phone',
        'equipment.name as equipment_name',
        'fields.name as field_name',
        'fields.area as field_area',
        'reservations.crop',
        'reservations.start_time',
        'reservations.end_time',
        'work_records.fuel_consumption',
        'work_records.work_hours',
        'work_records.field_photos',
        'work_records.notes as work_notes'
      )
      .where('settlements.id', id)
      .first();

    if (settlement && settlement.field_photos) {
      try {
        settlement.field_photos = JSON.parse(settlement.field_photos);
      } catch (e) {}
    }

    return settlement;
  }

  async confirm(id: string, operatorId: string, ipAddress: string = '127.0.0.1'): Promise<boolean> {
    const settlement = await this.getById(id);
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
        confirmed_at: new Date()
      });

    if (settlement.points_deducted > 0) {
      await db('users')
        .where({ id: settlement.member_id })
        .decrement('points', settlement.points_deducted);
    }

    await logAudit(
      operatorId,
      'confirm',
      'settlement',
      id,
      beforeData,
      { status: 'confirmed', confirmed_at: new Date() },
      ipAddress
    );

    return true;
  }

  async getStatistics(memberId?: string): Promise<any> {
    let query = db('settlements');
    
    if (memberId) {
      query = query.where('member_id', memberId);
    }

    const total = await query.clone().sum('total_amount as total').first();
    const pending = await query.clone().where('status', 'pending').sum('total_amount as total').first();
    const confirmed = await query.clone().where('status', 'confirmed').sum('total_amount as total').first();
    const count = await query.clone().count('id as count').first();

    return {
      total_amount: parseFloat(total?.total || 0),
      pending_amount: parseFloat(pending?.total || 0),
      confirmed_amount: parseFloat(confirmed?.total || 0),
      total_count: count?.count || 0
    };
  }
}
