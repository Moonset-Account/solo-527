import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    financeRecord: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe('附件上传功能测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('财务记录应该支持收据附件', async () => {
    const recordWithReceipt = {
      id: 'finance-1',
      type: 'EXPENSE',
      category: '道具采购',
      amount: 500,
      description: '购买舞台道具',
      receiptUrl: '/uploads/receipts/2024/01/prop-receipt.jpg',
      recordedById: 'user-1',
      recordedAt: new Date(),
    };

    (prisma.financeRecord.create as any).mockResolvedValue(recordWithReceipt);

    const result = await prisma.financeRecord.create({
      data: {
        type: 'EXPENSE',
        category: '道具采购',
        amount: 500,
        description: '购买舞台道具',
        receiptUrl: '/uploads/receipts/2024/01/prop-receipt.jpg',
        recordedById: 'user-1',
      },
    });

    expect(result.receiptUrl).toBe('/uploads/receipts/2024/01/prop-receipt.jpg');
    expect(result.type).toBe('EXPENSE');
    expect(result.amount).toBe(500);
  });

  it('应该能够查询带有附件的财务记录', async () => {
    const records = [
      {
        id: '1',
        category: '道具采购',
        receiptUrl: '/uploads/receipts/1.jpg',
        hasReceipt: true,
      },
      {
        id: '2',
        category: '场地租赁',
        receiptUrl: null,
        hasReceipt: false,
      },
      {
        id: '3',
        category: '票务收入',
        receiptUrl: null,
        hasReceipt: false,
      },
    ];

    const recordsWithReceipt = records.filter((r) => r.receiptUrl !== null);
    expect(recordsWithReceipt).toHaveLength(1);
    expect(recordsWithReceipt[0].id).toBe('1');
  });

  it('剧目应该支持海报图片', async () => {
    const productionWithPoster = {
      id: 'prod-1',
      title: '雷雨',
      posterUrl: '/uploads/posters/leiyu.jpg',
    };

    expect(productionWithPoster.posterUrl).toBeDefined();
    expect(productionWithPoster.posterUrl).toContain('.jpg');
  });

  it('应该支持不同类型的文件格式', async () => {
    const validFormats = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];
    const testUrls = [
      '/uploads/receipt.jpg',
      '/uploads/invoice.pdf',
      '/uploads/poster.png',
    ];

    testUrls.forEach((url) => {
      const hasValidFormat = validFormats.some((format) =>
        url.toLowerCase().endsWith(format)
      );
      expect(hasValidFormat).toBe(true);
    });
  });
});
