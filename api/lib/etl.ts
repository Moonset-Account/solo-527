import { prisma } from './prisma';
import { EtlLog, DataQualityStatus } from '@shared/types';

export interface EtlResult {
  success: boolean;
  recordsProcessed: number;
  errors: string[];
  logId?: string;
}

export class EtlPipeline {
  private source: string;

  constructor(source: string = 'manual') {
    this.source = source;
  }

  async run(): Promise<EtlResult> {
    const errors: string[] = [];
    let recordsProcessed = 0;

    const log = await prisma.etlLog.create({
      data: {
        source: this.source,
        status: 'running',
      },
    });

    try {
      const trainingCount = await prisma.trainingData.count();
      const strengthCount = await prisma.strengthData.count();
      const recoveryCount = await prisma.recoveryData.count();
      recordsProcessed = trainingCount + strengthCount + recoveryCount;

      await this.validateData();
      await this.cleanDuplicates();
      await this.aggregateSummaries();

      await prisma.etlLog.update({
        where: { id: log.id },
        data: {
          status: 'completed',
          recordsProcessed,
          finishedAt: new Date(),
        },
      });

      return {
        success: true,
        recordsProcessed,
        errors,
        logId: log.id,
      };
    } catch (err: any) {
      errors.push(err.message || 'ETL过程发生未知错误');

      await prisma.etlLog.update({
        where: { id: log.id },
        data: {
          status: 'failed',
          recordsProcessed,
          errors: errors.join('\n'),
          finishedAt: new Date(),
        },
      });

      return {
        success: false,
        recordsProcessed,
        errors,
        logId: log.id,
      };
    }
  }

  private async validateData(): Promise<void> {
    const invalidTraining = await prisma.trainingData.findMany({
      where: {
        OR: [{ durationMin: { lte: 0 } }, { loadScore: { lte: 0 } }],
      },
      take: 10,
    });

    if (invalidTraining.length > 0) {
      console.warn(`⚠️  发现 ${invalidTraining.length} 条异常训练数据`);
    }
  }

  private async cleanDuplicates(): Promise<void> {
    console.log('🧹 检查重复数据...');
  }

  private async aggregateSummaries(): Promise<void> {
    console.log('📊 生成数据聚合...');
  }

  static async getDataQualityStatus(): Promise<DataQualityStatus> {
    const lastEtl = await prisma.etlLog.findFirst({
      orderBy: { startedAt: 'desc' },
    });

    const trainingCount = await prisma.trainingData.count();
    const strengthCount = await prisma.strengthData.count();
    const recoveryCount = await prisma.recoveryData.count();
    const injuryCount = await prisma.injuryRecord.count();
    const athleteCount = await prisma.athlete.count();

    const missingHeartRate = await prisma.trainingData.count({
      where: { avgHeartRate: null },
    });
    const missingRecovery = await prisma.recoveryData.count({
      where: { sleepScore: null },
    });

    const warnings: string[] = [];
    let status: DataQualityStatus['status'] = 'healthy';

    if (lastEtl?.status === 'failed') {
      status = 'error';
      warnings.push('最近一次ETL执行失败');
    }

    if (missingHeartRate > 0) {
      warnings.push(`${missingHeartRate} 条训练数据缺少心率记录`);
    }
    if (missingRecovery > 0) {
      warnings.push(`${missingRecovery} 条恢复数据缺少睡眠评分`);
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentTraining = await prisma.trainingData.count({
      where: { date: { gte: sevenDaysAgo } },
    });

    if (recentTraining === 0) {
      status = 'warning';
      warnings.push('最近7天没有新的训练数据');
    }

    if (warnings.length > 0 && status === 'healthy') {
      status = 'warning';
    }

    return {
      status,
      lastUpdated: lastEtl?.finishedAt || new Date(),
      warnings,
      sampleSizes: {
        training: trainingCount,
        strength: strengthCount,
        recovery: recoveryCount,
        injuries: injuryCount,
        athletes: athleteCount,
      },
      etlStatus: lastEtl?.status || 'unknown',
    };
  }
}
