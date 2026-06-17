import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  list(includeOff = false) {
    const where: any = {};
    if (!includeOff) where.isOnSale = true;
    return this.prisma.ticketType.findMany({ where, orderBy: { price: 'asc' } });
  }

  async get(id: string) {
    const t = await this.prisma.ticketType.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('票种不存在');
    return t;
  }

  async create(data: any) {
    return this.prisma.ticketType.create({
      data: {
        name: data.name, level: data.level, price: data.price,
        totalInventory: data.totalInventory, warningThreshold: data.warningThreshold || 10,
        isOnSale: data.isOnSale !== undefined ? data.isOnSale : true,
        description: data.description, qualityWeight: data.qualityWeight || { score: 1 },
      },
    });
  }

  async update(id: string, data: any) {
    await this.get(id);
    return this.prisma.ticketType.update({
      where: { id },
      data: {
        name: data.name, level: data.level, price: data.price,
        totalInventory: data.totalInventory, warningThreshold: data.warningThreshold,
        description: data.description, qualityWeight: data.qualityWeight,
      },
    });
  }

  async setStatus(id: string, isOnSale: boolean) {
    const t = await this.get(id);
    if (!isOnSale && t.soldCount > t.totalInventory) {
      throw new BadRequestException('已售超过总量无法停售');
    }
    return this.prisma.ticketType.update({ where: { id }, data: { isOnSale } });
  }

  async adjustInventory(id: string, delta: number, reason: string, operatorId: string) {
    const t = await this.get(id);
    const afterCount = t.totalInventory + delta;
    if (afterCount < t.soldCount) throw new BadRequestException('调整后库存小于已售数量');
    const [updated] = await this.prisma.$transaction([
      this.prisma.ticketType.update({
        where: { id }, data: { totalInventory: afterCount },
      }),
      this.prisma.inventoryLog.create({
        data: {
          ticketTypeId: id, delta, beforeCount: t.totalInventory,
          afterCount, reason, operatorId,
        },
      }),
    ]);
    return updated;
  }

  async getHistory(id: string) {
    return this.prisma.inventoryLog.findMany({
      where: { ticketTypeId: id },
      orderBy: { createdAt: 'desc' },
    });
  }
}
