import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createReadStream, existsSync } from 'fs';
import { ExportQueue, ExportStatus } from '@/database/entities';
import { CreateExportDto, ExportFilterDto } from './dto/export.dto';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(ExportQueue)
    private exportQueueRepository: Repository<ExportQueue>,
    @InjectQueue('export') private exportQueue: Queue,
  ) {}

  async create(createExportDto: CreateExportDto, userId?: string): Promise<ExportQueue> {
    const exportQueue = this.exportQueueRepository.create({
      ...createExportDto,
      status: 'pending',
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await this.exportQueueRepository.save(exportQueue);
    await this.exportQueue.add({ exportId: saved.id });

    return this.findOne(saved.id);
  }

  async findAll(filters: ExportFilterDto): Promise<{ data: ExportQueue[]; total: number }> {
    const queryBuilder = this.exportQueueRepository.createQueryBuilder('export');

    if (filters.status && filters.status.length > 0) {
      queryBuilder.andWhere('export.status IN (:...status)', { status: filters.status });
    }

    if (filters.type && filters.type.length > 0) {
      queryBuilder.andWhere('export.type IN (:...type)', { type: filters.type });
    }

    queryBuilder.orderBy('export.createdAt', 'DESC');
    queryBuilder.skip((filters.page - 1) * filters.limit);
    queryBuilder.take(filters.limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<ExportQueue> {
    const exportQueue = await this.exportQueueRepository.findOne({ where: { id } });
    if (!exportQueue) throw new NotFoundException('Export not found');
    return exportQueue;
  }

  async download(id: string): Promise<{ stream: any; fileName: string; mimeType: string }> {
    const exportQueue = await this.findOne(id);

    if (exportQueue.status !== 'completed') {
      throw new Error('Export is not ready yet');
    }

    if (!exportQueue.storagePath || !existsSync(exportQueue.storagePath)) {
      throw new NotFoundException('Export file not found');
    }

    const mimeTypes = {
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
      pdf: 'application/pdf',
    };

    return {
      stream: createReadStream(exportQueue.storagePath),
      fileName: exportQueue.fileName || `export_${id}.${exportQueue.format}`,
      mimeType: mimeTypes[exportQueue.format] || 'application/octet-stream',
    };
  }

  async retry(id: string): Promise<ExportQueue> {
    const exportQueue = await this.findOne(id);

    if (exportQueue.status !== 'failed') {
      throw new Error('Only failed exports can be retried');
    }

    exportQueue.status = 'pending' as ExportStatus;
    exportQueue.retryCount = (exportQueue.retryCount || 0) + 1;
    exportQueue.errorMessage = null;
    exportQueue.errorDetails = null;
    exportQueue.startedAt = null;
    exportQueue.completedAt = null;

    const saved = await this.exportQueueRepository.save(exportQueue);
    await this.exportQueue.add({ exportId: saved.id });

    return this.findOne(saved.id);
  }
}
