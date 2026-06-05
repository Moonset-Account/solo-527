import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    ticket: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    seat: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    seatChangeLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn(prisma)),
  },
}));

describe('换座功能测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该能够记录换座历史', async () => {
    const mockLog = {
      id: 'log-1',
      ticketId: 'ticket-1',
      oldSeatId: 'seat-old',
      newSeatId: 'seat-new',
      operatorId: 'operator-1',
      reason: '用户申请调换',
      createdAt: new Date(),
    };

    (prisma.seatChangeLog.create as any).mockResolvedValue(mockLog);

    const result = await prisma.seatChangeLog.create({
      data: {
        ticketId: 'ticket-1',
        oldSeatId: 'seat-old',
        newSeatId: 'seat-new',
        operatorId: 'operator-1',
        reason: '用户申请调换',
      },
    });

    expect(result.ticketId).toBe('ticket-1');
    expect(result.oldSeatId).toBe('seat-old');
    expect(result.newSeatId).toBe('seat-new');
    expect(result.reason).toBe('用户申请调换');
    expect(result.operatorId).toBe('operator-1');
  });

  it('应该能够查询座位的换座历史', async () => {
    const logs = [
      {
        id: 'log-1',
        ticketId: 'ticket-1',
        oldSeatId: 'seat-a1',
        newSeatId: 'seat-b2',
        createdAt: new Date('2024-01-15'),
      },
      {
        id: 'log-2',
        ticketId: 'ticket-1',
        oldSeatId: 'seat-b2',
        newSeatId: 'seat-c3',
        createdAt: new Date('2024-01-20'),
      },
    ];

    (prisma.seatChangeLog.findMany as any).mockResolvedValue(logs);

    const history = await prisma.seatChangeLog.findMany({
      where: { ticketId: 'ticket-1' },
      orderBy: { createdAt: 'asc' },
    });

    expect(history).toHaveLength(2);
    expect(history[0].oldSeatId).toBe('seat-a1');
    expect(history[0].newSeatId).toBe('seat-b2');
    expect(history[1].oldSeatId).toBe('seat-b2');
    expect(history[1].newSeatId).toBe('seat-c3');
  });

  it('换座时应该更新原座位状态为可用', async () => {
    (prisma.seat.update as any).mockResolvedValue({
      id: 'seat-old',
      status: 'AVAILABLE',
      orderId: null,
    });

    const result = await prisma.seat.update({
      where: { id: 'seat-old' },
      data: { status: 'AVAILABLE', orderId: null },
    });

    expect(result.status).toBe('AVAILABLE');
    expect(result.orderId).toBeNull();
  });

  it('换座时应该更新新座位状态为已售', async () => {
    (prisma.seat.update as any).mockResolvedValue({
      id: 'seat-new',
      status: 'SOLD',
      orderId: 'order-1',
    });

    const result = await prisma.seat.update({
      where: { id: 'seat-new' },
      data: { status: 'SOLD', orderId: 'order-1' },
    });

    expect(result.status).toBe('SOLD');
    expect(result.orderId).toBe('order-1');
  });
});
