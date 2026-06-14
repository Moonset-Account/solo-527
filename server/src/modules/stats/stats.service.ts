import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Content, ContentDocument } from '../content/schemas/content.schema';
import { isDbReady, safeQuery } from '@/common/db-utils';
import dayjs from 'dayjs';

@Injectable()
export class StatsService {
  constructor(@InjectModel(Content.name) private contentModel: Model<ContentDocument>) {}

  private mockStats(): Record<string, number> {
    return {
      draft: 12, submitted: 5, reviewing: 8, approved: 3, rejected: 2,
      filming: 4, editing: 6, pending_publish: 3, published: 15, publish_failed: 1, archived: 7
    };
  }

  async getStatusStats(startDate?: string, endDate?: string, assignee?: string) {
    if (!isDbReady()) return this.mockStats();

    const filter: any = { deletedAt: null };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = dayjs(startDate).startOf('day').toDate();
      if (endDate) filter.createdAt.$lte = dayjs(endDate).endOf('day').toDate();
    }
    if (assignee) filter.assignee = assignee;

    return safeQuery(async () => {
      const contents: any[] = await this.contentModel.find(filter).lean().exec();
      const stats: Record<string, number> = {
        draft: 0, submitted: 0, reviewing: 0, approved: 0, rejected: 0,
        filming: 0, editing: 0, pending_publish: 0, published: 0, publish_failed: 0, archived: 0
      };
      contents.forEach((c) => {
        const s = c.status || 'draft';
        stats[s] = (stats[s] || 0) + 1;
      });
      return stats;
    }, this.mockStats());
  }

  async getTrendStats(days: number = 7) {
    if (!isDbReady()) {
      const result: Array<{ date: string; count: number }> = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
        result.push({ date, count: Math.floor(Math.random() * 8) + 2 });
      }
      return result;
    }
    return safeQuery(async () => {
      const result: Array<{ date: string; count: number }> = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
        const start = dayjs(date).startOf('day').toDate();
        const end = dayjs(date).endOf('day').toDate();
        const count = await this.contentModel.countDocuments({
          deletedAt: null,
          createdAt: { $gte: start, $lte: end },
        });
        result.push({ date, count });
      }
      return result;
    }, []);
  }

  async getAssigneeStats(startDate?: string, endDate?: string) {
    if (!isDbReady()) {
      return {
        zhangsan: { total: 10, byStatus: { draft: 3, reviewing: 4, published: 3 } },
        lisi: { total: 7, byStatus: { draft: 2, approved: 2, published: 3 } },
        wangwu: { total: 5, byStatus: { editing: 3, publish_failed: 1, pending_publish: 1 } },
      };
    }
    const filter: any = { deletedAt: null };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = dayjs(startDate).startOf('day').toDate();
      if (endDate) filter.createdAt.$lte = dayjs(endDate).endOf('day').toDate();
    }

    return safeQuery(async () => {
      const contents: any[] = await this.contentModel.find(filter).lean().exec();
      const stats: Record<string, { total: number; byStatus: Record<string, number> }> = {};
      contents.forEach((c) => {
        const key = c.assignee || '未分配';
        if (!stats[key]) stats[key] = { total: 0, byStatus: {} };
        stats[key].total++;
        const s = c.status || 'draft';
        stats[key].byStatus[s] = (stats[key].byStatus[s] || 0) + 1;
      });
      return stats;
    }, {});
  }
}
