import { WorkOrder, Supplier, Building, MetricsSummary } from "@/types";
import { generateOrderNo, isWorkHoliday, calculateResponseTime } from "@/lib/utils";
import dayjs from "dayjs";

const SUPPLIERS: Supplier[] = [
  {
    id: "s1",
    name: "速修达维修服务",
    contact: "张经理",
    phone: "13800138001",
    totalOrders: 328,
    repeatRate: 8.5,
    avgResponseTime: 45,
    timeoutCount: 12,
    avgRating: 4.2,
  },
  {
    id: "s2",
    name: "安居工程维保",
    contact: "李工",
    phone: "13800138002",
    totalOrders: 256,
    repeatRate: 5.2,
    avgResponseTime: 38,
    timeoutCount: 5,
    avgRating: 4.6,
  },
  {
    id: "s3",
    name: "快修侠家政服务",
    contact: "王主管",
    phone: "13800138003",
    totalOrders: 412,
    repeatRate: 12.3,
    avgResponseTime: 62,
    timeoutCount: 28,
    avgRating: 3.8,
  },
  {
    id: "s4",
    name: "优居维修中心",
    contact: "刘师傅",
    phone: "13800138004",
    totalOrders: 189,
    repeatRate: 6.8,
    avgResponseTime: 52,
    timeoutCount: 8,
    avgRating: 4.4,
  },
  {
    id: "s5",
    name: "家修通科技",
    contact: "陈经理",
    phone: "13800138005",
    totalOrders: 298,
    repeatRate: 9.1,
    avgResponseTime: 48,
    timeoutCount: 15,
    avgRating: 4.0,
  },
];

const BUILDINGS: Building[] = [
  {
    id: "b1",
    name: "朝阳花园 1 号楼",
    address: "北京市朝阳区建国路 88 号",
    lng: 116.4621,
    lat: 39.9084,
    totalOrders: 128,
    repeatCount: 12,
    timeoutCount: 8,
  },
  {
    id: "b2",
    name: "朝阳花园 2 号楼",
    address: "北京市朝阳区建国路 88 号",
    lng: 116.4625,
    lat: 39.9086,
    totalOrders: 95,
    repeatCount: 8,
    timeoutCount: 5,
  },
  {
    id: "b3",
    name: "朝阳花园 3 号楼",
    address: "北京市朝阳区建国路 88 号",
    lng: 116.4629,
    lat: 39.9082,
    totalOrders: 156,
    repeatCount: 18,
    timeoutCount: 12,
  },
  {
    id: "b4",
    name: "海淀苑 A 座",
    address: "北京市海淀区中关村大街 1 号",
    lng: 116.3168,
    lat: 39.9892,
    totalOrders: 210,
    repeatCount: 22,
    timeoutCount: 18,
  },
  {
    id: "b5",
    name: "海淀苑 B 座",
    address: "北京市海淀区中关村大街 1 号",
    lng: 116.3172,
    lat: 39.9895,
    totalOrders: 178,
    repeatCount: 15,
    timeoutCount: 10,
  },
  {
    id: "b6",
    name: "西城金茂府 1 栋",
    address: "北京市西城区金融街 15 号",
    lng: 116.3595,
    lat: 39.9142,
    totalOrders: 89,
    repeatCount: 6,
    timeoutCount: 3,
  },
  {
    id: "b7",
    name: "西城金茂府 2 栋",
    address: "北京市西城区金融街 15 号",
    lng: 116.3599,
    lat: 39.9145,
    totalOrders: 112,
    repeatCount: 9,
    timeoutCount: 7,
  },
  {
    id: "b8",
    name: "东城雅居",
    address: "北京市东城区东直门外大街 1 号",
    lng: 116.4263,
    lat: 39.9412,
    totalOrders: 145,
    repeatCount: 14,
    timeoutCount: 9,
  },
];

