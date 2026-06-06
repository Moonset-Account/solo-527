import { Injectable, Inject, Logger } from '@nestjs/common';
import { Queue, Job } from 'bullmq';
import { EXPORT_QUEUE } from './queue.module';
import { StorageService } from '../storage/storage.service';

export interface ExportData {
  type: 'profit_report' | 'demand_list' | 'quote_list' | 'contract_list';
  userId: string;
  filters: Record<string, any>;
  format: 'xlsx' | 'csv' | 'pdf';
  email?: string;
}

@Injectable()
export class ExportQueueService {
  private readonly logger = new Logger(ExportQueueService.name);

  constructor(
    @Inject(EXPORT_QUEUE) private exportQueue: Queue,
    private storageService: StorageService,
  ) {}

  async addExportJob(data: ExportData): Promise<Job> {
    const job = await this.exportQueue.add('generate-export', data, {
      delay: 0,
      priority: 5,
    });
    this.logger.log(`Export job added: ${data.type} for user ${data.userId}, job id: ${job.id}`);
    return job;
  }

  async getJobStatus(jobId: string) {
    const job = await this.exportQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress;

    return {
      id: job.id,
      type: job.data.type,
      state,
      progress,
      result: job.returnvalue,
      failedReason: job.failedReason,
      createdAt: job.timestamp,
      processedAt: job.processedOn,
      finishedAt: job.finishedOn,
    };
  }

  async getQueueStats() {
    const counts = await this.exportQueue.getJobCounts('active', 'waiting', 'completed', 'failed');
    return {
      active: counts.active || 0,
      waiting: counts.waiting || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
    };
  }

  async processExportQueue() {
    const { Worker } = require('bullmq');

    const worker = new Worker(EXPORT_QUEUE, async (job: Job<ExportData>) => {
      this.logger.log(`Processing export job ${job.id}: ${job.data.type}`);

      try {
        job.updateProgress(10);

        let fileUrl = '';
        const fileName = `${job.data.type}_${Date.now()}.${job.data.format}`;

        switch (job.data.type) {
          case 'profit_report':
            fileUrl = await this.generateProfitReport(job.data, fileName);
            break;
          case 'demand_list':
            fileUrl = await this.generateDemandList(job.data, fileName);
            break;
          case 'quote_list':
            fileUrl = await this.generateQuoteList(job.data, fileName);
            break;
          case 'contract_list':
            fileUrl = await this.generateContractList(job.data, fileName);
            break;
          default:
            throw new Error(`Unknown export type: ${job.data.type}`);
        }

        job.updateProgress(100);
        this.logger.log(`Export job ${job.id} completed: ${fileUrl}`);

        return {
          success: true,
          fileUrl,
          fileName,
          type: job.data.type,
        };
      } catch (error) {
        this.logger.error(`Export job ${job.id} failed:`, error);
        throw error;
      }
    }, {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
      },
      concurrency: 2,
    });

    worker.on('completed', (job) => {
      this.logger.debug(`Export job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
      this.logger.error(`Export job ${job?.id} failed with error:`, err);
    });

    return worker;
  }

  private async generateProfitReport(data: ExportData, fileName: string): Promise<string> {
    const mockCsv = '月份,营收,成本,利润,毛利率\n2024-01,100000,70000,30000,30%\n2024-02,120000,80000,40000,33%';
    const buffer = Buffer.from(mockCsv, 'utf-8');
    return this.storageService.uploadBuffer(buffer, `exports/${fileName}`, 'text/csv');
  }

  private async generateDemandList(data: ExportData, fileName: string): Promise<string> {
    const mockCsv = '客户姓名,电话,出行日期,天数,人数,状态\n张三,13800000001,2024-01-15,5,3,已报价';
    const buffer = Buffer.from(mockCsv, 'utf-8');
    return this.storageService.uploadBuffer(buffer, `exports/${fileName}`, 'text/csv');
  }

  private async generateQuoteList(data: ExportData, fileName: string): Promise<string> {
    const mockCsv = '报价单号,客户,金额,毛利率,状态\nQ001,张三,15000,25%,已通过';
    const buffer = Buffer.from(mockCsv, 'utf-8');
    return this.storageService.uploadBuffer(buffer, `exports/${fileName}`, 'text/csv');
  }

  private async generateContractList(data: ExportData, fileName: string): Promise<string> {
    const mockCsv = '合同编号,客户,金额,状态,创建时间\nC001,张三,15000,已签署,2024-01-10';
    const buffer = Buffer.from(mockCsv, 'utf-8');
    return this.storageService.uploadBuffer(buffer, `exports/${fileName}`, 'text/csv');
  }
}
