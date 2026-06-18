import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report } from './schemas/report.schema';
import { CreateReportDto, UpdateReportDto, QueryReportsDto } from './dto/report.dto';
import { AnomaliesService } from '../anomalies/anomalies.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<Report>,
    private anomaliesService: AnomaliesService,
  ) {}

  async create(
    createDto: CreateReportDto,
    operator?: any,
  ): Promise<Report> {
    const report = new this.reportModel({
      ...createDto,
      startDate: new Date(createDto.startDate),
      endDate: new Date(createDto.endDate),
      createdById: operator?.sub ? new Types.ObjectId(operator.sub) : null,
      createdByName: operator?.name || '系统',
    });

    await this.populateReportData(report);
    return report.save();
  }

  private async populateReportData(report: any) {
    const stats = await this.anomaliesService.getStatistics();

    const anomalies = await this.anomaliesService.findAll({
      startDate: report.startDate.toISOString(),
      endDate: report.endDate.toISOString(),
      page: 1,
      pageSize: 500,
    });

    const resolvedAnomalies = anomalies.list.filter(
      (a: any) => a.status === 'resolved',
    );

    report.statistics = {
      totalAnomalies: anomalies.total,
      resolvedCount: resolvedAnomalies.length,
      resolutionRate: anomalies.total
        ? Number(
            ((resolvedAnomalies.length / anomalies.total) * 100).toFixed(2),
          )
        : 0,
      bySeverity: stats.bySeverity,
      byCategory: stats.byCategory,
    };

    report.reviewItems = resolvedAnomalies.slice(0, 20).map((a: any) => ({
      anomalyId: a._id,
      anomalyTitle: a.title,
      severity: a.severity,
      category: a.category,
      status: a.status,
      rootCause: a.possibleCauses?.[0]?.description || '',
      solution: a.resolvedCause || '',
      preventive: '',
    }));

    if (!report.schedule) {
      report.schedule = {
        weeklyOwner: '运营经理',
        weeklyTime: '每周一 10:00',
        monthlyOwner: '运营总监',
        monthlyTime: '每月第1个周一 14:00',
        participants: ['运营组', '产品组', '技术组'],
      };
    }
  }

  async findAll(query: QueryReportsDto) {
    const { keyword, reportType, status, startDate, endDate, page = 1, pageSize = 20 } = query;
    const filter: any = {};

    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { summary: { $regex: keyword, $options: 'i' } },
        { highlights: { $regex: keyword, $options: 'i' } },
        { tags: { $in: [new RegExp(keyword, 'i')] } },
      ];
    }
    if (reportType) filter.reportType = reportType;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.$or = [];
      if (startDate) {
        filter.$or.push({ endDate: { $gte: new Date(startDate) } });
      }
      if (endDate) {
        filter.$or.push({ startDate: { $lte: new Date(endDate) } });
      }
    }

    const total = await this.reportModel.countDocuments(filter);
    const list = await this.reportModel
      .find(filter)
      .sort({ startDate: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return { list, total, page, pageSize };
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportModel.findById(id);
    if (!report) {
      throw new NotFoundException('报表不存在');
    }
    return report;
  }

  async update(
    id: string,
    updateDto: UpdateReportDto,
    operator?: any,
  ): Promise<Report> {
    const report = await this.reportModel.findById(id);
    if (!report) {
      throw new NotFoundException('报表不存在');
    }

    const wasDraft = report.status === 'draft';

    Object.assign(report, updateDto);

    if (wasDraft && updateDto.status === 'published') {
      report.publishedAt = new Date();
      report.publishedById = operator?.sub
        ? new Types.ObjectId(operator.sub)
        : null;
      report.publishedByName = operator?.name || '系统';
    }

    return report.save();
  }

  async publish(id: string, operator?: any): Promise<Report> {
    return this.update(id, { status: 'published' }, operator);
  }

  async remove(id: string): Promise<void> {
    const report = await this.reportModel.findByIdAndDelete(id);
    if (!report) {
      throw new NotFoundException('报表不存在');
    }
  }

  async getLatestPublished(type: 'weekly' | 'monthly') {
    return this.reportModel
      .findOne({ reportType: type, status: 'published' })
      .sort({ startDate: -1 });
  }

  @Cron('0 0 10 * * 1')
  async weeklyReportReminder() {
    console.log('📅 每周复盘提醒：请准备本周异常复盘数据');
  }

  @Cron('0 30 14 1-7 * *')
  async monthlyReportReminder() {
    const now = new Date();
    if (now.getDay() === 1) {
      console.log('📅 每月复盘提醒：请准备上月异常复盘数据');
    }
  }

  async initMockData() {
    const count = await this.reportModel.countDocuments();
    if (count > 0) return;

    const now = new Date();
    const mockReports = [
      {
        title: '2025年第24周 用户增长异常周报',
        reportType: 'weekly' as const,
        startDate: new Date(now.getTime() - 7 * 86400000),
        endDate: new Date(now.getTime() - 86400000),
        summary: '本周用户增长整体平稳，日新增用户在 900-1100 区间波动，未出现严重异常。7日留存率较上周下降 3.2%，需持续关注。',
        highlights: '渠道 A 优化后 ROI 提升 15%\n推送策略调整后点击率上升 8%',
        problems: '注册页面偶发卡顿，影响转化\n渠道 B 流量质量下降，留存偏低',
        improvements: '优化注册接口响应时间\n调整渠道 B 投放定向，提升流量质量',
        status: 'published',
        tags: ['周报', '用户增长', '24周'],
        schedule: {
          weeklyOwner: '运营经理',
          weeklyTime: '每周一 10:00',
          monthlyOwner: '运营总监',
          monthlyTime: '每月第1个周一 14:00',
          participants: ['运营组', '产品组', '技术组'],
        },
      },
      {
        title: '2025年5月 用户增长异常月报',
        reportType: 'monthly' as const,
        startDate: new Date(now.getTime() - 35 * 86400000),
        endDate: new Date(now.getTime() - 5 * 86400000),
        summary: '5月整体新增用户 2.8 万，环比下降 5%。主要异常集中在上半月，下半月通过渠道优化后恢复。复盘会议已完成，改进措施已落地。',
        highlights: '月末新增用户环比回升 12%\n首屏性能优化后转化率提升 4%',
        problems: '上半月渠道 A 流量异常下滑\nARPU 值波动较大，需精细化运营',
        improvements: '已更换渠道 A 的代理服务商\n已建立 ARPU 分层监控体系',
        status: 'published',
        tags: ['月报', '用户增长', '5月'],
        schedule: {
          weeklyOwner: '运营经理',
          weeklyTime: '每周一 10:00',
          monthlyOwner: '运营总监',
          monthlyTime: '每月第1个周一 14:00',
          participants: ['运营组', '产品组', '技术组'],
        },
      },
      {
        title: '2025年第25周 用户增长异常周报',
        reportType: 'weekly' as const,
        startDate: new Date(now.getTime()),
        endDate: new Date(now.getTime() + 6 * 86400000),
        summary: '',
        status: 'draft',
        tags: ['周报', '用户增长', '25周'],
      },
    ];

    const saved = await this.reportModel.insertMany(mockReports);
    for (const r of saved) {
      await this.populateReportData(r.toObject() as any);
      await r.save();
    }
    console.log('✅ 复盘报表模拟数据初始化完成');
  }
}