const ROOM_TYPES = ["一居室", "两居室", "三居室", "LOFT"];
const REPAIR_TYPES = [
  "水电维修",
  "空调维修",
  "家具维修",
  "门锁维修",
  "墙面维修",
  "卫浴维修",
  "厨房维修",
];
const TENANT_NAMES = [
  "张三",
  "李四",
  "王五",
  "赵六",
  "钱七",
  "孙八",
  "周九",
  "吴十",
  "郑一",
  "王二",
  "冯三",
  "陈四",
];
const FEEDBACKS = [
  "维修师傅很专业，很快就修好了",
  "响应速度很快，态度也很好",
  "修完又坏了，质量不太满意",
  "等了很久才有人来，超时了",
  "价格有点贵，但修得还可以",
  "师傅迟到了也没提前说",
  "维修效果不错，目前没问题",
  "沟通不太顺畅，反复约了好几次",
  "材料用得还可以，希望能耐用",
  "非常不满意，三天两头出问题",
  "整体还行，就是有点慢",
  "师傅手艺不错，推荐",
];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): Date {
  return dayjs()
    .subtract(randomInt(0, daysAgo), "day")
    .subtract(randomInt(0, 24), "hour")
    .subtract(randomInt(0, 60), "minute")
    .toDate();
}

const MATERIALS_POOL = [
  { name: "水龙头", unit: "个", price: 120 },
  { name: "LED 灯泡", unit: "个", price: 35 },
  { name: "空调滤网", unit: "个", price: 80 },
  { name: "门锁芯", unit: "个", price: 180 },
  { name: "排水管", unit: "米", price: 25 },
  { name: "密封胶", unit: "支", price: 45 },
  { name: "插座面板", unit: "个", price: 55 },
  { name: "空气开关", unit: "个", price: 65 },
];

