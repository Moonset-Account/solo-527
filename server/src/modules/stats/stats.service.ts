import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Content, ContentDocument } from '../content/schemas/content.schema';
import dayjs from 'dayjs';

@Injectable()
export class StatsService {
  constructor(@InjectModel(Content.name) private contentModel: Model<ContentDocument>) {}

  async getStatusStats(startDate?: string, endDate?: string, assignee?: string) {
    const filter: any = { deletedAt: null };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = dayjs(startDate).startOf('day').toDate();
      if (endDate) filter.createdAt.$lte = dayjs(endDate).endOf('day').toDate();
    }
    if (assignee) filter.assignee = assignee;

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
  }

  async getTrendStats(days: number = 7) {
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
  }

  async getAssigneeStats(startDate?: string, endDate?: string) {
    const filter: any = { deletedAt: null };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = dayjs(startDate).startOf('day').toDate();
      if (endDate) filter.createdAt.$lte = dayjs(endDate).endOf('day').toDate();
    }

    const contents: any[] = await this.contentModel.find(filter).lean().exec();
    const stats: Record<string, { total: number; byStatus: Record<string, number> }> = {};

    contents.forEach((c) => {
      const key = c.assignee || '未分配';
      if (!stats[key]) {
        stats[key] = { total: 0, byStatus: {} };
      }
      stats[key].total++;
      const s = c.status || 'draft';
      stats[key].byStatus[s] = (stats[key].byStatus[s] || 0) + 1;
    });

    return stats;
  }
}
