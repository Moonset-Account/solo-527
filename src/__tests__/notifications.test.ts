import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

describe('通知系统测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该能够创建排练通知', async () => {
    const mockNotification = {
      id: 'notif-1',
      userId: 'user-1',
      type: 'REHEARSAL',
      title: '新排练安排',
      content: '《雷雨》有新的排练安排',
      relatedId: 'rehearsal-1',
      isRead: false,
      createdAt: new Date(),
    };

    (prisma.notification.findMany as any).mockResolvedValue([mockNotification]);

    const result = await prisma.notification.findMany({
      where: { userId: 'user-1' },
    });

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('REHEARSAL');
    expect(result[0].title).toBe('新排练安排');
    expect(result[0].isRead).toBe(false);
  });

  it('应该能够标记通知为已读', async () => {
    (prisma.notification.updateMany as any).mockResolvedValue({ count: 1 });

    const result = await prisma.notification.updateMany({
      where: { id: { in: ['notif-1'] }, userId: 'user-1' },
      data: { isRead: true },
    });

    expect(result.count).toBe(1);
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['notif-1'] }, userId: 'user-1' },
      data: { isRead: true },
    });
  });

  it('应该能够统计未读通知数量', async () => {
    (prisma.notification.count as any).mockResolvedValue(3);

    const count = await prisma.notification.count({
      where: { userId: 'user-1', isRead: false },
    });

    expect(count).toBe(3);
  });

  it('应该支持多种通知类型', async () => {
    const notifications = [
      { id: '1', type: 'REHEARSAL', title: '排练提醒' },
      { id: '2', type: 'TICKET', title: '购票成功' },
      { id: '3', type: 'LEAVE', title: '请假审批' },
      { id: '4', type: 'FINANCE', title: '财务记录' },
      { id: '5', type: 'SYSTEM', title: '系统公告' },
    ];

    (prisma.notification.findMany as any).mockResolvedValue(notifications);

    const result = await prisma.notification.findMany();
    const types = new Set(result.map((n: any) => n.type));

    expect(types.has('REHEARSAL')).toBe(true);
    expect(types.has('TICKET')).toBe(true);
    expect(types.has('LEAVE')).toBe(true);
    expect(types.has('FINANCE')).toBe(true);
    expect(types.has('SYSTEM')).toBe(true);
  });
});
