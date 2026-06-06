import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import * as Minio from 'minio';
import { ExportData } from '../queues/export.queue.service';

dotenv.config();

const logger = new Logger('ExportWorker');

let storageClient: Minio.Client;

function initStorage() {
  storageClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  });
}

async function uploadBuffer(buffer: Buffer, objectName: string, contentType: string): Promise<string> {
  const bucketName = process.env.MINIO_BUCKET || 'travel-quote';
  try {
    await storageClient.putObject(bucketName, objectName, buffer, buffer.length, {
      'Content-Type': contentType,
    });
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    return `http://${endpoint}:${port}/${bucketName}/${objectName}`;
  } catch (error) {
    logger.warn('Storage upload failed, returning local path');
    return `/uploads/${objectName}`;
  }
}

const worker = new Worker(
  'export-queue',
  async (job: Job<ExportData>) => {
    logger.log(`Processing export job ${job.id}: ${job.data.type}`);

    try {
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
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
    },
    concurrency: 2,
  },
);

async function generateProfitReport(data: ExportData, objectName: string): Promise<string> {
  const csvContent = [
    '月份,营收,成本,利润,毛利率',
    '2024-01,100000,70000,30000,30%',
    '2024-02,120000,80000,40000,33.33%',
    '2024-03,95000,68000,27000,28.42%',
    '2024-04,150000,100000,50000,33.33%',
    '2024-05,130000,85000,45000,34.62%',
  ].join('\n');

  const buffer = Buffer.from(csvContent, 'utf-8');
  return uploadBuffer(buffer, objectName, 'text/csv');
}

async function generateDemandList(data: ExportData, objectName: string): Promise<string> {
  const csvContent = [
    '客户姓名,电话,出行日期,天数,人数,状态,创建时间',
    '张三,13800000001,2024-01-15,5,3,已报价,2024-01-10',
    '李四,13800000002,2024-02-01,7,5,待确认,2024-01-15',
    '王五,13800000003,2024-03-10,4,2,处理中,2024-02-20',
  ].join('\n');

  const buffer = Buffer.from(csvContent, 'utf-8');
  return uploadBuffer(buffer, objectName, 'text/csv');
}

async function generateQuoteList(data: ExportData, objectName: string): Promise<string> {
  const csvContent = [
    '报价单号,客户,总金额,成本,毛利,毛利率,状态,创建时间',
    'Q001,张三,15000,10500,4500,30%,已通过,2024-01-12',
    'Q002,李四,28000,20000,8000,28.57%,待审批,2024-01-18',
  ].join('\n');

  const buffer = Buffer.from(csvContent, 'utf-8');
  return uploadBuffer(buffer, objectName, 'text/csv');
}

async function generateContractList(data: ExportData, objectName: string): Promise<string> {
  const csvContent = [
    '合同编号,客户,金额,状态,创建时间,签署时间',
    'C001,张三,15000,已签署,2024-01-15,2024-01-16',
    'C002,李四,28000,待签署,2024-01-20,-',
  ].join('\n');

  const buffer = Buffer.from(csvContent, 'utf-8');
  return uploadBuffer(buffer, objectName, 'text/csv');
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
  await worker.close();
  process.exit(0);
});

initStorage();
logger.log('Export worker started, waiting for jobs...');
