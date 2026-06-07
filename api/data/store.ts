import { randomUUID } from 'crypto';

const ACTIVITIES = ['日常运营', '周末特别活动', '节假日', '暑期档', '夜间场'];

export interface TicketRecord {
  id: string;
  ticketNo: string;
  ticketType: string;
  price: number;
  sellTime: Date;
  channel: string;
  visitorId: string;
  activity: string;
}

export interface GateRecord {
  id: string;
  ticketNo: string;
  passTime: Date;
  entrance: string;
  direction: 'in' | 'out';
  area: string;
  areaId: string;
  queueDuration: number;
  activity: string;
}

export interface ParkingRecord {
  id: string;
  plateNo: string;
  enterTime: Date;
  exitTime?: Date;
  parkingLot: string;
  duration?: number;
  fee?: number;
  activity: string;
}

export interface WeatherRecord {
  id: string;
  recordTime: Date;
  temperature: number;
  humidity: number;
  weather: string;
  windSpeed: number;
}

export interface ShowRecord {
  id: string;
  showName: string;
  startTime: Date;
  endTime: Date;
  venue: string;
  capacity: number;
  audienceCount: number;
  activity: string;
}

export interface ConsumptionRecord {
  id: string;
  orderNo: string;
  visitorId: string;
  consumeTime: Date;
  amount: number;
  category: string;
  shopName: string;
  activity: string;
}

export type AnyRecord = TicketRecord | GateRecord | ParkingRecord | WeatherRecord | ShowRecord | ConsumptionRecord;

const TICKET_TYPES = ['成人票', '儿童票', '老人票', '学生票', 'VIP票', '家庭套票'];
const ENTRANCES = ['东门', '西门', '南门', '北门'];
const AREAS = [
  { id: 'area1', name: '主入口广场', capacity: 5000 },
  { id: 'area2', name: '过山车区', capacity: 2000 },
  { id: 'area3', name: '旋转木马区', capacity: 1500 },
  { id: 'area4', name: '水上乐园', capacity: 3000 },
  { id: 'area5', name: '演出剧场', capacity: 1200 },
  { id: 'area6', name: '美食街', capacity: 2500 },
  { id: 'area7', name: '纪念品商店', capacity: 800 },
  { id: 'area8', name: '儿童乐园', capacity: 1800 }
];
const CLOSED_AREA_IDS = ['area4'];

