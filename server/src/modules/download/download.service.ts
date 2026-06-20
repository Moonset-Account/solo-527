import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DownloadDetail } from '../../schemas/download-detail.schema';
import { QueryDownloadDto } from './download.dto';
import * as XLSX from 'xlsx';

@Injectable()
export class DownloadService {
  constructor(@InjectModel(DownloadDetail.name) private downloadDetailModel: Model<DownloadDetail>) {}

  async findAll(query: QueryDownloadDto): Promise<{ data: DownloadDetail[]; total: number }> {
    const filter: any = {};
    if (query.environment) filter.environment = query.environment;

    const [data, total] = await Promise.all([
      this.downloadDetailModel.find(filter).sort({ createdAt: -1 }).exec(),
      this.downloadDetailModel.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }

  async exportAsXlsx(query: QueryDownloadDto): Promise<Buffer> {
    const filter: any = {};
    if (query.environment) filter.environment = query.environment;

    const records = await this.downloadDetailModel.find(filter).sort({ createdAt: -1 }).exec();

    const rows = records.map((r) => ({
      transactionSecurity: r.transactionSecurity,
      repairTimeout: r.repairTimeout,
      lastOperator: r.lastOperation?.operator || '',
      lastOperatedAt: r.lastOperation?.operatedAt ? new Date(r.lastOperation.operatedAt).toISOString() : '',
      environment: r.environment,
      createdAt: (r as any).createdAt ? new Date((r as any).createdAt).toISOString() : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DownloadDetails');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }
}
