import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcessingRecord, RecordEntityType } from './entities/processing-record.entity';
import { CreateRecordDto } from './dto/create-record.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class ProcessingRecordsService {
  constructor(
    @InjectRepository(ProcessingRecord)
    private recordRepository: Repository<ProcessingRecord>,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(createDto: CreateRecordDto, user: any) {
    const record = this.recordRepository.create(createDto);
    const saved = await this.recordRepository.save(record);

    await this.auditLogsService.createLog({
      operator: user.id,
      operatorName: user.displayName || user.username,
      action: 'CREATE_RECORD',
      entityType: 'PROCESSING_RECORD',
      entityId: saved.id,
      details: { entityType: createDto.entityType, entityId: createDto.entityId, action: createDto.action },
    });

    return saved;
  }

  async findByEntity(entityType: RecordEntityType, entityId: string) {
    return this.recordRepository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }
}
