import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { concerts, shows, venues, seatZones, seats, ticketTypes, participationStats, orders, orderItems, attendances } from '../db/schema';
import { eq, and, desc, asc, isNull, gte, lt, sql } from 'drizzle-orm';
import { authMiddleware, staffMiddleware, adminMiddleware, type Env } from '../middleware/auth';

const app = new Hono<Env>();

app.get('/', async (c) => {
  const { status = 'all', search = '' } = c.req.query();
  let query: any = db
    .select({
      id: concerts.id,
      title: concerts.title,
      artist: concerts.artist,
      description: concerts.description,
      posterUrl: concerts.posterUrl,
      genre: concerts.genre,
      organizer: concerts.organizer,
      status: concerts.status,
      createdAt: concerts.createdAt,
    })
    .from(concerts);

  if (status !== 'all') {
    query = query.where(eq(concerts.status, status));
  }

  if (search) {
    query = query.where(
      sql`(${concerts.title} ILIKE ${`%${search}%`} OR ${concerts.artist} ILIKE ${`%${search}%`})`
    );
  }

  const results = await query.orderBy(desc(concerts.createdAt));
  return c.json(results);
});

app.post('/', authMiddleware, adminMiddleware,
  zValidator('json', z.object({
    title: z.string().min(1),
    artist: z.string().min(1),
    description: z.string().optional(),
    posterUrl: z.string().optional(),
    genre: z.string().optional(),
    organizer: z.string().optional(),
    status: z.enum(['draft', 'published', 'cancelled']).default('draft'),
  })),
  async (c) => {
    const data = c.req.valid('json');
    const [concert] = await db.insert(concerts).values(data as any).returning();
    return c.json(concert, 201);
  }
);

app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const [concert] = await db.select().from(concerts).where(eq(concerts.id, id));
  if (!concert) return c.json({ error: '演出不存在' }, 404);

  const showList = await db
    .select({
      id: shows.id,
      concertId: shows.concertId,
      venueId: shows.venueId,
      showDate: shows.showDate,
      startTime: shows.startTime,
      endTime: shows.endTime,
      doorsOpenTime: shows.doorsOpenTime,
      status: shows.status,
      salesStartAt: shows.salesStartAt,
      salesEndAt: shows.salesEndAt,
      venueName: venues.name,
      venueCity: venues.city,
      venueAddress: venues.address,
    })
    .from(shows)
    .leftJoin(venues, eq(shows.venueId, venues.id))
    .where(eq(shows.concertId, id))
    .orderBy(asc(shows.showDate), asc(shows.startTime));

  return c.json({ ...concert, shows: showList });
});

app.put('/:id', authMiddleware, adminMiddleware,
  zValidator('json', z.object({
    title: z.string().optional(),
    artist: z.string().optional(),
    description: z.string().optional(),
    posterUrl: z.string().optional(),
    genre: z.string().optional(),
    organizer: z.string().optional(),
    status: z.enum(['draft', 'published', 'cancelled']).optional(),
  })),
  async (c) => {
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');
    const [updated] = await db.update(concerts).set({ ...data, updatedAt: new Date() } as any)
      .where(eq(concerts.id, id)).returning();
    return c.json(updated);
  }
);

app.get('/:id/shows', async (c) => {
  const id = parseInt(c.req.param('id'));
  const showList = await db
    .select({
      id: shows.id,
      concertId: shows.concertId,
      venueId: shows.venueId,
      showDate: shows.showDate,
      startTime: shows.startTime,
      endTime: shows.endTime,
      status: shows.status,
      venueName: venues.name,
      venueCity: venues.city,
    })
    .from(shows)
    .leftJoin(venues, eq(shows.venueId, venues.id))
    .where(eq(shows.concertId, id))
    .orderBy(asc(shows.showDate));
  return c.json(showList);
});

