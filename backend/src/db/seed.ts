import { db } from './index';
import { users, concerts, venues, shows, seatZones, seats, ticketTypes } from './schema';
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

const seed = async () => {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const [admin, user1, user2] = await db
    .insert(users)
    .values([
      {
        email: 'admin@example.com',
        phone: '13800000001',
        passwordHash: hashedPassword,
        fullName: '系统管理员',
        role: 'admin',
        isVerified: true,
      },
      {
        email: 'user1@example.com',
        phone: '13800000002',
        passwordHash: hashedPassword,
        fullName: '张三',
        role: 'audience',
        realName: '张三',
        idCardNumber: '110101199001011234',
        isVerified: true,
      },
      {
        email: 'user2@example.com',
        phone: '13800000003',
        passwordHash: hashedPassword,
        fullName: '李四',
        role: 'audience',
        realName: '李四',
        idCardNumber: '310101199203054321',
        isVerified: false,
      },
    ])
    .returning();

  console.log('Users created:', admin.id, user1.id, user2.id);

  const [concert1, concert2] = await db
    .insert(concerts)
    .values([
      {
        title: '2026 周杰伦嘉年华世界巡回演唱会',
        artist: '周杰伦',
        description: '华语流行天王周杰伦全新巡演，经典歌曲大合唱，带你回到青春岁月！',
        genre: '流行',
        organizer: '巨室音乐',
        status: 'published',
      },
      {
        title: '五月天 [人生无限公司] 演唱会',
        artist: '五月天',
        description: '五月天年度巡演，与你一起书写人生的每一章！',
        genre: '摇滚',
        organizer: '相信音乐',
        status: 'published',
      },
    ])
    .returning();

  console.log('Concerts created:', concert1.id, concert2.id);

  const [venue1, venue2] = await db
    .insert(venues)
    .values([
      {
        name: '北京国家体育场（鸟巢）',
        address: '北京市朝阳区国家体育场南路1号',
        city: '北京',
        capacity: 91000,
      },
      {
        name: '上海梅赛德斯奔驰文化中心',
        address: '上海市浦东新区世博大道1200号',
        city: '上海',
        capacity: 18000,
      },
    ])
    .returning();

  console.log('Venues created:', venue1.id, venue2.id);

  const now = new Date();
  const salesStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const salesEnd1 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const salesEnd2 = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000);

  const [show1, show2, show3] = await db
    .insert(shows)
    .values([
      {
        concertId: concert1.id,
        venueId: venue1.id,
        showDate: '2026-08-15',
        startTime: '19:30:00',
        endTime: '22:30:00',
        doorsOpenTime: '18:00:00',
        salesStartAt: salesStart,
        salesEndAt: salesEnd1,
        status: 'on_sale',
      },
      {
        concertId: concert1.id,
        venueId: venue1.id,
        showDate: '2026-08-16',
        startTime: '19:30:00',
        endTime: '22:30:00',
        doorsOpenTime: '18:00:00',
        salesStartAt: salesStart,
        salesEndAt: salesEnd1,
        status: 'on_sale',
      },
      {
        concertId: concert2.id,
        venueId: venue2.id,
        showDate: '2026-10-10',
        startTime: '20:00:00',
        endTime: '23:00:00',
        doorsOpenTime: '18:30:00',
        salesStartAt: salesStart,
        salesEndAt: salesEnd2,
        status: 'on_sale',
      },
    ])
    .returning();

  console.log('Shows created:', show1.id, show2.id, show3.id);

  const zones: Array<{
    showId: number;
    name: string;
    zoneType: 'vip' | 'premium' | 'standard' | 'economy' | 'standing';
    color: string;
    basePrice: string;
    rows: number;
    seatsPerRow: number;
  }> = [
    { showId: show1.id, name: 'VIP内场A区', zoneType: 'vip', color: '#FFD700', basePrice: '2880.00', rows: 10, seatsPerRow: 20 },
    { showId: show1.id, name: 'VIP内场B区', zoneType: 'vip', color: '#FFA500', basePrice: '2080.00', rows: 10, seatsPerRow: 30 },
    { showId: show1.id, name: '看台一层', zoneType: 'premium', color: '#FF6B6B', basePrice: '1580.00', rows: 15, seatsPerRow: 40 },
    { showId: show1.id, name: '看台二层', zoneType: 'standard', color: '#4ECDC4', basePrice: '980.00', rows: 20, seatsPerRow: 50 },
    { showId: show1.id, name: '看台三层', zoneType: 'economy', color: '#95E1D3', basePrice: '580.00', rows: 25, seatsPerRow: 60 },
    { showId: show2.id, name: 'VIP内场A区', zoneType: 'vip', color: '#FFD700', basePrice: '2880.00', rows: 10, seatsPerRow: 20 },
    { showId: show2.id, name: 'VIP内场B区', zoneType: 'vip', color: '#FFA500', basePrice: '2080.00', rows: 10, seatsPerRow: 30 },
    { showId: show2.id, name: '看台一层', zoneType: 'premium', color: '#FF6B6B', basePrice: '1580.00', rows: 15, seatsPerRow: 40 },
    { showId: show2.id, name: '看台二层', zoneType: 'standard', color: '#4ECDC4', basePrice: '980.00', rows: 20, seatsPerRow: 50 },
    { showId: show2.id, name: '看台三层', zoneType: 'economy', color: '#95E1D3', basePrice: '580.00', rows: 25, seatsPerRow: 60 },
    { showId: show3.id, name: '内场VIP', zoneType: 'vip', color: '#FFD700', basePrice: '1880.00', rows: 8, seatsPerRow: 20 },
    { showId: show3.id, name: '内场A区', zoneType: 'premium', color: '#FF6B6B', basePrice: '1280.00', rows: 10, seatsPerRow: 30 },
    { showId: show3.id, name: '看台一层', zoneType: 'standard', color: '#4ECDC4', basePrice: '880.00', rows: 15, seatsPerRow: 40 },
    { showId: show3.id, name: '看台二层', zoneType: 'economy', color: '#95E1D3', basePrice: '480.00', rows: 20, seatsPerRow: 45 },
  ];

  for (const zone of zones) {
    const [createdZone] = await db
      .insert(seatZones)
      .values({
        showId: zone.showId,
        name: zone.name,
        zoneType: zone.zoneType,
        color: zone.color,
        basePrice: zone.basePrice,
        rows: zone.rows,
        seatsPerRow: zone.seatsPerRow,
        totalSeats: zone.rows * zone.seatsPerRow,
        availableSeats: zone.rows * zone.seatsPerRow,
      })
      .returning();

    const seatRows = [];
    for (let r = 1; r <= zone.rows; r++) {
      for (let s = 1; s <= zone.seatsPerRow; s++) {
        seatRows.push({
          showId: zone.showId,
          zoneId: createdZone.id,
          rowNumber: r,
          seatNumber: s,
          seatLabel: `${r}排${s}号`,
          price: zone.basePrice,
        });
      }
    }
    await db.insert(seats).values(seatRows);
    console.log(`Zone ${zone.name} created with ${seatRows.length} seats`);
  }

  const allZones = await db.select().from(seatZones);
  const ticketTypeData = [];

  for (const zone of allZones) {
    ticketTypeData.push({
      showId: zone.showId,
      zoneId: zone.id,
      name: zone.name,
      description: `第${zone.rows}排*每排${zone.seatsPerRow}座，共${zone.totalSeats}座`,
      price: zone.basePrice,
      originalStock: zone.totalSeats,
      remainingStock: zone.totalSeats,
      soldCount: 0,
      refundedCount: 0,
      maxPerOrder: 4,
      requireRealName: true,
      isActive: true,
    });
  }

  await db.insert(ticketTypes).values(ticketTypeData);
  console.log('Ticket types created:', ticketTypeData.length);

  console.log('Database seeded successfully!');
  console.log('Admin login: admin@example.com / password123');
  console.log('User login: user1@example.com / password123');
  process.exit(0);
};

seed().catch((e) => {
  console.error('Seeding failed:', e);
  process.exit(1);
});
