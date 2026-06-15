import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExportRecord } from './entities/export-record.entity.js';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(ExportRecord)
    private exportRepository: Repository<ExportRecord>,
  ) {}

  async createExport(
    exporterId: number,
    queryCriteria: Record<string, unknown>,
    fileName: string,
  ) {
    const record = this.exportRepository.create({
      exporter: { id: exporterId } as any,
      queryCriteria,
      fileName,
    });
    return this.exportRepository.save(record);
  }

  async findAll(query: { page?: number; pageSize?: number }) {
    const { page = 1, pageSize = 10 } = query;
    const [items, total] = await this.exportRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }

  async findOne(id: number) {
    return this.exportRepository.findOne({ where: { id } });
  }

  generateCsv(
    data: Record<string, unknown>[],
    queryCriteria: Record<string, unknown>,
    exporterName: string,
  ): string {
    if (data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const criteriaLine = `# 查询条件: ${JSON.stringify(queryCriteria)}`;
    const headerLine = headers.join(',');
    const rows = data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str = val === null || val === undefined ? '' : String(val);
          return str.includes(',') ? `"${str}"` : str;
        })
        .join(','),
    );

    const footerLine = `# 导出人: ${exporterName}, 导出时间: ${new Date().toISOString()}`;
    return [criteriaLine, headerLine, ...rows, footerLine].join('\n');
  }
}
