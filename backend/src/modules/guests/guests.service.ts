import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GuestsService {
  constructor(private prisma: PrismaService) {}

  list(keyword = '') {
    const where: any = {};
    if (keyword) where.OR = [{ name: { contains: keyword } }, { company: { contains: keyword } }];
    return this.prisma.guest.findMany({
      where, orderBy: [{ priorityLevel: 'asc' }, { usedQuota: 'desc' }],
      include: { _count: { select: { allocations: true } } },
    });
  }

  create(data: any) {
    return this.prisma.guest.create({
      data: {
        name: data.name, company: data.company, totalQuota: data.totalQuota,
        priorityLevel: data.priorityLevel || 1,
      },
    });
  }

  async updateQuota(id: string, totalQuota: number) {
    const g = await this.prisma.guest.findUnique({ where: { id } });
    if (!g) throw new NotFoundException('嘉宾不存在');
    if (totalQuota < g.usedQuota) throw new BadRequestException('配额不能低于已使用数');
    return this.prisma.guest.update({ where: { id }, data: { totalQuota } });
  }

  async allocate(id: string, data: any, assignedById: string) {
    const g = await this.prisma.guest.findUnique({ where: { id } });
    if (!g) throw new NotFoundException('嘉宾不存在');
    if (g.usedQuota >= g.totalQuota) throw new BadRequestException('嘉宾配额已满');
    const reg = await this.prisma.registration.findUnique({ where: { id: data.registrationId } });
    if (!reg) throw new NotFoundException('报名不存在');
    const existing = await this.prisma.guestAllocation.findFirst({ where: { registrationId: data.registrationId } });
    if (existing) throw new BadRequestException('该报名已分配嘉宾名额');
    return this.prisma.$transaction(async (tx) => {
      const a = await tx.guestAllocation.create({
        data: {
          guestId: id, registrationId: data.registrationId,
          priority: data.priority || 1, note: data.note, assignedById,
        },
      });
      await tx.guest.update({ where: { id }, data: { usedQuota: { increment: 1 } } });
      await tx.registration.update({ where: { id: data.registrationId }, data: { guestAllocationId: a.id } });
      return a;
    });
  }

  async listAllocations(id: string) {
    return this.prisma.guestAllocation.findMany({
      where: { guestId: id },
      include: { registration: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
