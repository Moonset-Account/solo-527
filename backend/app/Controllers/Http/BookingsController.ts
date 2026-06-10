import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Booking from 'App/Models/Booking'
import Customer from 'App/Models/Customer'
import TimeSlot from 'App/Models/TimeSlot'
import BookingNote from 'App/Models/BookingNote'
import BookingAttachment from 'App/Models/BookingAttachment'
import ChangeHistory from 'App/Models/ChangeHistory'
import ExceptionTodo from 'App/Models/ExceptionTodo'
import Service from 'App/Models/Service'
import Application from '@ioc:Adonis/Core/Application'
import { DateTime } from 'luxon'
import ExcelJS from 'exceljs'

export default class BookingsController {
  public async index({ request, response }: HttpContextContract) {
    const page = Number(request.input('page', 1))
    const perPage = Number(request.input('perPage', 20))
    const keyword = request.input('keyword', '')
    const status = request.input('status', '')
    const startDate = request.input('startDate', '')
    const endDate = request.input('endDate', '')
    const staffId = request.input('staffId', '')
    const onlyNoShow = request.input('onlyNoShow', '0')

    let query = Booking.query()
      .preload('customer')
      .preload('staff')
      .preload('service')

    if (keyword) {
      query.whereHas('customer', (q) => {
        q.where('name', 'like', `%${keyword}%`).orWhere('phone', 'like', `%${keyword}%`)
      }).orWhere('booking_no', 'like', `%${keyword}%`)
    }

    if (status) {
      query.where('status', status)
    }

    if (startDate) {
      query.where('booking_date', '>=', startDate)
    }

    if (endDate) {
      query.where('booking_date', '<=', endDate)
    }

    if (staffId) {
      query.where('staff_id', Number(staffId))
    }

    if (onlyNoShow === '1') {
      query.where('is_no_show', true)
    }

    query.orderBy('booking_date', 'desc').orderBy('start_time', 'asc')

    const data = await query.paginate(page, perPage)
    return response.ok({ data })
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const {
      customerName,
      customerPhone,
      gender,
      age,
      medicalHistory,
      timeSlotId,
      staffId,
      serviceId,
      bookingDate,
      startTime,
      endTime,
      amount,
      source,
      remark,
    } = request.all()

    let customer = await Customer.findBy('phone', customerPhone)
    if (!customer) {
      customer = await Customer.create({
        name: customerName,
        phone: customerPhone,
        gender: gender || '',
        age: age ? Number(age) : null,
        medicalHistory: medicalHistory || '',
        totalBookings: 1,
        noShowCount: 0,
        noShowRate: 0,
      })
    } else {
      customer.totalBookings = (customer.totalBookings || 0) + 1
      customer.noShowRate = customer.totalBookings > 0
        ? customer.noShowCount / customer.totalBookings
        : 0
      await customer.save()
    }

    const service = await Service.find(serviceId)

    const booking = await Booking.create({
      customerId: customer.id,
      timeSlotId: timeSlotId ? Number(timeSlotId) : null,
      staffId: Number(staffId),
      serviceId: Number(serviceId),
      bookingDate: DateTime.fromISO(bookingDate),
      startTime,
      endTime: endTime || this.addMinutes(startTime, service?.durationMinutes || 30),
      status: 'pending',
      amount: Number(amount || service?.price || 0),
      paymentStatus: 'unpaid',
      isNoShow: false,
      source: source || 'front_desk',
      remark: remark || '',
      createdBy: auth.user?.id,
      changeCount: 0,
    })

    if (timeSlotId) {
      const slot = await TimeSlot.find(timeSlotId)
      if (slot) {
        slot.bookedCount = slot.bookedCount + 1
        if (slot.bookedCount >= slot.capacity) {
          slot.status = 'full'
        }
        await slot.save()
      }
    }

    await booking.load('customer')
    await booking.load('staff')
    await booking.load('service')

    return response.created({ data: booking, message: '预约创建成功' })
  }

  public async show({ params, response }: HttpContextContract) {
    const booking = await Booking.query()
      .where('id', params.id)
      .preload('customer')
      .preload('staff')
      .preload('service')
      .preload('creator')
      .firstOrFail()

    return response.ok({ data: booking })
  }

