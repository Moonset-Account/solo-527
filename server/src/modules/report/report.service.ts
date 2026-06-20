import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report } from '../../schemas/report.schema';
import { CreateReportDto, UpdateReportDto, QueryReportDto } from './report.dto';

@Injectable()
export class ReportService {
  constructor(@InjectModel(Report.name) private reportModel: Model<Report>) {}

  async create(dto: CreateReportDto): Promise<Report> {
    const created = new this.reportModel(dto);
    return created.save();
  }

  async findAll(query: QueryReportDto): Promise<{ data: Report[]; total: number; page: number; limit: number }> {
    const { activityId, status, reporterId, page = 1, limit = 10 } = query;
    const filter: any = {};
    if (activityId) filter.activityId = activityId;
    if (status) filter.status = status;
    if (reporterId) filter.reporterId = reporterId;

    const [data, total] = await Promise.all([
      this.reportModel.find(filter).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }).exec(),
      this.reportModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportModel.findById(id).exec();
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async update(id: string, dto: UpdateReportDto): Promise<Report> {
    const updateData: any = { ...dto };
    if (dto.status === 'resolved' || dto.status === 'rejected') {
      updateData.resolvedAt = new Date();
    }
    const updated = await this.reportModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!updated) throw new NotFoundException('Report not found');
    return updated;
  }
}