app.get('/shows/list', async (c) => {
  const { concertId, dateFrom, dateTo, status = 'all' } = c.req.query();
  let query: any = db
    .select({
      id: shows.id,
      concertId: shows.concertId,
      venueId: shows.venueId,
      showDate: shows.showDate,
      startTime: shows.startTime,
      endTime: shows.endTime,
      doorsOpenTime: shows.doorsOpenTime,
      status: shows.status,
      salesStartAt: shows.salesStartAt,
      salesEndAt: shows.salesEndAt,
      concertTitle: concerts.title,
      artist: concerts.artist,
      posterUrl: concerts.posterUrl,
      venueName: venues.name,
      venueCity: venues.city,
    })
    .from(shows)
    .leftJoin(concerts, eq(shows.concertId, concerts.id))
    .leftJoin(venues, eq(shows.venueId, venues.id));

  if (concertId) query = query.where(eq(shows.concertId, parseInt(concertId)));
  if (dateFrom) query = query.where(gte(shows.showDate, dateFrom));
  if (dateTo) query = query.where(lt(shows.showDate, dateTo));
  if (status !== 'all') query = query.where(eq(shows.status, status));

  const results = await query.orderBy(asc(shows.showDate), asc(shows.startTime));
  return c.json(results);
});

app.get('/shows/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const [show] = await db
    .select({
      id: shows.id,
      concertId: shows.concertId,
      venueId: shows.venueId,
      showDate: shows.showDate,
      startTime: shows.startTime,
      endTime: shows.endTime,
      doorsOpenTime: shows.doorsOpenTime,
      status: shows.status,
      salesStartAt: shows.salesStartAt,
      salesEndAt: shows.salesEndAt,
      concertTitle: concerts.title,
      artist: concerts.artist,
      description: concerts.description,
      posterUrl: concerts.posterUrl,
      genre: concerts.genre,
      organizer: concerts.organizer,
      venueName: venues.name,
      venueCity: venues.city,
      venueAddress: venues.address,
      venueCapacity: venues.capacity,
      seatingChart: venues.seatingChart,
    })
    .from(shows)
    .leftJoin(concerts, eq(shows.concertId, concerts.id))
    .leftJoin(venues, eq(shows.venueId, venues.id))
    .where(eq(shows.id, id));

  if (!show) return c.json({ error: '场次不存在' }, 404);

  const zones = await db.select().from(seatZones).where(eq(seatZones.showId, id));
  const ticketTypeList = await db.select().from(ticketTypes).where(eq(ticketTypes.showId, id));

  return c.json({ ...show, zones, ticketTypes: ticketTypeList });
});

app.post('/shows/:id/zones', authMiddleware, adminMiddleware,
  zValidator('json', z.object({
    name: z.string(),
    zoneType: z.enum(['vip', 'premium', 'standard', 'economy', 'standing']),
    color: z.string().optional(),
    basePrice: z.string(),
    rows: z.number(),
    seatsPerRow: z.number(),
  })),
  async (c) => {
    const showId = parseInt(c.req.param('id'));
    const data = c.req.valid('json');
    const totalSeats = data.rows * data.seatsPerRow;

    const [zone] = await db.insert(seatZones).values({
      ...data,
      showId,
      totalSeats,
      availableSeats: totalSeats,
    } as any).returning();

    const seatRows = [];
    for (let r = 1; r <= data.rows; r++) {
      for (let s = 1; s <= data.seatsPerRow; s++) {
        seatRows.push({
          showId,
          zoneId: zone.id,
          rowNumber: r,
          seatNumber: s,
          seatLabel: `${r}排${s}号`,
          price: data.basePrice,
        });
      }
    }
    await db.insert(seats).values(seatRows);

    return c.json({ ...zone, seatCount: seatRows.length }, 201);
  }
);

app.get('/shows/:id/seats', async (c) => {
  const showId = parseInt(c.req.param('id'));
  const { zoneId } = c.req.query();

  let query: any = db.select().from(seats).where(eq(seats.showId, showId));
  if (zoneId) query = query.where(eq(seats.zoneId, parseInt(zoneId)));

  const seatList = await query.orderBy(asc(seats.rowNumber), asc(seats.seatNumber));
  const zones = await db.select().from(seatZones).where(eq(seatZones.showId, showId));

  return c.json({ seats: seatList, zones });
});

