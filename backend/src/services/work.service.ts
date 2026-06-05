import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { db } from '../database/db';
import { logAudit } from '../utils/audit';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

export const completeWorkSchema = z.object({
  work_hours: z.number().min(0.1, '作业时长至少0.1小时'),
  fuel_consumption: z.number().min(0, '油耗不能为负数'),
  notes: z.string().optional()
});

export class WorkService {
  async getMyTasks(operatorId: string): Promise<any[]> {
    const tasks = await db('work_orders')
      .join('reservations', 'work_orders.reservation_id', 'reservations.id')
      .join('equipment', 'reservations.equipment_id', 'equipment.id')
      .join('fields', 'reservations.field_id', 'fields.id')
      .join('users as members', 'reservations.member_id', 'members.id')
      .select(
        'work_orders.*',
        'reservations.crop',
        'reservations.start_time',
        'reservations.end_time',
        'reservations.price_type',
        'equipment.name as equipment_name',
        'equipment.type as equipment_type',
        'fields.name as field_name',
        'fields.area as field_area',
        'members.name as member_name',
        'members.phone as member_phone'
      )
      .where('work_orders.operator_id', operatorId)
      .orderBy('work_orders.assigned_at', 'desc');

    return tasks;
  }

  async getTaskById(taskId: string, operatorId?: string): Promise<any> {
    let query = db('work_orders')
      .join('reservations', 'work_orders.reservation_id', 'reservations.id')
      .join('equipment', 'reservations.equipment_id', 'equipment.id')
      .join('fields', 'reservations.field_id', 'fields.id')
      .join('users as members', 'reservations.member_id', 'members.id')
      .leftJoin('work_records', 'work_orders.id', 'work_records.work_order_id')
      .select(
        'work_orders.*',
        'reservations.crop',
        'reservations.start_time',
        'reservations.end_time',
        'reservations.price_type',
        'equipment.name as equipment_name',
        'equipment.type as equipment_type',
        'fields.name as field_name',
        'fields.area as field_area',
        'members.name as member_name',
        'members.phone as member_phone',
        'work_records.fuel_consumption',
        'work_records.work_hours',
        'work_records.field_photos',
        'work_records.notes as record_notes'
      )
      .where('work_orders.id', taskId);

    if (operatorId) {
      query = query.where('work_orders.operator_id', operatorId);
    }

    const task = await query.first();
    
    if (task && task.field_photos) {
      try {
        task.field_photos = JSON.parse(task.field_photos);
      } catch (e) {
        task.field_photos = [];
      }
    }

    return task;
  }

  async startWork(taskId: string, operatorId: string, ipAddress: string = '127.0.0.1'): Promise<boolean> {
    const task = await db('work_orders').where({ id: taskId }).first();
    if (!task) {
      throw new Error('任务不存在');
    }
    if (task.operator_id !== operatorId) {
      throw new Error('无权限操作此任务');
    }
    if (task.status !== 'assigned') {
      throw new Error('任务状态不允许开始');
    }

    const beforeData = { ...task };

    await db('work_orders')
      .where({ id: taskId })
      .update({
        status: 'in_progress',
        started_at: new Date()
      });

    await db('reservations')
      .where({ id: task.reservation_id })
      .update({
        status: 'in_progress',
        updated_at: new Date()
      });

    await logAudit(
      operatorId,
      'start_work',
      'work_order',
      taskId,
      beforeData,
      { status: 'in_progress', started_at: new Date() },
      ipAddress
    );

    return true;
  }

  async completeWork(
    taskId: string,
    operatorId: string,
    data: z.infer<typeof completeWorkSchema>,
    photos: string[] = [],
    ipAddress: string = '127.0.0.1'
  ): Promise<any> {
    const validation = completeWorkSchema.safeParse(data);
    if (!validation.success) {
      throw new Error(validation.error.errors[0].message);
    }

    const task = await this.getTaskById(taskId, operatorId);
    if (!task) {
      throw new Error('任务不存在');
    }
    if (task.status !== 'in_progress') {
      throw new Error('只有进行中的任务可以完成');
    }

    const trx = await db.transaction();

    try {
      await trx('work_orders')
        .where({ id: taskId })
        .update({
          status: 'completed',
          completed_at: new Date()
        });

      const recordId = uuidv4();
      await trx('work_records').insert({
        id: recordId,
        reservation_id: task.reservation_id,
        work_order_id: taskId,
        equipment_id: task.equipment_id,
        field_id: task.field_id,
        operator_id: operatorId,
        fuel_consumption: data.fuel_consumption,
        work_hours: data.work_hours,
        field_photos: JSON.stringify(photos),
        notes: data.notes || null,
        completed_at: new Date()
      });

      await trx('reservations')
        .where({ id: task.reservation_id })
        .update({
          status: 'completed',
          updated_at: new Date()
        });

      await trx('equipment')
        .where({ id: task.equipment_id })
        .update({
          status: 'available',
          total_hours: db.raw('total_hours + ?', [data.work_hours])
        });

      const { calculatePrice } = require('../utils/price');
      const priceInfo = calculatePrice(data.work_hours, task.price_type, parseFloat(task.field_area));
      const fuelCost = data.fuel_consumption * 8;

      const settlementId = uuidv4();
      await trx('settlements').insert({
        id: settlementId,
        reservation_id: task.reservation_id,
        member_id: task.member_id,
        price_type: task.price_type,
        base_price: priceInfo.basePrice,
        price_multiplier: priceInfo.multiplier,
        fuel_cost: fuelCost,
        total_amount: priceInfo.totalAmount + fuelCost,
        status: 'pending',
        created_at: new Date()
      });

      await trx.commit();

      await logAudit(
        operatorId,
        'complete_work',
        'work_order',
        taskId,
        { status: task.status },
        { 
          status: 'completed', 
          work_hours: data.work_hours,
          fuel_consumption: data.fuel_consumption,
          settlement_id: settlementId
        },
        ipAddress
      );

      return {
        work_record_id: recordId,
        settlement_id: settlementId
      };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async uploadPhoto(
    taskId: string,
    operatorId: string,
    fileData: Buffer,
    filename: string,
    mimetype: string
  ): Promise<string> {
    if (!config.upload.allowedTypes.includes(mimetype)) {
      throw new Error('不支持的文件类型，仅支持 JPG、PNG 格式');
    }

    const ext = path.extname(filename) || '.jpg';
    const newFilename = `${taskId}_${Date.now()}_${uuidv4().slice(0, 8)}${ext}`;
    const filePath = path.join(process.cwd(), config.upload.dir, newFilename);

    fs.writeFileSync(filePath, fileData);

    return `/uploads/${newFilename}`;
  }

  async getTaskPhotos(taskId: string): Promise<string[]> {
    const record = await db('work_records')
      .where('work_order_id', taskId)
      .select('field_photos')
      .first();

    if (record && record.field_photos) {
      try {
        return JSON.parse(record.field_photos);
      } catch (e) {
        return [];
      }
    }
    return [];
  }
}
