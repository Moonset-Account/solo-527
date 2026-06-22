import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InventoryLog } from '../../schemas/inventory-log.schema.js';
import { ScrapRecord } from '../../schemas/scrap-record.schema.js';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(InventoryLog.name) private inventoryLogModel: Model<InventoryLog>,
    @InjectModel(ScrapRecord.name) private scrapRecordModel: Model<ScrapRecord>,
  ) {}

  async findAllLogs(isSandbox = false): Promise<InventoryLog[]> {
    return this.inventoryLogModel.find({ isSandbox }).exec();
  }

  async findOneLog(id: string): Promise<InventoryLog | null> {
    return this.inventoryLogModel.findById(id).exec();
  }

  async createLog(data: Partial<InventoryLog>): Promise<InventoryLog> {
    return this.inventoryLogModel.create(data);
  }

  async findAllScraps(isSandbox = false): Promise<ScrapRecord[]> {
    return this.scrapRecordModel.find({ isSandbox }).exec();
  }

  async findOneScrap(id: string): Promise<ScrapRecord | null> {
    return this.scrapRecordModel.findById(id).exec();
  }

  async createScrap(data: Partial<ScrapRecord>): Promise<ScrapRecord> {
    return this.scrapRecordModel.create(data);
  }
}
