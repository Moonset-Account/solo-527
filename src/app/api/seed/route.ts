import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateOrderNo } from '@/lib/utils'
import { createLog } from '@/lib/logger'
import { BillType, BillStatus, Role, WorkOrderType, WorkOrderPriority, WorkOrderStatus } from '@prisma/client'

export async function POST() {
  try {
    const existing = await prisma.user.count()
    if (existing > 0) {
      return NextResponse.json({ message: 'Seed data already exists' }, { status: 400 })
    }

    const hashedPwd = await hashPassword('123456')

    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: '系统管理员',
        password: hashedPwd,
        phone: '13800138000',
        role: Role.ADMIN,
      },
    })

    const cs = await prisma.user.create({
      data: {
        email: 'cs@example.com',
        name: '张客服',
        password: hashedPwd,
        phone: '13800138001',
        role: Role.CUSTOMER_SERVICE,
      },
    })

    const engineer = await prisma.user.create({
      data: {
        email: 'engineer@example.com',
        name: '李工程师',
        password: hashedPwd,
        phone: '13800138002',
        role: Role.ENGINEER,
      },
    })

    const apartments: { id: string }[] = []
    for (let i = 1; i <= 5; i++) {
      for (let j = 1; j <= 2; j++) {
        const apt = await prisma.apartment.create({
          data: {
            unitNumber: `A${i}0${j}`,
            building: 'A栋',
            floor: i,
            room: `0${j}`,
            area: 85 + Math.random() * 40,
          },
        })
        apartments.push(apt)
      }
    }

    const residents: { id: string }[] = []
    for (let i = 0; i < 5; i++) {
      const resident = await prisma.user.create({
        data: {
          email: `resident${i + 1}@example.com`,
          name: `住户${i + 1}`,
          password: hashedPwd,
          phone: `1390013800${i}`,
          role: Role.RESIDENT,
          apartments: {
            connect: { id: apartments[i].id },
          },
        },
      })
      residents.push(resident)
    }

    const billTypes: BillType[] = [BillType.RENT, BillType.WATER, BillType.ELECTRICITY, BillType.PROPERTY_MANAGEMENT]
    const billTitles: Record<BillType, string> = {
      RENT: '月度租金',
      WATER: '水费',
      ELECTRICITY: '电费',
      GAS: '燃气费',
      INTERNET: '网络费',
      PROPERTY_MANAGEMENT: '物业管理费',
      MAINTENANCE: '维修费',
      OTHER: '其他费用',
    }

    for (let i = 0; i < residents.length; i++) {
      const now = new Date()
      for (let j = 0; j < billTypes.length; j++) {
        const type = billTypes[j]
        const dueDate = new Date(now)
        dueDate.setDate(dueDate.getDate() + (j % 2 === 0 ? 15 : -5))

        const amount = type === BillType.RENT ? 3500 : 100 + Math.random() * 400
        const isPaid = j < 2

        const bill = await prisma.bill.create({
          data: {
            billNo: generateOrderNo('B'),
            apartmentId: apartments[i].id,
            residentId: residents[i].id,
            type,
            title: billTitles[type],
            description: `${billTitles[type]} - ${now.getFullYear()}年${now.getMonth() + 1}月`,
            amount,
            paidAmount: isPaid ? amount : 0,
            status: isPaid ? BillStatus.PAID : (dueDate < now ? BillStatus.OVERDUE : BillStatus.PENDING),
            issueDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            dueDate,
            periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
            periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
            paidDate: isPaid ? new Date() : null,
          },
        })

        if (isPaid) {
          await prisma.payment.create({
            data: {
              billId: bill.id,
              userId: residents[i].id,
              amount,
              method: 'ALIPAY',
              transactionNo: `TXN${Date.now()}${j}`,
              paidAt: new Date(),
            },
          })
        }
      }
    }

    await prisma.workOrder.createMany({
      data: [
        {
          orderNo: generateOrderNo('WO'),
          type: WorkOrderType.REPAIR,
          title: '空调维修',
          description: '客厅空调制冷效果差，需要检查维修',
          priority: WorkOrderPriority.HIGH,
          status: WorkOrderStatus.ASSIGNED,
          apartmentId: apartments[0].id,
          creatorId: residents[0].id,
          assigneeId: engineer.id,
          expectedComplete: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
        {
          orderNo: generateOrderNo('WO'),
          type: WorkOrderType.MAINTENANCE,
          title: '水管漏水报修',
          description: '厨房水龙头接口处持续漏水',
          priority: WorkOrderPriority.URGENT,
          status: WorkOrderStatus.OVERDUE,
          apartmentId: apartments[1].id,
          creatorId: residents[1].id,
          assigneeId: engineer.id,
          isOverdue: true,
          overdueReason: '配件缺货，等待供应商发货',
          expectedComplete: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          orderNo: generateOrderNo('WO'),
          type: WorkOrderType.COMPLAINT,
          title: '电梯故障',
          description: '电梯运行时有异响，乘坐体验差',
          priority: WorkOrderPriority.MEDIUM,
          status: WorkOrderStatus.PENDING,
          apartmentId: apartments[2].id,
          creatorId: residents[2].id,
        },
      ],
    })

    const overdueOrder = await prisma.workOrder.findFirst({
      where: { status: WorkOrderStatus.OVERDUE },
    })

    if (overdueOrder) {
      await prisma.workOrderException.create({
        data: {
          workOrderId: overdueOrder.id,
          impactScope: '整栋楼供水系统',
          affectedAreas: 'A栋1-5层厨房用水',
          handlerId: cs.id,
          nextStep: '1. 联系供应商加急配送配件; 2. 临时安排备用水管; 3. 通知受影响住户',
        },
      })
    }

    for (let i = 0; i < 3; i++) {
      const visitDate = new Date()
      visitDate.setDate(visitDate.getDate() + i)

      await prisma.visitorAppointment.create({
        data: {
          apartmentId: apartments[i].id,
          hostId: residents[i].id,
          visitorName: ['王师傅', '快递员小李', '家政张阿姨'][i],
          visitorPhone: `1500000000${i}`,
          visitorIdCard: `1101011990010${i}001${i}`,
          visitDate,
          visitStartTime: new Date(visitDate.setHours(9 + i * 2, 0, 0, 0)),
          visitEndTime: new Date(visitDate.setHours(11 + i * 2, 0, 0, 0)),
          purpose: ['家电维修', '快递送达', '家政服务'][i],
          visitorCount: 1,
          status: i === 0 ? 'APPROVED' : 'PENDING',
        },
      })
    }

    return NextResponse.json({
      message: 'Seed data created successfully',
      accounts: {
        admin: 'admin@example.com / 123456',
        customerService: 'cs@example.com / 123456',
        engineer: 'engineer@example.com / 123456',
        resident: 'resident1@example.com / 123456',
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 })
  }
}