  public async update({ auth, params, request, response }: HttpContextContract) {
    const booking = await Booking.findOrFail(params.id)
    const changes = request.all()
    const changedFields: string[] = []

    const trackFields = ['staffId', 'serviceId', 'bookingDate', 'startTime', 'endTime', 'status', 'amount', 'paymentStatus', 'remark']
    for (const field of trackFields) {
      if (changes[field] !== undefined && changes[field] !== (booking as any)[field]) {
        const oldVal = (booking as any)[field]
        const newVal = field === 'bookingDate' ? DateTime.fromISO(changes[field]).toISODate() : changes[field]

        await ChangeHistory.create({
          bookingId: booking.id,
          fieldName: field,
          oldValue: String(oldVal ?? ''),
          newValue: String(newVal ?? ''),
          changedBy: auth.user?.id,
          changeReason: changes.reason || '修改预约信息',
        })
        changedFields.push(field)
        ;(booking as any)[field] = newVal
      }
    }

    if (changes.customerName || changes.customerPhone) {
      const customer = await Customer.find(booking.customerId)
      if (customer) {
        if (changes.customerName && changes.customerName !== customer.name) {
          customer.name = changes.customerName
        }
        if (changes.customerPhone && changes.customerPhone !== customer.phone) {
          customer.phone = changes.customerPhone
        }
        await customer.save()
      }
    }

    if (changes.timeSlotId && Number(changes.timeSlotId) !== booking.timeSlotId) {
      if (booking.timeSlotId) {
        const oldSlot = await TimeSlot.find(booking.timeSlotId)
        if (oldSlot) {
          oldSlot.bookedCount = Math.max(0, oldSlot.bookedCount - 1)
          if (oldSlot.bookedCount < oldSlot.capacity) {
            oldSlot.status = 'available'
          }
          await oldSlot.save()
        }
      }
      booking.timeSlotId = Number(changes.timeSlotId)
      const newSlot = await TimeSlot.find(changes.timeSlotId)
      if (newSlot) {
        newSlot.bookedCount = newSlot.bookedCount + 1
        if (newSlot.bookedCount >= newSlot.capacity) {
          newSlot.status = 'full'
        }
        await newSlot.save()
      }
    }

    if (changedFields.length > 0) {
      booking.changeCount = booking.changeCount + 1
      booking.lastChangedAt = DateTime.now()
    }

    if (changes.status === 'completed' && booking.status !== 'completed') {
      booking.completedAt = DateTime.now()
      const customer = await Customer.find(booking.customerId)
      if (customer) {
        customer.lastVisit = DateTime.now()
        await customer.save()
      }
    }

    if (changes.status === 'cancelled' && booking.status !== 'cancelled') {
      booking.cancelledAt = DateTime.now()
      if (booking.timeSlotId) {
        const slot = await TimeSlot.find(booking.timeSlotId)
        if (slot) {
          slot.bookedCount = Math.max(0, slot.bookedCount - 1)
          if (slot.bookedCount < slot.capacity) {
            slot.status = 'available'
          }
          await slot.save()
        }
      }
    }

    if (changes.paymentStatus === 'paid' && booking.paymentStatus !== 'paid') {
      booking.paidAt = DateTime.now()
    }

    await booking.save()
    await booking.load('customer')
    await booking.load('staff')
    await booking.load('service')

    return response.ok({ data: booking, message: '预约更新成功', changedFields })
  }

