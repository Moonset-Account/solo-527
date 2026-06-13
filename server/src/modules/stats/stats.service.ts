import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Content, ContentDocument } from '../content/schemas/content.schema';
import { ContentStatus } from '../../common/enums';
import * as dayjs from 'dayjs';

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

    const contents = await this.contentModel.find(filter).exec();
    const stats: Record<string, number> = {};

    Object.values(ContentStatus).forEach((status) => {
      stats[status] = 0;
    });

    contents.forEach((c) => {
      stats[c.status] = (stats[c.status] || 0) + 1;
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

    const contents = await this.contentModel.find(filter).exec();
    const stats: Record<string, { total: number; byStatus: Record<string, number> }> = {};

    contents.forEach((c) => {
      const key = c.assignee || '未分配';
      if (!stats[key]) {
        stats[key] = { total: 0, byStatus: {} };
      }
      stats[key].total++;
      stats[key].byStatus[c.status] = (stats[key].byStatus[c.status] || 0) + 1;
    });

    return stats;
  }
}