export function generateWorkOrders(count: number = 120): WorkOrder[] {
  const orders: WorkOrder[] = [];

  for (let i = 0; i < count; i++) {
    const building = randomPick(BUILDINGS);
    const supplier = randomPick(SUPPLIERS);
    const roomNo = `${randomInt(1, 30)}${String.fromCharCode(65 + randomInt(0, 3))}`;
    const createdAt = randomDate(90);
    const isHoliday = isWorkHoliday(createdAt);
    
    const responseMinutes = randomInt(15, 180);
    const respondedAt = dayjs(createdAt).add(responseMinutes, "minute").toDate();
    
    const completeHours = randomInt(1, 8);
    const completedAt = dayjs(respondedAt).add(completeHours, "hour").toDate();
    
    const canBeRepeat = i > 10;
    const isRepeat = canBeRepeat && Math.random() < 0.12;
    
    let parentOrder: WorkOrder | null = null;
    if (isRepeat && canBeRepeat) {
      const lookBack = Math.min(i - 1, randomInt(5, 20));
      const candidateOrders = orders.slice(0, i - 1).filter(
        (o) => o.buildingId === building.id && o.roomNo.startsWith(roomNo.charAt(0) || "")
      );
      if (candidateOrders.length > 0) {
        parentOrder = candidateOrders[randomInt(0, candidateOrders.length - 1)];
      } else if (orders.slice(0, i - 1).length > 0) {
        parentOrder = orders[randomInt(0, Math.min(i - 1, lookBack))];
      }
    }
    
    const finalIsRepeat = isRepeat && parentOrder !== null;
    
    const statusWeights = [0.05, 0.1, 0.15, 0.6, 0.05, 0.05];
    const statuses: WorkOrder["status"][] = [
      "pending",
      "confirmed",
      "in_progress",
      "completed",
      "appealing",
      "closed",
    ];
    let random = Math.random();
    let statusIndex = 0;
    for (let j = 0; j < statusWeights.length; j++) {
      random -= statusWeights[j];
      if (random <= 0) {
        statusIndex = j;
        break;
      }
    }
    const status = statuses[statusIndex];
    
    const hasRating = status === "completed" || status === "closed";
    const tenantRating = hasRating ? randomInt(1, 5) : undefined;
    const tenantFeedback = hasRating && Math.random() < 0.6 ? randomPick(FEEDBACKS) : undefined;

    const materialsCount = randomInt(0, 3);
    const materials = Array.from({ length: materialsCount }, (_, idx) => {
      const mat = randomPick(MATERIALS_POOL);
      return {
        id: `mat-${i}-${idx}`,
        name: mat.name,
        quantity: randomInt(1, 3),
        unit: mat.unit,
        price: mat.price,
      };
    });

    const hasAppeal = status === "appealing";

    orders.push({
      id: `wo-${i}`,
      orderNo: generateOrderNo(),
      buildingId: building.id,
      buildingName: building.name,
      roomNo,
      roomType: randomPick(ROOM_TYPES),
      repairType: finalIsRepeat && parentOrder ? parentOrder.repairType : randomPick(REPAIR_TYPES),
      supplierId: finalIsRepeat && parentOrder ? parentOrder.supplierId : supplier.id,
      supplierName: finalIsRepeat && parentOrder ? parentOrder.supplierName : supplier.name,
      status,
      createdAt,
      respondedAt: status !== "pending" ? respondedAt : undefined,
      completedAt:
        status === "completed" || status === "closed" || status === "appealing"
          ? completedAt
          : undefined,
      responseTime: calculateResponseTime(createdAt, respondedAt),
      isRepeat: finalIsRepeat,
      parentOrderId: parentOrder?.id,
      parentOrderNo: parentOrder?.orderNo,
      isHoliday,
      tenantRating,
      tenantFeedback,
      tenantName: randomPick(TENANT_NAMES),
      materials,
      photos: [],
      appealRecords: hasAppeal
        ? [
            {
              id: `appeal-${i}`,
              workOrderId: `wo-${i}`,
              reason: "租户使用不当导致损坏，非维修质量问题",
              photos: [],
              tenantConfirmation: Math.random() > 0.5,
              createdAt: dayjs(completedAt).add(1, "day").toDate(),
              status: "pending",
            },
          ]
        : [],
      location: {
        lng: building.lng + (Math.random() - 0.5) * 0.002,
        lat: building.lat + (Math.random() - 0.5) * 0.002,
      },
    });
  }

  return orders;
}

export const MOCK_WORK_ORDERS = generateWorkOrders(150);
export const MOCK_SUPPLIERS = SUPPLIERS;
export const MOCK_BUILDINGS = BUILDINGS;

export function getMetricsSummary(orders: WorkOrder[]): MetricsSummary {
  const validOrders = orders.filter(
    (o) => o.status === "completed" || o.status === "closed"
  );
  const nonHolidayOrders = validOrders.filter((o) => !o.isHoliday);
  
  const totalOrders = orders.length;
  const repeatCount = orders.filter((o) => o.isRepeat && o.parentOrderId).length;
  const repeatRate = totalOrders > 0 ? (repeatCount / totalOrders) * 100 : 0;

  const responseTimes = nonHolidayOrders
    .filter((o) => o.responseTime)
    .map((o) => o.responseTime!);
  const avgResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

  const timeoutThreshold = 120;
  const timeoutCount = nonHolidayOrders.filter(
    (o) => o.responseTime && o.responseTime > timeoutThreshold
  ).length;
  const timeoutRate =
    nonHolidayOrders.length > 0
      ? (timeoutCount / nonHolidayOrders.length) * 100
      : 0;

  const ratings = validOrders
    .filter((o) => o.tenantRating)
    .map((o) => o.tenantRating!);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

  const holidayOrders = orders.filter((o) => o.isHoliday).length;

  return {
    totalOrders,
    repeatRate: Math.round(repeatRate * 10) / 10,
    avgResponseTime: Math.round(avgResponseTime),
    timeoutRate: Math.round(timeoutRate * 10) / 10,
    avgRating: Math.round(avgRating * 10) / 10,
    holidayOrders,
  };
}
