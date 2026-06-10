import { PrismaClient, UserRole, UserStatus, VehicleType, RiderStatus, CreditLevel, OrderType, OrderPriority, OrderStatus, TimelineEventType, OperatorType, DispatchType, OptimizedBy, AlertType, AlertLevel, AlertStatus, ClaimSourceType, ClaimType, ClaimStatus, ReportStatus, ExceptionStatus, BizType, ActionType, NotificationType } from '../app/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const districts = ['朝阳区', '海淀区', '东城区', '西城区', '丰台区', '通州区', '大兴区', '昌平区']
const riderNames = ['张伟', '李强', '王磊', '刘洋', '陈刚', '杨帆', '赵鹏', '周涛', '吴斌', '郑浩']
const customerCompanies = ['顺丰优选北京仓', '京东冷链物流中心', '盒马鲜生朝阳店', '每日优鲜海淀站', '物美超市大兴店', '永辉超市通州店', '家乐福丰台店', '沃尔玛昌平店']
const contactNames = ['张经理', '李主管', '王主任', '刘组长', '陈部长', '杨总', '赵经理', '周主管']

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDecimal(min: number, max: number, digits: number = 2): string {
  return (Math.random() * (max - min) + min).toFixed(digits)
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

async function main() {
  console.log('🚀 开始清空数据...')
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.processingNote.deleteMany(),
    prisma.processingView.deleteMany(),
    prisma.userRole.deleteMany(),
    prisma.role.deleteMany(),
    prisma.apiExceptionLog.deleteMany(),
    prisma.temperatureSafetyReport.deleteMany(),
    prisma.claimOrder.deleteMany(),
    prisma.temperatureAlert.deleteMany(),
    prisma.temperatureRecord.deleteMany(),
    prisma.riderLocation.deleteMany(),
    prisma.routePlan.deleteMany(),
    prisma.dispatchRecord.deleteMany(),
    prisma.orderTimeline.deleteMany(),
    prisma.deliveryOrder.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.rider.deleteMany(),
    prisma.user.deleteMany(),
  ])
  console.log('✅ 数据清空完成')

  console.log('🚀 开始生成种子数据...')

  const passwordHash = bcrypt.hashSync('123456', 10)

  const users = await prisma.$transaction([
    prisma.user.create({
      data: {
        username: 'admin',
        passwordHash,
        realName: '系统管理员',
        phone: '13800000001',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        remark: '超级管理员账户',
      },
    }),
    prisma.user.create({
      data: {
        username: 'dispatcher',
        passwordHash,
        realName: '张调度',
        phone: '13800000002',
        role: UserRole.DISPATCHER,
        status: UserStatus.ACTIVE,
        remark: '调度员账户',
      },
    }),
    prisma.user.create({
      data: {
        username: 'supervisor',
        passwordHash,
        realName: '李主管',
        phone: '13800000003',
        role: UserRole.SUPERVISOR,
        status: UserStatus.ACTIVE,
        remark: '主管账户',
      },
    }),
  ])
  console.log('✅ 用户数据完成 (3条)')

  const [adminUser, dispatcherUser, supervisorUser] = users

  const roles = await prisma.$transaction([
    prisma.role.create({
      data: {
        code: 'ADMIN',
        name: '系统管理员',
        description: '拥有系统全部权限',
        permissions: { all: true },
        isSystem: true,
      },
    }),
    prisma.role.create({
      data: {
        code: 'DISPATCHER',
        name: '调度员',
        description: '负责订单调度分派',
        permissions: { dispatch: true, order: true },
        isSystem: true,
      },
    }),
    prisma.role.create({
      data: {
        code: 'SUPERVISOR',
        name: '运营主管',
        description: '负责运营管理和审核',
        permissions: { dispatch: true, order: true, report: true, audit: true },
        isSystem: true,
      },
    }),
  ])
  console.log('✅ 角色数据完成 (3条)')

  await prisma.$transaction([
    prisma.userRole.create({ data: { userId: adminUser.id, roleId: roles[0].id } }),
    prisma.userRole.create({ data: { userId: dispatcherUser.id, roleId: roles[1].id } }),
    prisma.userRole.create({ data: { userId: supervisorUser.id, roleId: roles[2].id } }),
  ])
  console.log('✅ 用户角色关联完成 (3条)')

  const riderDataList = []
  for (let i = 0; i < 10; i++) {
    riderDataList.push({
      riderNo: `R${String(i + 1).padStart(4, '0')}`,
      realName: riderNames[i],
      phone: `139${String(10000000 + i).slice(0, 8)}`,
      idCardNo: `110101${1990 + (i % 10)}${String((i % 12) + 1).padStart(2, '0')}${String((i % 28) + 1).padStart(2, '0')}${String(1000 + i).slice(-4)}`,
      vehicleType: [VehicleType.MOTORCYCLE, VehicleType.ELECTRIC_BIKE, VehicleType.VAN][i % 3],
      plateNo: i % 3 === 2 ? `京A${String(10000 + i)}` : `北京电动${String(10000 + i)}`,
      status: i < 6 ? RiderStatus.ONLINE : (i < 8 ? RiderStatus.BUSY : (i === 8 ? RiderStatus.REST : RiderStatus.OFFLINE)),
      currentLng: (116.3 + i * 0.02).toFixed(6),
      currentLat: (39.9 + i * 0.01).toFixed(6),
      currentDistrict: districts[i % districts.length],
      totalOrders: randomInt(50, 500),
      rating: (4.5 + Math.random() * 0.5).toFixed(2),
      joinedAt: new Date(2024, i % 12, 1),
      remark: i === 0 ? '金牌骑手' : undefined,
    })
  }
  const createdRiders = []
  for (const data of riderDataList) {
    createdRiders.push(await prisma.rider.create({ data }))
  }
  console.log('✅ 骑手数据完成 (10条)')

  const customerDataList = []
  for (let i = 0; i < 8; i++) {
    customerDataList.push({
      customerNo: `C${String(i + 1).padStart(4, '0')}`,
      companyName: customerCompanies[i],
      contactName: contactNames[i],
      phone: `010${String(80000000 + i * 1000).slice(0, 8)}`,
      address: `北京市${districts[i % districts.length]}某某路${i + 1}号`,
      lng: (116.25 + i * 0.03).toFixed(6),
      lat: (39.85 + i * 0.015).toFixed(6),
      district: districts[i % districts.length],
      creditLevel: [CreditLevel.A, CreditLevel.A, CreditLevel.B, CreditLevel.B, CreditLevel.B, CreditLevel.C, CreditLevel.C, CreditLevel.D][i],
      status: 1,
      remark: i < 2 ? 'VIP客户' : undefined,
    })
  }
  const createdCustomers = []
  for (const data of customerDataList) {
    createdCustomers.push(await prisma.customer.create({ data }))
  }
  console.log('✅ 客户数据完成 (8条)')

  const orderStatuses = [
    OrderStatus.PENDING_ACCEPT,
    OrderStatus.ACCEPTED,
    OrderStatus.ASSIGNED,
    OrderStatus.PICKED_UP,
    OrderStatus.IN_TRANSIT,
    OrderStatus.IN_TRANSIT,
    OrderStatus.ARRIVED,
    OrderStatus.DELIVERED,
    OrderStatus.DELIVERED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
    OrderStatus.EXCEPTION,
    OrderStatus.PENDING_ACCEPT,
    OrderStatus.ASSIGNED,
    OrderStatus.IN_TRANSIT,
    OrderStatus.DELIVERED,
    OrderStatus.PICKED_UP,
    OrderStatus.ASSIGNED,
    OrderStatus.URGENCY ? OrderStatus.IN_TRANSIT : OrderStatus.DELIVERED,
    OrderStatus.DELIVERED,
  ]
  const orderTypes = [OrderType.NORMAL, OrderType.NORMAL, OrderType.URGENCY, OrderType.COLD_CHAIN, OrderType.COLD_CHAIN, OrderType.FRAGILE, OrderType.NORMAL, OrderType.NORMAL, OrderType.URGENCY, OrderType.COLD_CHAIN, OrderType.NORMAL, OrderType.FRAGILE, OrderType.NORMAL, OrderType.COLD_CHAIN, OrderType.URGENCY, OrderType.NORMAL, OrderType.COLD_CHAIN, OrderType.NORMAL, OrderType.FRAGILE, OrderType.COLD_CHAIN]
  const priorities = [OrderPriority.LOW, OrderPriority.NORMAL, OrderPriority.HIGH, OrderPriority.URGENT, OrderPriority.HIGH, OrderPriority.NORMAL, OrderPriority.NORMAL, OrderPriority.LOW, OrderPriority.URGENT, OrderPriority.HIGH, OrderPriority.NORMAL, OrderPriority.HIGH, OrderPriority.LOW, OrderPriority.URGENT, OrderPriority.HIGH, OrderPriority.NORMAL, OrderPriority.HIGH, OrderPriority.NORMAL, OrderPriority.NORMAL, OrderPriority.URGENT]

  const createdOrders = []
  for (let i = 0; i < 20; i++) {
    const baseTime = addMinutes(new Date(), -i * 120)
    const customer = createdCustomers[i % createdCustomers.length]
    const rider = (orderStatuses[i] === OrderStatus.PENDING_ACCEPT || orderStatuses[i] === OrderStatus.ACCEPTED)
      ? null
      : createdRiders[i % createdRiders.length]
    const dispatcher = (orderStatuses[i] === OrderStatus.PENDING_ACCEPT) ? null : dispatcherUser
    const isColdChain = orderTypes[i] === OrderType.COLD_CHAIN

    const pickupEarliest = baseTime
    const pickupLatest = addHours(baseTime, 2)
    const deliveryEarliest = addHours(baseTime, 3)
    const deliveryLatest = addHours(baseTime, 6)

    let actualPickupAt: Date | null = null
    let actualArrivedAt: Date | null = null
    let actualDeliveredAt: Date | null = null
    let pickedUpAt: Date | null = null
    let inTransitAt: Date | null = null

    if ([OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT, OrderStatus.ARRIVED, OrderStatus.DELIVERED, OrderStatus.EXCEPTION].includes(orderStatuses[i])) {
      actualPickupAt = addHours(baseTime, randomInt(30, 90) / 60)
      pickedUpAt = actualPickupAt
    }
    if ([OrderStatus.IN_TRANSIT, OrderStatus.ARRIVED, OrderStatus.DELIVERED, OrderStatus.EXCEPTION].includes(orderStatuses[i])) {
      inTransitAt = addMinutes(actualPickupAt!, randomInt(5, 15))
    }
    if ([OrderStatus.ARRIVED, OrderStatus.DELIVERED, OrderStatus.EXCEPTION].includes(orderStatuses[i])) {
      actualArrivedAt = addHours(inTransitAt!, randomInt(30, 90) / 60)
    }
    if (orderStatuses[i] === OrderStatus.DELIVERED) {
      actualDeliveredAt = addMinutes(actualArrivedAt!, randomInt(5, 30))
    }

    createdOrders.push(
      await prisma.deliveryOrder.create({
        data: {
          orderNo: `SO${20260610}${String(i + 1).padStart(5, '0')}`,
          customerId: customer.id,
          riderId: rider?.id,
          dispatcherId: dispatcher?.id,
          orderType: orderTypes[i],
          priority: priorities[i],
          status: orderStatuses[i],
          temperatureRequired: isColdChain,
          minTemp: isColdChain ? '2.00' : undefined,
          maxTemp: isColdChain ? '8.00' : undefined,
          goodsDesc: isColdChain ? `冷链生鲜食品第${i + 1}批` : (orderTypes[i] === OrderType.FRAGILE ? `易碎品玻璃器皿第${i + 1}批` : `普通配送货物第${i + 1}批`),
          goodsWeight: randomDecimal(5, 100).toString(),
          goodsVolume: randomDecimal(0.1, 5, 3).toString(),
          pickupAddress: `北京市${districts[i % districts.length]}取货点${i + 1}号`,
          pickupLng: (116.2 + i * 0.025).toFixed(6),
          pickupLat: (39.8 + i * 0.012).toFixed(6),
          pickupContact: `${randomFromArray(['王先生', '李女士', '张经理', '陈主任'])}`,
          pickupPhone: `010${String(60000000 + i * 100).slice(0, 8)}`,
          pickupEarliest,
          pickupLatest,
          deliveryAddress: `北京市${districts[(i + 3) % districts.length]}送货点${i + 1}号`,
          deliveryLng: (116.35 + i * 0.02).toFixed(6),
          deliveryLat: (39.95 + i * 0.01).toFixed(6),
          deliveryContact: `${randomFromArray(['刘先生', '赵女士', '孙经理', '周主任'])}`,
          deliveryPhone: `010${String(70000000 + i * 100).slice(0, 8)}`,
          deliveryEarliest,
          deliveryLatest,
          actualPickupAt,
          actualArrivedAt,
          actualDeliveredAt,
          pickedUpAt,
          inTransitAt,
          distanceMeters: randomInt(2000, 25000),
          estimatedMinutes: randomInt(20, 120),
          feeAmount: randomDecimal(30, 500).toString(),
          payAmount: randomDecimal(30, 500).toString(),
          claimAmount: orderStatuses[i] === OrderStatus.EXCEPTION ? randomDecimal(50, 1000).toString() : undefined,
          sourceOrderNo: i % 5 === 0 ? `EXT${String(100000 + i)}` : undefined,
          remark: orderStatuses[i] === OrderStatus.CANCELLED ? '客户临时取消订单' : (orderStatuses[i] === OrderStatus.EXCEPTION ? '配送途中出现异常' : undefined),
        },
      })
    )
  }
  console.log('✅ 订单主表完成 (20条)')

  const createdTimelines = []
  for (let i = 0; i < createdOrders.length; i++) {
    const order = createdOrders[i]
    const baseTime = order.createdAt
    const timelines: any[] = []

    timelines.push({
      orderId: order.id,
      fromStatus: null,
      toStatus: OrderStatus.PENDING_ACCEPT,
      eventType: TimelineEventType.CREATE,
      operatorType: OperatorType.SYSTEM,
      remark: '系统创建订单',
      createdAt: baseTime,
    })

    if (order.status !== OrderStatus.PENDING_ACCEPT) {
      timelines.push({
        orderId: order.id,
        fromStatus: OrderStatus.PENDING_ACCEPT,
        toStatus: OrderStatus.ACCEPTED,
        eventType: TimelineEventType.ACCEPT,
        operatorId: dispatcherUser.id,
        operatorType: OperatorType.USER,
        remark: '调度员确认接单',
        createdAt: addMinutes(baseTime, randomInt(1, 10)),
      })
    }

    if (order.riderId && order.status !== OrderStatus.PENDING_ACCEPT && order.status !== OrderStatus.ACCEPTED) {
      timelines.push({
        orderId: order.id,
        fromStatus: OrderStatus.ACCEPTED,
        toStatus: OrderStatus.ASSIGNED,
        eventType: TimelineEventType.ASSIGN,
        operatorId: dispatcherUser.id,
        operatorType: OperatorType.USER,
        remark: '系统自动分派骑手',
        createdAt: addMinutes(baseTime, randomInt(10, 30)),
      })
    }

    if (order.pickedUpAt) {
      timelines.push({
        orderId: order.id,
        fromStatus: OrderStatus.ASSIGNED,
        toStatus: OrderStatus.PICKED_UP,
        eventType: TimelineEventType.PICKUP,
        operatorId: order.riderId,
        operatorType: OperatorType.RIDER,
        remark: '骑手已取货',
        locationLng: order.pickupLng,
        locationLat: order.pickupLat,
        createdAt: order.pickedUpAt,
      })
    }

    if (order.inTransitAt) {
      timelines.push({
        orderId: order.id,
        fromStatus: OrderStatus.PICKED_UP,
        toStatus: OrderStatus.IN_TRANSIT,
        eventType: TimelineEventType.IN_TRANSIT,
        operatorId: order.riderId,
        operatorType: OperatorType.RIDER,
        remark: '骑手开始配送',
        createdAt: order.inTransitAt,
      })
    }

    if (order.actualArrivedAt) {
      timelines.push({
        orderId: order.id,
        fromStatus: OrderStatus.IN_TRANSIT,
        toStatus: OrderStatus.ARRIVED,
        eventType: TimelineEventType.ARRIVE,
        operatorId: order.riderId,
        operatorType: OperatorType.RIDER,
        remark: '骑手已到达目的地',
        locationLng: order.deliveryLng,
        locationLat: order.deliveryLat,
        createdAt: order.actualArrivedAt,
      })
    }

    if (order.actualDeliveredAt) {
      timelines.push({
        orderId: order.id,
        fromStatus: OrderStatus.ARRIVED,
        toStatus: OrderStatus.DELIVERED,
        eventType: TimelineEventType.DELIVER,
        operatorId: order.riderId,
        operatorType: OperatorType.RIDER,
        remark: '订单已签收，配送完成',
        snapshotJson: { signType: '本人签收', receiver: '本人' },
        createdAt: order.actualDeliveredAt,
      })
    }

    if (order.status === OrderStatus.CANCELLED) {
      timelines.push({
        orderId: order.id,
        fromStatus: timelines[timelines.length - 1].toStatus,
        toStatus: OrderStatus.CANCELLED,
        eventType: TimelineEventType.CANCEL,
        operatorId: customer_service_user_fallback(dispatcherUser.id),
        operatorType: OperatorType.USER,
        remark: '客户申请取消订单，已审核通过',
        createdAt: addMinutes(baseTime, randomInt(60, 120)),
      })
    }

    if (order.status === OrderStatus.EXCEPTION) {
      timelines.push({
        orderId: order.id,
        fromStatus: timelines[timelines.length - 1].toStatus,
        toStatus: OrderStatus.EXCEPTION,
        eventType: TimelineEventType.EXCEPTION,
        operatorId: order.riderId,
        operatorType: OperatorType.RIDER,
        remark: '配送途中发生异常，已上报',
        createdAt: addMinutes(order.actualArrivedAt || addHours(baseTime, 3), randomInt(5, 20)),
      })
    }

    if (timelines.length < 4) {
      timelines.push({
        orderId: order.id,
        eventType: TimelineEventType.NOTE,
        operatorType: OperatorType.SYSTEM,
        remark: '订单已同步外部系统',
        createdAt: addMinutes(baseTime, randomInt(30, 60)),
      })
    }

    for (const t of timelines) {
      createdTimelines.push(await prisma.orderTimeline.create({ data: t }))
    }
  }
  console.log(`✅ 履约时效记录完成 (${createdTimelines.length}条)`)

  function customer_service_user_fallback(id: bigint) {
    return id
  }

  const createdDispatchRecords = []
  let dispatchCounter = 0
  for (let i = 0; i < createdOrders.length; i++) {
    const order = createdOrders[i]
    if (!order.riderId) continue

    const baseRecords = []
    baseRecords.push({
      orderId: order.id,
      riderId: order.riderId,
      dispatcherId: dispatcherUser.id,
      dispatchType: i % 3 === 0 ? DispatchType.MANUAL : DispatchType.AUTO,
      estimatedArrivalMinutes: randomInt(15, 60),
      createdAt: addMinutes(order.createdAt, randomInt(10, 30)),
    })

    if (i % 5 === 0 && createdRiders.length > 1) {
      const prevRider = createdRiders[(i + 3) % createdRiders.length]
      baseRecords.unshift({
        orderId: order.id,
        riderId: prevRider.id,
        dispatcherId: dispatcherUser.id,
        dispatchType: DispatchType.AUTO,
        estimatedArrivalMinutes: randomInt(20, 60),
        createdAt: addMinutes(order.createdAt, randomInt(5, 15)),
      })
      baseRecords.push({
        orderId: order.id,
        riderId: order.riderId,
        dispatcherId: dispatcherUser.id,
        dispatchType: DispatchType.REASSIGN,
        previousRiderId: prevRider.id,
        reason: '原骑手临时有事，进行改派',
        estimatedArrivalMinutes: randomInt(15, 45),
        createdAt: addMinutes(order.createdAt, randomInt(25, 40)),
      })
    }

    for (const r of baseRecords) {
      createdDispatchRecords.push(await prisma.dispatchRecord.create({ data: r }))
      dispatchCounter++
      if (dispatchCounter >= 20) break
    }
    if (dispatchCounter >= 20) break
  }
  while (createdDispatchRecords.length < 20) {
    const idx = createdDispatchRecords.length % createdOrders.length
    const order = createdOrders[idx]
    const rider = createdRiders[(idx + 5) % createdRiders.length]
    if (order.riderId) {
      createdDispatchRecords.push(
        await prisma.dispatchRecord.create({
          data: {
            orderId: order.id,
            riderId: rider.id,
            dispatcherId: dispatcherUser.id,
            dispatchType: DispatchType.REASSIGN,
            previousRiderId: order.riderId,
            reason: '追加调度记录 - 二次改派',
            estimatedArrivalMinutes: randomInt(10, 50),
            createdAt: addMinutes(order.createdAt, randomInt(35, 80)),
          },
        })
      )
    }
  }
  console.log(`✅ 调度分派记录完成 (${createdDispatchRecords.length}条)`)

  const createdRoutePlans = []
  for (let i = 0; i < 15; i++) {
    const orderIdx = i % createdOrders.length
    const order = createdOrders[orderIdx]
    const waypoints = [
      { type: 'pickup', lng: order.pickupLng, lat: order.pickupLat, address: order.pickupAddress },
      { type: 'delivery', lng: order.deliveryLng, lat: order.deliveryLat, address: order.deliveryAddress },
    ]
    createdRoutePlans.push(
      await prisma.routePlan.create({
        data: {
          orderId: order.id,
          version: i % 4 === 0 ? 2 : 1,
          waypointsJson: waypoints,
          totalDistanceMeters: order.distanceMeters || randomInt(3000, 20000),
          totalMinutes: order.estimatedMinutes || randomInt(30, 90),
          optimizedBy: i % 3 === 0 ? OptimizedBy.MANUAL : OptimizedBy.SYSTEM_ALGORITHM,
          createdBy: dispatcherUser.id,
          isActive: true,
          remark: i % 4 === 0 ? '优化后路线 V2' : '初始规划路线',
          createdAt: addMinutes(order.createdAt, randomInt(5, 25)),
        },
      })
    )
  }
  console.log(`✅ 路线规划完成 (${createdRoutePlans.length}条)`)

  const inTransitOrderRiders = []
  for (const order of createdOrders) {
    if (order.status === OrderStatus.IN_TRANSIT && order.riderId) {
      inTransitOrderRiders.push({ order, riderId: order.riderId })
    }
  }
  while (inTransitOrderRiders.length < 5) {
    const idx = inTransitOrderRiders.length % createdOrders.length
    const o = createdOrders[idx]
    if (o.riderId && !inTransitOrderRiders.find(x => x.order.id === o.id)) {
      inTransitOrderRiders.push({ order: o, riderId: o.riderId })
    }
    if (inTransitOrderRiders.length >= 5) break
  }

  const createdLocations = []
  const locationsPerOrder = Math.ceil(50 / inTransitOrderRiders.length)
  for (let i = 0; i < inTransitOrderRiders.length; i++) {
    const { order, riderId } = inTransitOrderRiders[i]
    const startLng = parseFloat(order.pickupLng || '116.3')
    const startLat = parseFloat(order.pickupLat || '39.9')
    const endLng = parseFloat(order.deliveryLng || '116.4')
    const endLat = parseFloat(order.deliveryLat || '40.0')
    const baseT = order.pickedUpAt || order.createdAt

    for (let j = 0; j < locationsPerOrder && createdLocations.length < 50; j++) {
      const ratio = (j + 1) / (locationsPerOrder + 1)
      createdLocations.push(
        await prisma.riderLocation.create({
          data: {
            riderId,
            orderId: order.id,
            lng: (startLng + (endLng - startLng) * ratio).toFixed(6),
            lat: (startLat + (endLat - startLat) * ratio).toFixed(6),
            speed: randomDecimal(15, 45).toString(),
            heading: randomInt(0, 360),
            accuracy: randomDecimal(3, 15).toString(),
            battery: randomInt(40, 100),
            isOffline: false,
            collectedAt: addMinutes(baseT, j * 3),
          },
        })
      )
    }
  }
  while (createdLocations.length < 50) {
    const rider = createdRiders[createdLocations.length % createdRiders.length]
    createdLocations.push(
      await prisma.riderLocation.create({
        data: {
          riderId: rider.id,
          lng: (116.3 + Math.random() * 0.2).toFixed(6),
          lat: (39.85 + Math.random() * 0.15).toFixed(6),
          speed: randomDecimal(0, 30).toString(),
          battery: randomInt(20, 100),
          isOffline: rider.status === RiderStatus.OFFLINE,
          collectedAt: addMinutes(new Date(), -createdLocations.length),
        },
      })
    )
  }
  console.log(`✅ 骑手轨迹完成 (${createdLocations.length}条)`)

  const coldChainOrders = createdOrders.filter(o => o.orderType === OrderType.COLD_CHAIN && o.temperatureRequired)
  const createdTempRecords = []
  const recordsPerOrder = Math.ceil(30 / Math.max(coldChainOrders.length, 1))

  for (let i = 0; i < coldChainOrders.length && createdTempRecords.length < 30; i++) {
    const order = coldChainOrders[i]
    const minT = parseFloat(order.minTemp || '2')
    const maxT = parseFloat(order.maxTemp || '8')
    const startT = order.pickedUpAt || order.createdAt

    for (let j = 0; j < recordsPerOrder && createdTempRecords.length < 30; j++) {
      let temp: number
      let isAlert = false
      let alertType: AlertType | undefined

      if (j % 7 === 0) {
        temp = maxT + randomDecimal(1, 4)
        isAlert = true
        alertType = AlertType.TOO_HIGH
      } else if (j % 11 === 0) {
        temp = minT - randomDecimal(1, 3)
        isAlert = true
        alertType = AlertType.TOO_LOW
      } else {
        temp = minT + Math.random() * (maxT - minT)
      }

      createdTempRecords.push(
        await prisma.temperatureRecord.create({
          data: {
            orderId: order.id,
            deviceNo: `TEMP-${String(1000 + i)}`,
            temperature: temp.toFixed(2),
            humidity: randomDecimal(40, 80).toString(),
            isAlert,
            alertType,
            collectedAt: addMinutes(startT, j * 5),
            remark: isAlert ? `温度${alertType === AlertType.TOO_HIGH ? '过高' : '过低'}告警` : undefined,
          },
        })
      )
    }
  }
  while (createdTempRecords.length < 30) {
    const order = coldChainOrders[createdTempRecords.length % coldChainOrders.length] || createdOrders[0]
    createdTempRecords.push(
      await prisma.temperatureRecord.create({
        data: {
          orderId: order.id,
          deviceNo: `TEMP-EXTRA`,
          temperature: randomDecimal(0, 10).toString(),
          humidity: randomDecimal(30, 90).toString(),
          isAlert: false,
          collectedAt: addMinutes(new Date(), -createdTempRecords.length * 2),
        },
      })
    )
  }
  console.log(`✅ 温控记录完成 (${createdTempRecords.length}条)`)

  const alertRecords = createdTempRecords.filter(r => r.isAlert)
  const createdTempAlerts = []
  for (let i = 0; i < Math.min(alertRecords.length, 5); i++) {
    const rec = alertRecords[i]
    createdTempAlerts.push(
      await prisma.temperatureAlert.create({
        data: {
          orderId: rec.orderId,
          recordId: rec.id,
          alertType: rec.alertType || AlertType.TOO_HIGH,
          alertLevel: i === 0 ? AlertLevel.DANGER : (i % 2 === 0 ? AlertLevel.WARNING : AlertLevel.INFO),
          temperature: rec.temperature,
          thresholdMin: '2.00',
          thresholdMax: '8.00',
          status: i === 0 ? AlertStatus.OPEN : (i === 1 ? AlertStatus.ACKNOWLEDGED : (i === 2 ? AlertStatus.RESOLVED : AlertStatus.IGNORED)),
          acknowledgedBy: i >= 1 ? dispatcherUser.id : undefined,
          acknowledgedAt: i >= 1 ? addMinutes(rec.collectedAt, randomInt(3, 15)) : undefined,
          resolvedBy: i >= 2 ? supervisorUser.id : undefined,
          resolvedAt: i >= 2 ? addMinutes(rec.collectedAt, randomInt(20, 60)) : undefined,
          resolution: i >= 2 ? '已联系客户进行温度补偿处理，货物未受影响' : undefined,
          createdAt: rec.collectedAt,
        },
      })
    )
  }
  while (createdTempAlerts.length < 5) {
    const idx = createdTempAlerts.length
    const order = coldChainOrders[idx % coldChainOrders.length] || createdOrders[idx]
    createdTempAlerts.push(
      await prisma.temperatureAlert.create({
        data: {
          orderId: order.id,
          alertType: AlertType.DEVICE_OFFLINE,
          alertLevel: AlertLevel.WARNING,
          temperature: '5.00',
          thresholdMin: '2.00',
          thresholdMax: '8.00',
          status: AlertStatus.OPEN,
          createdAt: addMinutes(new Date(), -(idx + 1) * 10),
        },
      })
    )
  }
  console.log(`✅ 温控告警完成 (${createdTempAlerts.length}条)`)

  const exceptionOrders = createdOrders.filter(o => o.status === OrderStatus.EXCEPTION)
  const claimDataList = []
  const claimTypes = [ClaimType.DAMAGE, ClaimType.DELAY, ClaimType.TEMPERATURE, ClaimType.OTHER]
  for (let i = 0; i < 4; i++) {
    const order = exceptionOrders[i % exceptionOrders.length] || createdOrders[11 + i]
    const sourceAlert = createdTempAlerts[i % createdTempAlerts.length]
    const isTempClaim = claimTypes[i % claimTypes.length] === ClaimType.TEMPERATURE
    claimDataList.push({
      claimNo: `CM${20260610}${String(i + 1).padStart(5, '0')}`,
      orderId: order.id,
      sourceDocId: isTempClaim ? sourceAlert?.id : undefined,
      sourceDocType: isTempClaim ? ClaimSourceType.TEMPERATURE_ALERT : (i % 2 === 0 ? ClaimSourceType.COMPLAINT : ClaimSourceType.OTHER),
      claimType: claimTypes[i % claimTypes.length],
      claimAmount: randomDecimal(100, 3000).toString(),
      approvedAmount: i >= 2 ? randomDecimal(80, 2500).toString() : undefined,
      status: [ClaimStatus.SUBMITTED, ClaimStatus.UNDER_REVIEW, ClaimStatus.APPROVED, ClaimStatus.PAID][i],
      applicantId: dispatcherUser.id,
      reviewerId: i >= 1 ? supervisorUser.id : undefined,
      approverId: i >= 2 ? adminUser.id : undefined,
      reason: [
        '客户反馈货物包装破损，部分商品损坏',
        '配送超时2小时，客户投诉要求赔付',
        '冷链运输温度超出范围，客户要求温度补偿',
        '其他特殊情况申请赔付',
      ][i],
      description: `详细说明：${i + 1}号赔付工单涉及订单 ${order.orderNo}，客户已正式提交赔偿申请，附相关照片和凭证。`,
      evidenceJson: { photos: [`/evidence/${i + 1}_1.jpg`, `/evidence/${i + 1}_2.jpg`], video: i === 2 ? `/evidence/${i + 1}.mp4` : null },
      submittedAt: addHours(order.createdAt, randomInt(2, 24)),
      reviewedAt: i >= 1 ? addHours(order.createdAt, randomInt(24, 48)) : undefined,
      approvedAt: i >= 2 ? addHours(order.createdAt, randomInt(48, 72)) : undefined,
      closedAt: i >= 3 ? addHours(order.createdAt, randomInt(72, 120)) : undefined,
    })
  }
  const createdClaims = []
  for (const c of claimDataList) {
    createdClaims.push(await prisma.claimOrder.create({ data: c }))
  }
  console.log(`✅ 赔付工单完成 (${createdClaims.length}条)`)

  const reportDataList = []
  for (let i = 0; i < 3; i++) {
    const order = coldChainOrders[i % coldChainOrders.length] || createdOrders[i + 3]
    const standardFee = parseFloat(randomDecimal(200, 800))
    const actualFee = standardFee + (i === 1 ? -randomDecimal(50, 150) : (i === 2 ? randomDecimal(50, 200) : 0))
    reportDataList.push({
      reportNo: `RPT${20260610}${String(i + 1).padStart(5, '0')}`,
      reportDate: addDays(new Date(), -i),
      orderId: order.id,
      customerId: order.customerId,
      standardFee: standardFee.toFixed(2),
      actualFee: actualFee.toFixed(2),
      feeDifference: (actualFee - standardFee).toFixed(2),
      differenceReason: i === 0 ? '正常配送无异常' : (i === 1 ? '配送里程减少，实际费用下调' : '发生温度异常，产生额外处理费用'),
      abnormalMinutes: i === 2 ? randomInt(10, 45) : (i === 1 ? randomInt(0, 5) : 0),
      handlingDurationMinutes: randomInt(15, 120),
      handlerId: dispatcherUser.id,
      handlerName: dispatcherUser.realName || '张调度',
      status: [ReportStatus.DRAFT, ReportStatus.CONFIRMED, ReportStatus.ARCHIVED][i],
      confirmedBy: i >= 1 ? supervisorUser.id : undefined,
      confirmedAt: i >= 1 ? addHours(new Date(), -i * 24 - 5) : undefined,
    })
  }
  function addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
  }
  const createdReports = []
  for (const r of reportDataList) {
    createdReports.push(await prisma.temperatureSafetyReport.create({ data: r }))
  }
  console.log(`✅ 温控安全报表完成 (${createdReports.length}条)`)

  const exceptionDataList = []
  const apiNames = ['/api/order/create', '/api/dispatch/assign', '/api/rider/location/batch', '/api/temperature/upload', '/api/claim/submit', '/api/report/generate', '/api/notification/push', '/api/auth/login']
  const methods = ['POST', 'POST', 'POST', 'POST', 'POST', 'GET', 'POST', 'POST']
  const errors = [
    { code: 'TIMEOUT', msg: '请求第三方物流接口超时，连接已断开' },
    { code: 'DB_ERROR', msg: '数据库连接池耗尽，无法获取连接' },
    { code: 'VALIDATE_ERROR', msg: '请求参数校验失败: riderId 不能为空' },
    { code: 'RATE_LIMIT', msg: '调用频率超过限制，请稍后重试' },
    { code: 'REMOTE_ERROR', msg: '支付网关返回错误: 签名验证失败' },
    { code: 'PARSE_ERROR', msg: 'JSON解析错误，响应格式非法' },
    { code: 'PERMISSION', msg: '无权限访问该资源，TOKEN已过期' },
    { code: 'DUPLICATE', msg: '主键冲突，订单号重复' },
  ]
  for (let i = 0; i < 8; i++) {
    const relatedOrder = createdOrders[i % createdOrders.length]
    exceptionDataList.push({
      requestId: `REQ${Date.now()}${String(i).padStart(4, '0')}`,
      apiName: apiNames[i],
      method: methods[i],
      url: `https://api.qinghe-delivery.com${apiNames[i]}`,
      docId: i < 5 ? relatedOrder.id : undefined,
      docType: i < 5 ? 'DELIVERY_ORDER' : undefined,
      errorCode: errors[i].code,
      errorMessage: errors[i].msg,
      requestHeaders: { 'Content-Type': 'application/json', 'X-Request-Id': `REQ${i}` },
      requestBody: i % 2 === 0 ? JSON.stringify({ orderId: relatedOrder.id, data: 'sample' }) : undefined,
      stackTrace: i % 3 === 0 ? `Error: ${errors[i].msg}\n    at processOrder (app/service/OrderService.ts:${100 + i}:15)\n    at dispatch (app/controller/DispatchController.ts:${50 + i}:8)` : undefined,
      status: [ExceptionStatus.NEW, ExceptionStatus.PROCESSING, ExceptionStatus.RESOLVED, ExceptionStatus.RESOLVED, ExceptionStatus.IGNORED, ExceptionStatus.NEW, ExceptionStatus.PROCESSING, ExceptionStatus.RESOLVED][i],
      retryCount: randomInt(0, 3),
      lastRetryAt: i % 4 === 0 ? addMinutes(new Date(), -randomInt(10, 60)) : undefined,
      handlerId: i >= 2 ? adminUser.id : undefined,
      handlerRemark: i >= 2 ? `已处理：${errors[i].code} 问题已修复` : undefined,
      resolvedAt: [ExceptionStatus.RESOLVED, ExceptionStatus.RESOLVED, ExceptionStatus.RESOLVED].includes([ExceptionStatus.NEW, ExceptionStatus.PROCESSING, ExceptionStatus.RESOLVED, ExceptionStatus.RESOLVED, ExceptionStatus.IGNORED, ExceptionStatus.NEW, ExceptionStatus.PROCESSING, ExceptionStatus.RESOLVED][i])
        ? addHours(new Date(), -randomInt(1, 24))
        : undefined,
      createdAt: addHours(new Date(), -i * 2 - 1),
    })
  }
  const createdExceptions = []
  for (let idx = 0; idx < exceptionDataList.length; idx++) {
    const e = exceptionDataList[idx]
    createdExceptions.push(await prisma.apiExceptionLog.create({ data: e }))
  }
  console.log(`✅ 接口异常日志完成 (${createdExceptions.length}条)`)

  const allBizDocs: { type: BizType; id: bigint; status: string; priority?: string; handlerId?: bigint; handlerName?: string }[] = []

  for (const order of createdOrders) {
    allBizDocs.push({
      type: BizType.DELIVERY_ORDER,
      id: order.id,
      status: order.status,
      priority: order.priority,
      handlerId: order.riderId || order.dispatcherId || undefined,
      handlerName: order.dispatcherId ? (order.dispatcherId === dispatcherUser.id ? dispatcherUser.realName || undefined : undefined) : undefined,
    })
  }
  for (const alert of createdTempAlerts) {
    allBizDocs.push({
      type: BizType.TEMPERATURE_ALERT,
      id: alert.id,
      status: alert.status,
      priority: alert.alertLevel === AlertLevel.DANGER ? 'URGENT' : alert.alertLevel === AlertLevel.WARNING ? 'HIGH' : 'NORMAL',
      handlerId: alert.acknowledgedBy || dispatcherUser.id,
      handlerName: dispatcherUser.realName || undefined,
    })
  }
  for (const claim of createdClaims) {
    allBizDocs.push({
      type: BizType.CLAIM_ORDER,
      id: claim.id,
      status: claim.status,
      priority: claim.claimType === ClaimType.LOSS ? 'URGENT' : 'HIGH',
      handlerId: claim.reviewerId || claim.applicantId,
      handlerName: supervisorUser.realName || undefined,
    })
  }
  for (let idx = 0; idx < createdExceptions.length; idx++) {
    const exc = createdExceptions[idx]
    allBizDocs.push({
      type: BizType.API_EXCEPTION,
      id: exc.id,
      status: exc.status,
      priority: exc.retryCount >= 3 ? 'URGENT' : 'NORMAL',
      handlerId: exc.handlerId || adminUser.id,
      handlerName: adminUser.realName || undefined,
    })
  }
  for (const report of createdReports) {
    allBizDocs.push({
      type: BizType.SAFETY_REPORT,
      id: report.id,
      status: report.status,
      priority: 'NORMAL',
      handlerId: report.handlerId || dispatcherUser.id,
      handlerName: report.handlerName || undefined,
    })
  }

  const createdViews = []
  for (let idx = 0; idx < allBizDocs.length; idx++) {
    const doc = allBizDocs[idx]
    createdViews.push(
      await prisma.processingView.create({
        data: {
          bizType: doc.type,
          bizId: doc.id,
          status: doc.status,
          priority: doc.priority,
          currentHandlerId: doc.handlerId,
          currentHandlerName: doc.handlerName,
          lastProcessedAt: idx % 3 === 0 ? addHours(new Date(), -randomInt(1, 12)) : undefined,
          lastProcessedBy: idx % 3 === 0 ? dispatcherUser.id : undefined,
          lastRemark: idx % 4 === 0 ? `已查看第${idx + 1}次，待后续跟进` : undefined,
          assignmentCount: randomInt(0, 4),
          createdAt: addHours(new Date(), -idx - 1),
        },
      })
    )
  }
  console.log(`✅ 处理视图完成 (${createdViews.length}条)`)

  const createdNotes = []
  for (let idx = 0; idx < createdViews.length; idx++) {
    const view = createdViews[idx]
    const noteCount = randomInt(1, 4)
    for (let n = 0; n < noteCount; n++) {
      const actionTypes = [ActionType.COMMENT, ActionType.STATUS_CHANGE, ActionType.ASSIGN, ActionType.ESCALATE]
      const action = actionTypes[(idx + n) % actionTypes.length]
      createdNotes.push(
        await prisma.processingNote.create({
          data: {
            viewId: view.id,
            operatorId: (n % 3 === 0 ? adminUser.id : (n % 3 === 1 ? dispatcherUser.id : supervisorUser.id)),
            operatorName: [adminUser.realName, dispatcherUser.realName, supervisorUser.realName][n % 3] || '系统',
            actionType: action,
            fromStatus: action === ActionType.STATUS_CHANGE ? '旧状态' : undefined,
            toStatus: action === ActionType.STATUS_CHANGE ? view.status : undefined,
            remark: `处理备注 ${n + 1}: 针对【${view.bizType}】单据进行${action}操作，相关说明已记录。`,
            metaJson: action === ActionType.ASSIGN ? { from: '系统', to: '张调度' } : undefined,
            createdAt: addMinutes(view.createdAt, n * randomInt(5, 30)),
          },
        })
      )
    }
  }
  console.log(`✅ 处理备注完成 (${createdNotes.length}条)`)

  const allNotifications: any[] = []
  for (let i = 0; i < createdOrders.length; i++) {
    const order = createdOrders[i]
    if (order.riderId) {
      const orderOwner = createdRiders.find(r => r.id === order.riderId)
    }
    allNotifications.push({
      recipientId: dispatcherUser.id,
      title: `订单【${order.orderNo}】状态变更`,
      content: `订单 ${order.orderNo} 状态已更新为【${order.status}】，请及时关注处理进度。`,
      type: NotificationType.DISPATCH,
      bizType: 'DELIVERY_ORDER',
      bizId: order.id,
      isRead: i % 3 === 0,
      readAt: i % 3 === 0 ? addHours(order.createdAt, randomInt(1, 6)) : undefined,
      createdAt: order.createdAt,
    })
  }
  for (let i = 0; i < createdTempAlerts.length; i++) {
    const alert = createdTempAlerts[i]
    allNotifications.push({
      recipientId: supervisorUser.id,
      title: `温度告警 - ${alert.alertLevel}`,
      content: `订单关联温控告警，类型【${alert.alertType}】，当前温度 ${alert.temperature}°C，阈值 ${alert.thresholdMin}~${alert.thresholdMax}°C，请及时处理！`,
      type: NotificationType.ALERT,
      bizType: 'TEMPERATURE_ALERT',
      bizId: alert.id,
      isRead: alert.status !== AlertStatus.OPEN,
      readAt: alert.status !== AlertStatus.OPEN ? alert.acknowledgedAt || alert.resolvedAt : undefined,
      createdAt: alert.createdAt,
    })
  }
  for (let i = 0; i < createdClaims.length; i++) {
    const claim = createdClaims[i]
    allNotifications.push({
      recipientId: adminUser.id,
      title: `赔付工单【${claim.claimNo}】${claim.status}`,
      content: `赔付工单 ${claim.claimNo} 当前状态：${claim.status}，申请金额 ¥${claim.claimAmount}，请及时跟进处理。`,
      type: NotificationType.CLAIM,
      bizType: 'CLAIM_ORDER',
      bizId: claim.id,
      isRead: claim.status !== ClaimStatus.SUBMITTED,
      createdAt: claim.createdAt,
    })
  }
  for (let i = 0; i < createdReports.length; i++) {
    const report = createdReports[i]
    allNotifications.push({
      recipientId: supervisorUser.id,
      title: `安全报表【${report.reportNo}】${report.status}`,
      content: `温控安全报表 ${report.reportNo} (${formatDate(report.reportDate)}) 状态为【${report.status}】，差额 ¥${report.feeDifference}。`,
      type: NotificationType.REPORT,
      bizType: 'SAFETY_REPORT',
      bizId: report.id,
      isRead: report.status !== ReportStatus.DRAFT,
      createdAt: report.createdAt,
    })
  }
  allNotifications.push({
    recipientId: dispatcherUser.id,
    title: '【系统通知】欢迎使用清河配送平台',
    content: '您的调度员账户已激活，祝您工作愉快！如有疑问请联系系统管理员。',
    type: NotificationType.SYSTEM,
    isRead: false,
    createdAt: new Date(),
  })
  for (const n of allNotifications) {
    await prisma.notification.create({ data: n })
  }
  console.log(`✅ 消息通知完成 (${allNotifications.length}条)`)

  console.log('\n🎉 种子数据全部生成完成！')
  console.log('========================================')
  console.log('创建的数据统计：')
  console.log('  用户: 3')
  console.log('  角色: 3')
  console.log('  用户角色关联: 3')
  console.log('  骑手: 10')
  console.log('  客户: 8')
  console.log(`  订单: ${createdOrders.length}`)
  console.log(`  履约时效记录: ${createdTimelines.length}`)
  console.log(`  调度分派记录: ${createdDispatchRecords.length}`)
  console.log(`  路线规划: ${createdRoutePlans.length}`)
  console.log(`  骑手轨迹: ${createdLocations.length}`)
  console.log(`  温控记录: ${createdTempRecords.length}`)
  console.log(`  温控告警: ${createdTempAlerts.length}`)
  console.log(`  赔付工单: ${createdClaims.length}`)
  console.log(`  温控安全报表: ${createdReports.length}`)
  console.log(`  接口异常日志: ${createdExceptions.length}`)
  console.log(`  处理视图: ${createdViews.length}`)
  console.log(`  处理备注: ${createdNotes.length}`)
  console.log(`  消息通知: ${allNotifications.length}`)
  console.log('========================================')
  console.log('默认用户 (密码均为 123456):')
  console.log('  admin       - 系统管理员')
  console.log('  dispatcher  - 调度员')
  console.log('  supervisor  - 主管')
}

main()
  .catch(e => {
    console.error('❌ 种子数据生成失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