app.post('/shows/:id/stats/sync', authMiddleware, staffMiddleware, async (c) => {
  const showId = parseInt(c.req.param('id'));
  const stats = await calculateShowStats(showId);
  return c.json(stats);
});

async function calculateShowStats(showId: number) {
  const ticketItems = await db
    .select({
      orderId: orders.id,
      orderStatus: orders.status,
      orderItemId: seats.orderItemId,
      ticketStatus: seats.status,
      price: seats.price,
      scanned: attendances.hasAttended,
    })
    .from(seats)
    .leftJoin(orderItems, eq(seats.orderItemId, orderItems.id))
    .leftJoin(orders, eq(orderItems.orderId, orders.id))
    .leftJoin(attendances, eq(attendances.orderItemId, orderItems.id))
    .where(eq(seats.showId, showId));

  let soldTickets = 0;
  let scannedTickets = 0;
  let refundedTickets = 0;
  let revenue = 0;
  let refundAmount = 0;

  for (const item of ticketItems) {
    const price = parseFloat(item.price as string || '0');
    if (item.ticketStatus === 'sold' || item.ticketStatus === 'scanned') {
      soldTickets++;
      revenue += price;
      if (item.scanned) scannedTickets++;
    }
    if (item.ticketStatus === 'refunded') {
      refundedTickets++;
      refundAmount += price;
    }
  }

  const totalZoneSeats = await db
    .select({ total: sql<number>`COALESCE(SUM(${seatZones.totalSeats}), 0)`.as('total') })
    .from(seatZones)
    .where(eq(seatZones.showId, showId));

  const totalTickets = totalZoneSeats[0].total;
  const attendanceRate = totalTickets > 0 ? ((scannedTickets / totalTickets) * 100).toFixed(2) : '0.00';

  const today = new Date().toISOString().split('T')[0];
  const existing = await db
    .select()
    .from(participationStats)
    .where(and(eq(participationStats.showId, showId), eq(participationStats.date, today)))
    .limit(1);

  const data = {
    totalTickets,
    soldTickets,
    scannedTickets,
    refundedTickets,
    attendanceRate,
    revenue: revenue.toFixed(2),
    refundAmount: refundAmount.toFixed(2),
    netRevenue: (revenue - refundAmount).toFixed(2),
  };

  if (existing.length > 0) {
    const [updated] = await db
      .update(participationStats)
      .set({ ...data, lastSyncedAt: new Date(), updatedAt: new Date() })
      .where(eq(participationStats.id, existing[0].id))
      .returning();
    return updated;
  } else {
    const [created] = await db
      .insert(participationStats)
      .values({ showId, date: today, ...data })
      .returning();
    return created;
  }
}

app.get('/shows/:id/stats', authMiddleware, staffMiddleware, async (c) => {
  const showId = parseInt(c.req.param('id'));
  const stat = await calculateShowStats(showId);
  const ticketStats = await db
    .select({
      zoneId: seatZones.id,
      zoneName: seatZones.name,
      zoneType: seatZones.zoneType,
      color: seatZones.color,
      totalSeats: seatZones.totalSeats,
      soldSeats: sql<number>`COUNT(CASE WHEN ${seats.status} IN ('sold', 'scanned') THEN 1 END)`.as('sold_seats'),
      refundedSeats: sql<number>`COUNT(CASE WHEN ${seats.status} = 'refunded' THEN 1 END)`.as('refunded_seats'),
      availableSeats: sql<number>`COUNT(CASE WHEN ${seats.status} = 'available' THEN 1 END)`.as('available_seats'),
    })
    .from(seatZones)
    .leftJoin(seats, and(eq(seats.zoneId, seatZones.id), eq(seats.showId, showId)))
    .where(eq(seatZones.showId, showId))
    .groupBy(seatZones.id);

  return c.json({ overall: stat, byZone: ticketStats });
});

export default app;
