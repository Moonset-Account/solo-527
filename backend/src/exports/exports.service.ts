import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { Interview } from '../interviews/schemas/interview.schema';
import { Assessment } from '../assessments/schemas/assessment.schema';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { OperationType } from '../common/enums/operation-type.enum';
import { SearchDto } from '../common/dto/search.dto';
import { InterviewStatus } from '../common/enums/interview-status.enum';
import { HireResult } from '../common/enums/hire-result.enum';

interface ExportParams {
  startDate?: string;
  endDate?: string;
  status?: string;
  interviewerId?: string;
  keyword?: string;
  includeAssessments?: boolean;
  includeLogs?: boolean;
}

@Injectable()
export class ExportsService {
  constructor(
    @InjectModel(Interview.name) private interviewModel: Model<any>,
    @InjectModel(Assessment.name) private assessmentModel: Model<any>,
    private operationLogsService: OperationLogsService,
  ) {}

  async buildFilter(params: ExportParams): Promise<any> {
    const filter: any = {};

    if (params.startDate || params.endDate) {
      filter.interviewDate = {};
      if (params.startDate) {
        filter.interviewDate.$gte = new Date(params.startDate);
      }
      if (params.endDate) {
        filter.interviewDate.$lte = new Date(params.endDate);
      }
    }

    if (params.status) {
      filter.status = params.status;
    }

    if (params.interviewerId) {
      filter.interviewerId = new Types.ObjectId(params.interviewerId);
    }

    if (params.keyword) {
      filter.$or = [
        { candidateName: { $regex: params.keyword, $options: 'i' } },
        { candidatePhone: { $regex: params.keyword, $options: 'i' } },
        { position: { $regex: params.keyword, $options: 'i' } },
      ];
    }

    return filter;
  }

