import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import * as Minio from 'minio';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Quote } from '../entities/quote.entity';
import { Demand } from '../entities/demand.entity';
import { Contract } from '../entities/contract.entity';
import { Between, Like } from 'typeorm';
import { ExportData } from '../queues/export.queue.service';

dotenv.config();

const logger = new Logger('ExportWorker');

let storageClient: Minio.Client;
let dataSource: DataSource;

function initStorage() {
  storageClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  });
}

async function initDatabase() {
  if (!AppDataSource.isInitialized) {
    dataSource = await AppDataSource.initialize();
    logger.log('Database initialized for export worker');
  } else {
    dataSource = AppDataSource;
  }
}

async function uploadBuffer(buffer: Buffer, objectName: string, contentType: string): Promise<string> {
  const bucketName = process.env.MINIO_BUCKET || 'travel-quote';
  try {
    await storageClient.putObject(bucketName, objectName, buffer, buffer.length, {
      'Content-Type': contentType,
    });
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    return `${protocol}://${endpoint}:${port}/${bucketName}/${objectName}`;
  } catch (error) {
    logger.warn('Storage upload failed, returning local path');
    return `/uploads/${objectName}`;
  }
}

const connectionConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
};

const worker = new Worker(
  'export-queue',
  async (job: Job<ExportData>) => {
    logger.log(`Processing export job ${job.id}: ${job.data.type}`);

    try {
      await initDatabase();
      job.updateProgress(10);

      let fileUrl = '';
      const fileName = `${job.data.type}_${Date.now()}.${job.data.format}`;
      const objectName = `exports/${fileName}`;

      switch (job.data.type) {
        case 'profit_report':
          fileUrl = await generateProfitReport(job.data, objectName);
          break;
        case 'demand_list':
          fileUrl = await generateDemandList(job.data, objectName);
          break;
        case 'quote_list':
          fileUrl = await generateQuoteList(job.data, objectName);
          break;
        case 'contract_list':
          fileUrl = await generateContractList(job.data, objectName);
          break;
        default:
          throw new Error(`Unknown export type: ${job.data.type}`);
      }

      job.updateProgress(100);
      logger.log(`Export job ${job.id} completed: ${fileUrl}`);

      return {
        success: true,
        fileUrl,
        fileName,
        type: job.data.type,
      };
    } catch (error) {
      logger.error(`Export job ${job.id} failed:`, error);
      throw error;
    }
  },
  {
    connection: connectionConfig,
    concurrency: 2,
  },
);

