import db from '@adonisjs/lucid/services/db'
import Appointment from '#models/appointment'
import AppointmentItem from '#models/appointment_item'
import ServiceConsumable from '#models/service_consumable'
import Consumption from '#models/consumption'
import InventoryService from './inventory_service.js'
import ChangeLogService from './change_log_service.js'
import { DateTime } from 'luxon'

export default class AppointmentService {
  public static async createAppointment(data: {
    customerName: string
    customerPhone: string
    consultantId: number
    appointmentDate: string
    startTime: string
    endTime: string
    notes?: string
    serviceIds: number[]
  }) {
    return db.transaction(async (trx) => {
      const appointment = await Appointment.create(
        {
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          consultantId: data.consultantId,
          appointmentDate: DateTime.fromISO(data.appointmentDate),
          startTime: data.startTime,
          endTime: data.endTime,
          notes: data.notes || null,
          status: 'scheduled',
        },
        { client: trx }
      )

      let totalAmount = 0

      for (const serviceId of data.serviceIds) {
        const consumables = await ServiceConsumable.query({ client: trx }).where(
          'serviceId',
          serviceId
        )

        for (const consumable of consumables) {
          const product = await consumable.related('product').query({ client: trx }).first()
          if (product && product.currentStock < consumable.quantity) {
            throw new Error(
              `库存不足: 产品 ${product.name} 当前库存 ${product.currentStock}, 服务需要 ${consumable.quantity}`
            )
          }
        }

        const service = await consumables[0]?.related('service').query({ client: trx }).first()
        const price = service?.price || 0
        totalAmount += price

        await AppointmentItem.create(
          {
            appointmentId: appointment.id,
            serviceId,
            price,
            status: 'pending',
          },
          { client: trx }
        )
      }

      appointment.totalAmount = totalAmount
      await appointment.useTransaction(trx).save()

      await ChangeLogService.logChange(
        'appointment',
        appointment.id,
        'create',
        null,
        null,
        null,
        data.consultantId,
        trx
      )

      return appointment
    })
  }

  public static async startService(appointmentItemId: number, operatorId: number) {
    return db.transaction(async (trx) => {
      const item = await AppointmentItem.query({ client: trx })
        .where('id', appointmentItemId)
        .preload('service')
        .firstOrFail()

      if (item.status !== 'pending') {
        throw new Error(`服务项状态不允许开始: 当前状态 ${item.status}`)
      }

      item.status = 'in_progress'
      await item.useTransaction(trx).save()

      const consumables = await ServiceConsumable.query({ client: trx }).where(
        'serviceId',
        item.serviceId
      )

      for (const consumable of consumables) {
        await InventoryService.stockOut(
          consumable.productId,
          Number(consumable.quantity),
          operatorId,
          `预约服务消耗: ${item.service.name}`,
          item.appointmentId
        )

        await Consumption.create(
          {
            appointmentItemId: item.id,
            productId: consumable.productId,
            quantity: consumable.quantity,
            unit: consumable.unit,
            operatorId,
          },
          { client: trx }
        )
      }

      await ChangeLogService.logChange(
        'appointment_item',
        item.id,
        'update',
        'status',
        'pending',
        'in_progress',
        operatorId,
        trx
      )

      return item
    })
  }

  public static async completeService(appointmentItemId: number, operatorId: number) {
    const item = await AppointmentItem.findOrFail(appointmentItemId)

    if (item.status !== 'in_progress') {
      throw new Error(`服务项状态不允许完成: 当前状态 ${item.status}`)
    }

    item.status = 'completed'
    await item.save()

    await ChangeLogService.logChange(
      'appointment_item',
      item.id,
      'update',
      'status',
      'in_progress',
      'completed',
      operatorId
    )

    const appointment = await Appointment.findOrFail(item.appointmentId)
    const allItems = await AppointmentItem.query().where('appointmentId', appointment.id)
    const allCompleted = allItems.every((i) => i.status === 'completed' || i.status === 'no_show')

    if (allCompleted) {
      appointment.status = 'completed'
      await appointment.save()

      await ChangeLogService.logChange(
        'appointment',
        appointment.id,
        'update',
        'status',
        'in_progress',
        'completed',
        operatorId
      )
    }

    return item
  }

  public static async markNoShow(appointmentId: number, operatorId: number) {
    const appointment = await Appointment.findOrFail(appointmentId)

    if (appointment.status !== 'scheduled') {
      throw new Error(`预约状态不允许标记缺席: 当前状态 ${appointment.status}`)
    }

    appointment.status = 'no_show'
    await appointment.save()

    const items = await AppointmentItem.query().where('appointmentId', appointmentId)
    for (const item of items) {
      if (item.status === 'pending') {
        item.status = 'no_show'
        await item.save()
      }
    }

    await ChangeLogService.logChange(
      'appointment',
      appointment.id,
      'update',
      'status',
      'scheduled',
      'no_show',
      operatorId
    )

    return appointment
  }
}