  public async updateStatus({ auth, params, request, response }: HttpContextContract) {
    const booking = await Booking.findOrFail(params.id)
    const { status, isNoShow, paymentStatus, reason } = request.all()

    const oldStatus = booking.status
    if (status && status !== oldStatus) {
      await ChangeHistory.create({
        bookingId: booking.id,
        fieldName: 'status',
        oldValue: oldStatus,
        newValue: status,
        changedBy: auth.user?.id ?? null,
        changeReason: reason || `状态变更: ${oldStatus} -> ${status}`,
      })
      booking.status = status
      booking.changeCount = booking.changeCount + 1
      booking.lastChangedAt = DateTime.now()

      if (status === 'arrived') {
        booking.arrivedAt = DateTime.now()
      } else if (status === 'completed') {
        booking.completedAt = DateTime.now()
        const customer = await Customer.find(booking.customerId)
        if (customer) {
          customer.lastVisit = DateTime.now()
          await customer.save()
        }
      } else if (status === 'cancelled') {
        booking.cancelledAt = DateTime.now()
        if (booking.timeSlotId) {
          const slot = await TimeSlot.find(booking.timeSlotId)
          if (slot) {
            slot.bookedCount = Math.max(0, slot.bookedCount - 1)
            if (slot.bookedCount < slot.capacity) {
              slot.status = 'available'
            }
            await slot.save()
          }
        }
      }
    }

    if (paymentStatus && paymentStatus !== booking.paymentStatus) {
      const oldPaymentStatus = booking.paymentStatus
      await ChangeHistory.create({
        bookingId: booking.id,
        fieldName: 'paymentStatus',
        oldValue: oldPaymentStatus,
        newValue: paymentStatus,
        changedBy: auth.user?.id ?? null,
        changeReason: reason || `支付状态变更: ${oldPaymentStatus} -> ${paymentStatus}`,
      })
      booking.paymentStatus = paymentStatus
      booking.changeCount = booking.changeCount + 1
      booking.lastChangedAt = DateTime.now()

      if (paymentStatus === 'paid' && oldPaymentStatus !== 'paid') {
        booking.paidAt = DateTime.now()
      }
    }

    if (isNoShow !== undefined) {
      const oldNoShow = booking.isNoShow
      if (isNoShow !== oldNoShow) {
        booking.isNoShow = isNoShow
        const customer = await Customer.find(booking.customerId)
        if (customer) {
          if (isNoShow) {
            customer.noShowCount = customer.noShowCount + 1
          } else {
            customer.noShowCount = Math.max(0, customer.noShowCount - 1)
          }
          customer.totalBookings = customer.totalBookings > 0 ? customer.totalBookings : 1
          customer.noShowRate = customer.totalBookings > 0
            ? customer.noShowCount / customer.totalBookings
            : 0
          await customer.save()
        }

        if (isNoShow) {
          await ExceptionTodo.create({
            type: 'no_show',
            title: `爽约提醒 - ${booking.bookingNo}`,
            description: `客户爽约，预约号：${booking.bookingNo}，请联系客户确认情况`,
            bookingId: booking.id,
            customerId: booking.customerId,
            priority: 'high',
            status: 'pending',
          })
        }
      }
    }

    await booking.save()
    return response.ok({ data: booking, message: '状态更新成功' })
  }

  public async destroy({ params, response }: HttpContextContract) {
    const booking = await Booking.findOrFail(params.id)
    if (booking.timeSlotId) {
      const slot = await TimeSlot.find(booking.timeSlotId)
      if (slot) {
        slot.bookedCount = Math.max(0, slot.bookedCount - 1)
        if (slot.bookedCount < slot.capacity) {
          slot.status = 'available'
        }
        await slot.save()
      }
    }
    await booking.delete()
    return response.ok({ message: '预约已删除' })
  }

  public async addNote({ auth, params, request, response }: HttpContextContract) {
    const { content, type } = request.all()
    const note = await BookingNote.create({
      bookingId: Number(params.id),
      content,
      type: type || 'normal',
      createdBy: auth.user?.id,
    })
    await note.load('creator')
    return response.created({ data: note, message: '备注添加成功' })
  }

  public async getNotes({ params, response }: HttpContextContract) {
    const notes = await BookingNote.query()
      .where('booking_id', params.id)
      .preload('creator')
      .orderBy('created_at', 'desc')
    return response.ok({ data: notes })
  }