  async exportInterviewDetails(params: ExportParams, operatorId: string, res: Response) {
    const filter = await this.buildFilter(params);

    const interviews = await this.interviewModel
      .find(filter)
      .populate('interviewerId', 'name email department')
      .populate('scheduleId')
      .sort({ interviewDate: -1, startTime: 1 })
      .lean()
      .exec();

    const interviewIds = interviews.map(i => i._id);
    const assessments = await this.assessmentModel
      .find({ interviewId: { $in: interviewIds } })
      .lean()
      .exec();

    const assessmentMap = new Map();
    for (const a of assessments) {
      assessmentMap.set(a.interviewId.toString(), a);
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = '面试排课系统';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('面试明细报表');

    worksheet.columns = [
      { header: '序号', key: 'index', width: 8 },
      { header: '面试日期', key: 'interviewDate', width: 12 },
      { header: '时间段', key: 'timeSlot', width: 15 },
      { header: '候选人姓名', key: 'candidateName', width: 12 },
      { header: '联系电话', key: 'candidatePhone', width: 13 },
      { header: '应聘职位', key: 'position', width: 15 },
      { header: '技术栈', key: 'skills', width: 20 },
      { header: '面试官', key: 'interviewerName', width: 10 },
      { header: '面试状态', key: 'status', width: 10 },
      { header: '录用结果', key: 'hireResult', width: 10 },
      { header: '签到时间', key: 'checkInTime', width: 20 },
      { header: '面试开始', key: 'startInterviewTime', width: 20 },
      { header: '面试结束', key: 'endInterviewTime', width: 20 },
      { header: '综合得分', key: 'totalScore', width: 10 },
      { header: '技术能力', key: 'technicalScore', width: 10 },
      { header: '沟通能力', key: 'communicationScore', width: 10 },
      { header: '问题解决', key: 'problemSolvingScore', width: 10 },
      { header: '综合评价', key: 'overallComment', width: 30 },
      { header: '优势', key: 'strengths', width: 25 },
      { header: '待改进', key: 'weaknesses', width: 25 },
      { header: '建议等级', key: 'suggestedLevel', width: 10 },
      { header: '建议薪资', key: 'suggestedSalary', width: 12 },
      { header: '面试地点', key: 'location', width: 15 },
      { header: '备注', key: 'remark', width: 20 },
    ];

    const statusMap: Record<string, string> = {
      pending: '待处理',
      scheduled: '已预约',
      confirmed: '已确认',
      checked_in: '已签到',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消',
      no_show: '未到场',
    };

    const resultMap: Record<string, string> = {
      pending: '待评定',
      pass: '通过',
      fail: '不通过',
      hold: '待定',
    };

    interviews.forEach((interview: any, index: number) => {
      const assessment = assessmentMap.get(interview._id.toString()) || {};

      const rowData: any = {
        index: index + 1,
        interviewDate: this.formatDate(interview.interviewDate),
        timeSlot: `${interview.startTime}-${interview.endTime}`,
        candidateName: interview.candidateName,
        candidatePhone: interview.candidatePhone,
        position: interview.position || '',
        skills: interview.skills?.join(', ') || '',
        interviewerName: interview.interviewerId?.name || '',
        status: statusMap[interview.status] || interview.status,
        hireResult: resultMap[interview.hireResult] || interview.hireResult,
        checkInTime: this.formatDateTime(interview.checkInTime),
        startInterviewTime: this.formatDateTime(interview.startInterviewTime),
        endInterviewTime: this.formatDateTime(interview.endInterviewTime),
        totalScore: assessment.totalScore || '',
        technicalScore: assessment.technicalScore || '',
        communicationScore: assessment.communicationScore || '',
        problemSolvingScore: assessment.problemSolvingScore || '',
        overallComment: assessment.overallComment || '',
        strengths: assessment.strengths || '',
        weaknesses: assessment.weaknesses || '',
        suggestedLevel: assessment.suggestedLevel || '',
        suggestedSalary: assessment.suggestedSalary || '',
        location: interview.location || '',
        remark: interview.remark || '',
      };

      const row = worksheet.addRow(rowData);

      if (interview.hireResult === 'pass') {
        row.getCell('hireResult').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE8F5E9' },
        };
        row.getCell('hireResult').font = { color: { argb: 'FF2E7D32' } };
      } else if (interview.hireResult === 'fail') {
        row.getCell('hireResult').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFEBEE' },
        };
        row.getCell('hireResult').font = { color: { argb: 'FFC62828' } };
      }
    });

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 12 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1976D2' },
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: worksheet.columns.length },
    };

    const summaryWorksheet = workbook.addWorksheet('数据统计');

    const totalCount = interviews.length;
    const completedCount = interviews.filter(i => i.status === 'completed').length;
    const passCount = interviews.filter(i => i.hireResult === 'pass').length;
    const failCount = interviews.filter(i => i.hireResult === 'fail').length;
    const holdCount = interviews.filter(i => i.hireResult === 'hold').length;
    const passRate = completedCount > 0 ? ((passCount / completedCount) * 100).toFixed(2) : '0';

    const avgScore = assessments.length > 0
      ? (assessments.reduce((sum, a) => sum + (a.totalScore || 0), 0) / assessments.length).toFixed(2)
      : '0';

    summaryWorksheet.columns = [
      { header: '统计项', key: 'item', width: 25 },
      { header: '数值', key: 'value', width: 15 },
      { header: '说明', key: 'remark', width: 30 },
    ];

    const summaryData = [
      { item: '面试总数量', value: totalCount, remark: '筛选条件内的所有面试' },
      { item: '已完成面试', value: completedCount, remark: '状态为已完成的面试' },
      { item: '通过人数', value: passCount, remark: '录用结果为通过' },
      { item: '不通过人数', value: failCount, remark: '录用结果为不通过' },
      { item: '待定人数', value: holdCount, remark: '录用结果为待定' },
      { item: '通过率', value: `${passRate}%`, remark: '通过人数 / 已完成面试数' },
      { item: '参与测评数', value: assessments.length, remark: '有测评记录的面试数' },
      { item: '平均综合分', value: avgScore, remark: '所有测评的平均分' },
    ];

    summaryData.forEach(item => {
      summaryWorksheet.addRow(item);
    });

    const summaryHeader = summaryWorksheet.getRow(1);
    summaryHeader.font = { bold: true, size: 12 };
    summaryHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF388E3C' },
    };
    summaryHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    await this.operationLogsService.create({
      userId: operatorId,
      operationType: OperationType.EXPORT,
      module: 'exports',
      details: {
        type: 'interview-details',
        filter: params,
        recordCount: interviews.length,
      },
      ip: 'localhost',
    });

    const filename = `面试明细报表_${new Date().toISOString().split('T')[0]}.xlsx`;
    const encodedFilename = encodeURIComponent(filename).replace(/['()]/g, escape);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=utf-8',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
    );
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    await workbook.xlsx.write(res);
    res.end();
  }

  async exportAssessmentStats(params: ExportParams, operatorId: string, res: Response) {
    const filter = await this.buildFilter(params);

    const interviews = await this.interviewModel
      .find({ ...filter, status: InterviewStatus.COMPLETED })
      .populate('interviewerId', 'name email')
      .lean()
      .exec();

    const interviewIds = interviews.map(i => i._id);
    const assessments = await this.assessmentModel
      .find({ interviewId: { $in: interviewIds } })
      .populate('interviewerId', 'name')
      .populate('usedQuestions', 'category difficulty')
      .lean()
      .exec();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('面试质量分析');

    worksheet.columns = [
      { header: '面试官', key: 'interviewer', width: 12 },
      { header: '面试总数', key: 'total', width: 10 },
      { header: '通过数', key: 'pass', width: 10 },
      { header: '不通过数', key: 'fail', width: 10 },
      { header: '待定数', key: 'hold', width: 10 },
      { header: '通过率', key: 'passRate', width: 12 },
      { header: '平均分', key: 'avgScore', width: 10 },
      { header: '最高分', key: 'maxScore', width: 10 },
      { header: '最低分', key: 'minScore', width: 10 },
      { header: '技术平均分', key: 'avgTech', width: 12 },
      { header: '沟通平均分', key: 'avgComm', width: 12 },
      { header: '问题解决平均分', key: 'avgProblem', width: 14 },
    ];

    const interviewerStats = new Map<string, any>();

    for (const assessment of assessments) {
      const interviewerId = assessment.interviewerId._id.toString();
      const interview = interviews.find(i => i._id.toString() === assessment.interviewId.toString());
      
      if (!interviewerStats.has(interviewerId)) {
        interviewerStats.set(interviewerId, {
          name: assessment.interviewerId.name,
          total: 0,
          pass: 0,
          fail: 0,
          hold: 0,
          scores: [],
          techScores: [],
          commScores: [],
          problemScores: [],
        });
      }

      const stats = interviewerStats.get(interviewerId);
      stats.total++;
      
      if (interview) {
        if (interview.hireResult === HireResult.PASS) stats.pass++;
        else if (interview.hireResult === HireResult.FAIL) stats.fail++;
        else if (interview.hireResult === HireResult.HOLD) stats.hold++;
      }

      if (assessment.totalScore) stats.scores.push(assessment.totalScore);
      if (assessment.technicalScore) stats.techScores.push(assessment.technicalScore);
      if (assessment.communicationScore) stats.commScores.push(assessment.communicationScore);
      if (assessment.problemSolvingScore) stats.problemScores.push(assessment.problemSolvingScore);
    }

    for (const stats of interviewerStats.values()) {
      const passRate = stats.total > 0 ? ((stats.pass / stats.total) * 100).toFixed(2) : '0';
      const avg = stats.scores.length > 0 ? this.avg(stats.scores) : '';
      const max = stats.scores.length > 0 ? Math.max(...stats.scores) : '';
      const min = stats.scores.length > 0 ? Math.min(...stats.scores) : '';
      const avgTech = stats.techScores.length > 0 ? this.avg(stats.techScores) : '';
      const avgComm = stats.commScores.length > 0 ? this.avg(stats.commScores) : '';
      const avgProblem = stats.problemScores.length > 0 ? this.avg(stats.problemScores) : '';

      worksheet.addRow({
        interviewer: stats.name,
        total: stats.total,
        pass: stats.pass,
        fail: stats.fail,
        hold: stats.hold,
        passRate: `${passRate}%`,
        avgScore: avg,
        maxScore: max,
        minScore: min,
        avgTech: avgTech,
        avgComm: avgComm,
        avgProblem: avgProblem,
      });
    }

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 12 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF7B1FA2' },
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    await this.operationLogsService.create({
      userId: operatorId,
      operationType: OperationType.EXPORT,
      module: 'exports',
      details: {
        type: 'assessment-stats',
        filter: params,
      },
      ip: 'localhost',
    });

    const filename = `面试质量分析_${new Date().toISOString().split('T')[0]}.xlsx`;
    const encodedFilename = encodeURIComponent(filename).replace(/['()]/g, escape);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=utf-8',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
    );
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    await workbook.xlsx.write(res);
    res.end();
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN');
  }

  private formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('zh-CN');
  }

  private avg(arr: number[]): string {
    if (arr.length === 0) return '';
    return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
  }
}
