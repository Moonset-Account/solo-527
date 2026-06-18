import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Anomaly } from '../anomalies/schemas/anomaly.schema';
import { Dataset } from '../datasets/schemas/dataset.schema';
import { Report } from '../reports/schemas/report.schema';

export interface SearchFilters {
  types?: ('anomaly' | 'dataset' | 'report')[];
  categories?: string[];
  severities?: string[];
  statuses?: string[];
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Anomaly.name) private anomalyModel: Model<Anomaly>,
    @InjectModel(Dataset.name) private datasetModel: Model<Dataset>,
    @InjectModel(Report.name) private reportModel: Model<Report>,
  ) {}

  async globalSearch(
    keyword: string,
    filters: SearchFilters = {},
    page: number = 1,
    pageSize: number = 20,
  ) {
    const types = filters.types || ['anomaly', 'dataset', 'report'];

    const tasks: Promise<any>[] = [];

    if (types.includes('anomaly')) {
      tasks.push(this.searchAnomalies(keyword, filters, 1, pageSize));
    }
    if (types.includes('dataset')) {
      tasks.push(this.searchDatasets(keyword, filters, 1, pageSize));
    }
    if (types.includes('report')) {
      tasks.push(this.searchReports(keyword, filters, 1, pageSize));
    }

    const results = await Promise.all(tasks);

    const anomalyRes = types.includes('anomaly') ? results.shift() : null;
    const datasetRes = types.includes('dataset') ? results.shift() : null;
    const reportRes = types.includes('report') ? results.shift() : null;

    const allItems = [
      ...(anomalyRes?.items || []).map((i: any) => ({ ...i, _type: 'anomaly' })),
      ...(datasetRes?.items || []).map((i: any) => ({ ...i, _type: 'dataset' })),
      ...(reportRes?.items || []).map((i: any) => ({ ...i, _type: 'report' })),
    ];

    allItems.sort((a, b) => {
      const aTime = new Date(a.createdAt || a.detectedAt).getTime();
      const bTime = new Date(b.createdAt || b.detectedAt).getTime();
      return bTime - aTime;
    });

    const start = (page - 1) * pageSize;
    const paginatedItems = allItems.slice(start, start + pageSize);

    return {
      items: paginatedItems,
      total: allItems.length,
      page,
      pageSize,
      counts: {
        anomaly: anomalyRes?.total || 0,
        dataset: datasetRes?.total || 0,
        report: reportRes?.total || 0,
      },
    };
  }

  private async searchAnomalies(
    keyword: string,
    filters: SearchFilters,
    page: number,
    pageSize: number,
  ) {
    const filter: any = {};
    const regex = { $regex: keyword, $options: 'i' };

    filter.$or = [
      { title: regex },
      { metricName: regex },
      { summary: regex },
      { 'possibleCauses.description': regex },
      { tags: { $in: [new RegExp(keyword, 'i')] } },
    ];

    if (filters.categories?.length) filter.category = { $in: filters.categories };
    if (filters.severities?.length) filter.severity = { $in: filters.severities };
    if (filters.statuses?.length) filter.status = { $in: filters.statuses };

    if (filters.dateFrom || filters.dateTo) {
      filter.detectedAt = {};
      if (filters.dateFrom) filter.detectedAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) filter.detectedAt.$lte = new Date(filters.dateTo);
    }

    const total = await this.anomalyModel.countDocuments(filter);
    const items = await this.anomalyModel
      .find(filter)
      .sort({ detectedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return { items, total };
  }

  private async searchDatasets(
    keyword: string,
    filters: SearchFilters,
    page: number,
    pageSize: number,
  ) {
    const filter: any = {};
    const regex = { $regex: keyword, $options: 'i' };

    filter.$or = [
      { name: regex },
      { code: regex },
      { description: regex },
      { category: regex },
      { 'metrics.displayName': regex },
    ];

    if (filters.categories?.length) filter.category = { $in: filters.categories };
    if (filters.statuses?.length) filter.status = { $in: filters.statuses };

    if (filters.dateFrom || filters.dateTo) {
      filter.createdAt = {};
      if (filters.dateFrom) filter.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) filter.createdAt.$lte = new Date(filters.dateTo);
    }

    const total = await this.datasetModel.countDocuments(filter);
    const items = await this.datasetModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return { items, total };
  }

  private async searchReports(
    keyword: string,
    filters: SearchFilters,
    page: number,
    pageSize: number,
  ) {
    const filter: any = {};
    const regex = { $regex: keyword, $options: 'i' };

    filter.$or = [
      { title: regex },
      { summary: regex },
      { highlights: regex },
      { problems: regex },
      { improvements: regex },
      { tags: { $in: [new RegExp(keyword, 'i')] } },
    ];

    if (filters.statuses?.length) filter.status = { $in: filters.statuses };

    if (filters.dateFrom || filters.dateTo) {
      filter.$or = [];
      if (filters.dateFrom) {
        filter.$or.push({ endDate: { $gte: new Date(filters.dateFrom) } });
      }
      if (filters.dateTo) {
        filter.$or.push({ startDate: { $lte: new Date(filters.dateTo) } });
      }
    }

    const total = await this.reportModel.countDocuments(filter);
    const items = await this.reportModel
      .find(filter)
      .sort({ startDate: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return { items, total };
  }

  async suggestKeywords(keyword: string): Promise<string[]> {
    if (!keyword || keyword.length < 1) return [];

    const regex = new RegExp(keyword, 'i');
    const [anomalies, datasets, reports] = await Promise.all([
      this.anomalyModel
        .find({ title: regex })
        .limit(5)
        .distinct('title'),
      this.datasetModel
        .find({ $or: [{ name: regex }, { code: regex }] })
        .limit(5)
        .select('name code -_id'),
      this.reportModel
        .find({ title: regex })
        .limit(5)
        .distinct('title'),
    ]);

    const suggestions = new Set<string>();
    anomalies.forEach((t) => suggestions.add(t));
    datasets.forEach((d: any) => {
      suggestions.add(d.name);
      suggestions.add(d.code);
    });
    reports.forEach((t) => suggestions.add(t));

    return Array.from(suggestions).slice(0, 15);
  }
}