async function generateProfitReport(data: ExportData, objectName: string): Promise<string> {
  const quoteRepo = dataSource.getRepository(Quote);
  const where: any = { status: 'approved' as any };

  if (data.filters) {
    if (data.filters.startDate && data.filters.endDate) {
      where.createdAt = Between(new Date(data.filters.startDate), new Date(data.filters.endDate));
    }
    if (data.filters.createdById) {
      where.createdById = data.filters.createdById;
    }
  }

  const quotes = await quoteRepo.find({
    where,
    relations: ['demand', 'createdBy'],
    order: { createdAt: 'DESC' },
  });

  const headers = ['报价ID', '客户姓名', '创建人', '营收(元)', '成本(元)', '利润(元)', '毛利率(%)', '创建时间'];
  const rows = quotes.map((q) => [
    q.id.slice(0, 8),
    q.demand?.customerName || '-',
    q.createdBy?.name || '-',
    Number(q.totalPrice).toFixed(2),
    Number(q.totalCost).toFixed(2),
    (Number(q.totalPrice) - Number(q.totalCost)).toFixed(2),
    Number(q.profitMargin).toFixed(2),
    new Date(q.createdAt).toLocaleString('zh-CN'),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const buffer = Buffer.from('\uFEFF' + csvContent, 'utf-8');
  return uploadBuffer(buffer, objectName, 'text/csv; charset=utf-8');
}

async function generateDemandList(data: ExportData, objectName: string): Promise<string> {
  const demandRepo = dataSource.getRepository(Demand);
  const where: any = {};

  if (data.filters) {
    if (data.filters.status) {
      where.status = data.filters.status;
    }
    if (data.filters.assigneeId) {
      where.assigneeId = data.filters.assigneeId;
    }
    if (data.filters.keyword) {
      where.customerName = Like(`%${data.filters.keyword}%`);
    }
    if (data.filters.startDate && data.filters.endDate) {
      where.createdAt = Between(new Date(data.filters.startDate), new Date(data.filters.endDate));
    }
  }

  const demands = await demandRepo.find({
    where,
    relations: ['assignee'],
    order: { createdAt: 'DESC' },
    take: 1000,
  });

  const headers = ['需求ID', '客户姓名', '联系电话', '出发日期', '返程日期', '天数', '人数', '成人', '儿童', '状态', '负责人', '创建时间'];
  const statusMap: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    quoted: '已报价',
    confirmed: '已确认',
    cancelled: '已取消',
  };

  const rows = demands.map((d) => [
    d.id.slice(0, 8),
    d.customerName,
    d.customerPhone,
    d.travelStart,
    d.travelEnd,
    d.days,
    d.peopleCount,
    d.adultCount,
    d.childCount,
    statusMap[d.status] || d.status,
    d.assignee?.name || '-',
    new Date(d.createdAt).toLocaleString('zh-CN'),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const buffer = Buffer.from('\uFEFF' + csvContent, 'utf-8');
  return uploadBuffer(buffer, objectName, 'text/csv; charset=utf-8');
}

async function generateQuoteList(data: ExportData, objectName: string): Promise<string> {
  const quoteRepo = dataSource.getRepository(Quote);
  const where: any = {};

  if (data.filters) {
    if (data.filters.status) {
      where.status = data.filters.status;
    }
    if (data.filters.demandId) {
      where.demandId = data.filters.demandId;
    }
    if (data.filters.createdById) {
      where.createdById = data.filters.createdById;
    }
    if (data.filters.startDate && data.filters.endDate) {
      where.createdAt = Between(new Date(data.filters.startDate), new Date(data.filters.endDate));
    }
  }

  const quotes = await quoteRepo.find({
    where,
    relations: ['demand', 'createdBy', 'items'],
    order: { createdAt: 'DESC' },
    take: 1000,
  });

  const headers = ['报价ID', '版本', '客户姓名', '报价项数', '总金额(元)', '总成本(元)', '利润(元)', '毛利率(%)', '需主管审批', '状态', '创建人', '创建时间'];
  const statusMap: Record<string, string> = {
    draft: '草稿',
    pending_approval: '待审批',
    approved: '已通过',
    rejected: '已拒绝',
    sent: '已发送',
  };

  const rows = quotes.map((q) => [
    q.id.slice(0, 8),
    `v${q.version}`,
    q.demand?.customerName || '-',
    q.items?.length || 0,
    Number(q.totalPrice).toFixed(2),
    Number(q.totalCost).toFixed(2),
    (Number(q.totalPrice) - Number(q.totalCost)).toFixed(2),
    Number(q.profitMargin).toFixed(2),
    q.requiresManagerApproval ? '是' : '否',
    statusMap[q.status] || q.status,
    q.createdBy?.name || '-',
    new Date(q.createdAt).toLocaleString('zh-CN'),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const buffer = Buffer.from('\uFEFF' + csvContent, 'utf-8');
  return uploadBuffer(buffer, objectName, 'text/csv; charset=utf-8');
}

async function generateContractList(data: ExportData, objectName: string): Promise<string> {
  const contractRepo = dataSource.getRepository(Contract);
  const where: any = {};

  if (data.filters) {
    if (data.filters.status) {
      where.status = data.filters.status;
    }
    if (data.filters.startDate && data.filters.endDate) {
      where.createdAt = Between(new Date(data.filters.startDate), new Date(data.filters.endDate));
    }
  }

  const contracts = await contractRepo.find({
    where,
    relations: ['quote', 'quote.demand'],
    order: { createdAt: 'DESC' },
    take: 1000,
  });

  const headers = ['合同ID', '关联报价ID', '客户姓名', '合同金额(元)', '状态', '签署文件', '创建时间'];
  const statusMap: Record<string, string> = {
    draft: '草稿',
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝',
    signed: '已签署',
  };

  const rows = contracts.map((c) => [
    c.id.slice(0, 8),
    c.quoteId?.slice(0, 8) || '-',
    c.quote?.demand?.customerName || '-',
    Number(c.quote?.totalPrice || 0).toFixed(2),
    statusMap[c.status] || c.status,
    c.signedFileUrl || '-',
    new Date(c.createdAt).toLocaleString('zh-CN'),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const buffer = Buffer.from('\uFEFF' + csvContent, 'utf-8');
  return uploadBuffer(buffer, objectName, 'text/csv; charset=utf-8');
}

worker.on('completed', (job) => {
  logger.debug(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed with error: ${err.message}`);
});

worker.on('error', (err) => {
  logger.error('Worker error:', err);
});

process.on('SIGINT', async () => {
  logger.log('Stopping export worker...');
  if (dataSource && dataSource.isInitialized) {
    await dataSource.destroy();
  }
  await worker.close();
  process.exit(0);
});

initStorage();
logger.log('Export worker started, waiting for jobs...');