function randomNormal(mean: number, std: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function randomDateInRange(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateId(): string {
  return randomUUID().replace(/-/g, '').slice(0, 12);
}

export class DataStore {
  private static instance: DataStore;
  public tickets: TicketRecord[] = [];
  public gates: GateRecord[] = [];
  public parkings: ParkingRecord[] = [];
  public weathers: WeatherRecord[] = [];
  public shows: ShowRecord[] = [];
  public consumptions: ConsumptionRecord[] = [];
  public lastUpdate: Date = new Date();

  private constructor() {
    this.generateData();
  }

  public static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore();
    }
    return DataStore.instance;
  }

  private generateData() {
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(8, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(20, 0, 0, 0);

    const ticketPrices: Record<string, number> = {
      '成人票': 299, '儿童票': 180, '老人票': 150, '学生票': 220, 'VIP票': 599, '家庭套票': 699
    };
    const channels = ['线上', '线下', '旅行社', 'OTA'];

    for (let i = 0; i < 15000; i++) {
      const ticketType = TICKET_TYPES[Math.floor(Math.random() * TICKET_TYPES.length)];
      const visitorId = 'V' + generateId();
      const activity = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
      this.tickets.push({
        id: generateId(),
        ticketNo: 'TK' + generateId().toUpperCase(),
        ticketType,
        price: ticketPrices[ticketType],
        sellTime: randomDateInRange(dayStart, now),
        channel: channels[Math.floor(Math.random() * channels.length)],
        visitorId,
        activity
      });
    }

    const soldTickets = [...this.tickets];
    for (let i = 0; i < 12000; i++) {
      const ticket = soldTickets[i % soldTickets.length];
      const area = AREAS[Math.floor(Math.random() * AREAS.length)];
      const passTime = randomDateInRange(dayStart, now);
      const isEntry = Math.random() > 0.15;
      this.gates.push({
        id: generateId(),
        ticketNo: ticket.ticketNo,
        passTime,
        entrance: ENTRANCES[Math.floor(Math.random() * ENTRANCES.length)],
        direction: isEntry ? 'in' : 'out',
        area: area.name,
        areaId: area.id,
        queueDuration: isEntry ? Math.max(0, randomNormal(15, 8)) : 0,
        activity: ticket.activity
      });
    }

    for (let i = 0; i < 3000; i++) {
      const enterTime = randomDateInRange(dayStart, now);
      const hasExited = Math.random() > 0.25;
      const duration = hasExited ? Math.max(30, randomNormal(180, 60)) : undefined;
      this.parkings.push({
        id: generateId(),
        plateNo: '京A' + Math.floor(10000 + Math.random() * 90000),
        enterTime,
        exitTime: hasExited ? new Date(enterTime.getTime() + duration! * 60000) : undefined,
        parkingLot: ['P1', 'P2', 'P3'][Math.floor(Math.random() * 3)],
        duration,
        fee: duration ? Math.floor(duration / 30) * 10 : undefined,
        activity: ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)]
      });
    }

    for (let i = 0; i < 24; i++) {
      const recordTime = new Date(dayStart);
      recordTime.setMinutes(i * 30);
      this.weathers.push({
        id: generateId(),
        recordTime,
        temperature: Math.round(randomNormal(25, 4) * 10) / 10,
        humidity: Math.round(randomNormal(60, 15)),
        weather: ['晴', '多云', '阴', '小雨'][Math.floor(Math.random() * 4)],
        windSpeed: Math.round(randomNormal(10, 5) * 10) / 10
      });
    }

    const showNames = ['花车巡游', '海豚表演', '魔术秀', '烟花秀', '特技剧场'];
    for (let i = 0; i < 8; i++) {
      const startTime = randomDateInRange(dayStart, dayEnd);
      const endTime = new Date(startTime.getTime() + 45 * 60000);
      this.shows.push({
        id: generateId(),
        showName: showNames[i % showNames.length],
        startTime,
        endTime,
        venue: AREAS[Math.floor(Math.random() * AREAS.length)].name,
        capacity: 800 + Math.floor(Math.random() * 800),
        audienceCount: Math.floor(randomNormal(600, 200)),
        activity: ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)]
      });
    }

    for (let i = 0; i < 8000; i++) {
      const ticket = this.tickets[Math.floor(Math.random() * this.tickets.length)];
      const categories = ['餐饮', '纪念品', '游乐项目', '其他'];
      const shopNames = ['美味餐厅', '纪念品商店', '雪糕屋', '礼品店', '主题餐厅'];
      this.consumptions.push({
        id: generateId(),
        orderNo: 'ORD' + generateId().toUpperCase(),
        visitorId: ticket.visitorId,
        consumeTime: randomDateInRange(dayStart, now),
        amount: Math.round(randomNormal(85, 40) * 100) / 100,
        category: categories[Math.floor(Math.random() * categories.length)],
        shopName: shopNames[Math.floor(Math.random() * shopNames.length)],
        activity: ticket.activity
      });
    }

    this.lastUpdate = new Date();
  }

  public refresh() {
    this.tickets = [];
    this.gates = [];
    this.parkings = [];
    this.weathers = [];
    this.shows = [];
    this.consumptions = [];
    this.generateData();
  }

  public getAreaList() {
    return AREAS;
  }

  public getClosedAreaIds() {
    return CLOSED_AREA_IDS;
  }

  public getEntranceList() {
    return ENTRANCES;
  }

  public getTicketTypes() {
    return TICKET_TYPES;
  }
}

export const dataStore = DataStore.getInstance();
