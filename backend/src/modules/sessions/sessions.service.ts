import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  list(onlyActive = true) {
    const where: any = {};
    if (onlyActive) where.isActive = true;
    return this.prisma.session.findMany({
      where,
      include: { _count: { select: { seats: true } } },
      orderBy: { startTime: 'asc' },
    });
  }

  async get(id: string) {
    const s = await this.prisma.session.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('场次不存在');
    return s;
  }

  create(data: any) {
    return this.prisma.session.create({
      data: {
        name: data.name, startTime: new Date(data.startTime),
        endTime: new Date(data.endTime), venue: data.venue,
        capacity: data.capacity, qualityWeight: data.qualityWeight || 1.0,
        isActive: data.isActive !== false,
      },
    });
  }

  update(id: string, data: any) {
    const payload: any = { ...data };
    if (data.startTime) payload.startTime = new Date(data.startTime);
    if (data.endTime) payload.endTime = new Date(data.endTime);
    return this.prisma.session.update({ where: { id }, data: payload });
  }

  async getSeats(sessionId: string) {
    await this.get(sessionId);
    const seats = await this.prisma.seat.findMany({
      where: { sessionId }, orderBy: [{ row: 'asc' }, { number: 'asc' }],
    });
    const zones = Array.from(new Set(seats.map(s => s.zone).filter(Boolean)));
    const stats: Record<string, any> = {};
    zones.forEach(z => {
      const list = seats.filter(s => s.zone === z);
      stats[z] = {
        total: list.length,
        available: list.filter(s => s.status === 'available').length,
        sold: list.filter(s => s.status === 'sold').length,
        locked: list.filter(s => s.status === 'locked').length,
      };
    });
    return { seats, zones, stats };
  }

  async updateSeat(sessionId: string, seatId: string, data: any) {
    await this.get(sessionId);
    return this.prisma.seat.update({ where: { id: seatId }, data });
  }

  async setQualityWeight(id, weight: number) {
    return this.prisma.session.update({ where: { id }, data: { qualityWeight: Number(id) } });
  }
}