  public async uploadAttachment({ auth, params, request, response }: HttpContextContract) {
    const file = request.file('file', {
      size: '10mb',
      extnames: ['jpg', 'png', 'jpeg', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx'],
    })

    if (!file) {
      return response.badRequest({ message: '请选择上传文件' })
    }

    if (!file.isValid) {
      return response.badRequest({ message: file.errors?.map(e => e.message).join(', ') || '文件验证失败' })
    }

    try {
      await file.move(Application.tmpPath('uploads'), {
        name: `${Date.now()}-${file.clientName}`,
        overwrite: true,
      })
    } catch {
      return response.internalServerError({ message: '文件移动失败' })
    }

    const attachment = await BookingAttachment.create({
      bookingId: Number(params.id),
      fileName: file.clientName,
      filePath: `/uploads/${file.fileName}`,
      fileType: file.extname || '',
      fileSize: file.size ? Number(file.size) : 0,
      uploadedBy: auth.user?.id ?? null,
    })

    return response.created({ data: attachment, message: '附件上传成功' })
  }

  public async getAttachments({ params, response }: HttpContextContract) {
    const attachments = await BookingAttachment.query()
      .where('booking_id', params.id)
      .preload('uploader')
      .orderBy('created_at', 'desc')
    return response.ok({ data: attachments })
  }

  public async getHistory({ params, response }: HttpContextContract) {
    const histories = await ChangeHistory.query()
      .where('booking_id', params.id)
      .preload('changer')
      .orderBy('created_at', 'desc')
    return response.ok({ data: histories })
  }

  public async exportList({ request, response }: HttpContextContract) {
    const startDate = request.input('startDate', '')
    const endDate = request.input('endDate', '')
    const status = request.input('status', '')

    let query = Booking.query()
      .preload('customer')
      .preload('staff')
      .preload('service')
      .withAggregate('changeHistories', (q) => q.count('*').as('total_changes'))

    if (startDate) query.where('booking_date', '>=', startDate)
    if (endDate) query.where('booking_date', '<=', endDate)
    if (status) query.where('status', status)

    const bookings = await query.orderBy('booking_date', 'desc')

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('预约列表')

    sheet.columns = [
      { header: '预约编号', key: 'bookingNo', width: 22 },
      { header: '预约日期', key: 'bookingDate', width: 12 },
      { header: '时段', key: 'timeRange', width: 14 },
      { header: '客户姓名', key: 'customerName', width: 12 },
      { header: '联系电话', key: 'customerPhone', width: 14 },
      { header: '服务项目', key: 'serviceName', width: 18 },
      { header: '医生/技师', key: 'staffName', width: 12 },
      { header: '状态', key: 'statusText', width: 10 },
      { header: '金额(元)', key: 'amount', width: 10 },
      { header: '支付状态', key: 'paymentStatusText', width: 10 },
      { header: '爽约率(%)', key: 'noShowRate', width: 11 },
      { header: '爽约次数', key: 'noShowCount', width: 10 },
      { header: '是否爽约', key: 'isNoShowText', width: 10 },
      { header: '最近变更', key: 'lastChangedAt', width: 20 },
      { header: '变更次数', key: 'changeCount', width: 10 },
      { header: '来源', key: 'sourceText', width: 10 },
      { header: '创建时间', key: 'createdAt', width: 20 },
      { header: '备注', key: 'remark', width: 30 },
    ]

    const statusMap: Record<string, string> = {
      pending: '待确认',
      confirmed: '已确认',
      arrived: '已到店',
      completed: '已完成',
      cancelled: '已取消',
    }
    const paymentMap: Record<string, string> = {
      unpaid: '未支付',
      pending: '支付处理中',
      paid: '已支付',
      failed: '支付失败',
      refunded: '已退款',
    }
    const sourceMap: Record<string, string> = {
      front_desk: '前台',
      online: '线上',
      phone: '电话',
      walk_in: '到店',
    }

    for (const booking of bookings) {
      sheet.addRow({
        bookingNo: booking.bookingNo,
        bookingDate: booking.bookingDate.toISODate(),
        timeRange: `${booking.startTime}-${booking.endTime}`,
        customerName: booking.customer?.name || '',
        customerPhone: booking.customer?.phone || '',
        serviceName: booking.service?.name || '',
        staffName: booking.staff?.name || '',
        statusText: statusMap[booking.status] || booking.status,
        amount: booking.amount,
        paymentStatusText: paymentMap[booking.paymentStatus] || booking.paymentStatus,
        noShowRate: booking.customer ? (booking.customer.noShowRate * 100).toFixed(1) : '0',
        noShowCount: booking.customer?.noShowCount || 0,
        isNoShowText: booking.isNoShow ? '是' : '否',
        lastChangedAt: booking.lastChangedAt ? booking.lastChangedAt.toFormat('yyyy-MM-dd HH:mm:ss') : '-',
        changeCount: booking.changeCount,
        sourceText: sourceMap[booking.source] || booking.source,
        createdAt: booking.createdAt.toFormat('yyyy-MM-dd HH:mm:ss'),
        remark: booking.remark || '',
      })
    }

    const fileName = `预约导出_${DateTime.now().toFormat('yyyyMMddHHmmss')}.xlsx`
    response.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response.header('Content-Disposition', `attachment; filename="${fileName}"`)

    await workbook.xlsx.write(response.response)
    response.response.end()
  }

  public async noShowList({ request, response }: HttpContextContract) {
    const page = Number(request.input('page', 1))
    const perPage = Number(request.input('perPage', 20))
    const minRate = Number(request.input('minRate', 0))

    let query = Customer.query()
      .where('no_show_rate', '>=', minRate)
      .orWhere('no_show_count', '>', 0)
      .orderBy('no_show_rate', 'desc')

    const data = await query.paginate(page, perPage)
    return response.ok({ data })
  }

  private addMinutes(time: string, minutes: number): string {
    const [h, m] = time.split(':').map(Number)
    const total = h * 60 + m + minutes
    const nh = Math.floor(total / 60) % 24
    const nm = total % 60
    return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
  }
}
