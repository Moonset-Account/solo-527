import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InspectionTemplate } from './entities/inspection-template.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class InspectionTemplatesService {
  constructor(
    @InjectRepository(InspectionTemplate)
    private templateRepository: Repository<InspectionTemplate>,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(createDto: CreateTemplateDto, user: any) {
    const template = this.templateRepository.create({
      ...createDto,
      createdBy: user.id,
    });
    const saved = await this.templateRepository.save(template);

    await this.auditLogsService.createLog({
      operator: user.id,
      operatorName: user.displayName || user.username,
      action: 'CREATE',
      entityType: 'INSPECTION_TEMPLATE',
      entityId: saved.id,
      details: { name: saved.name, frequency: saved.frequency },
    });

    return saved;
  }

  async findAll(pagination: PaginationDto) {
    const [items, total] = await this.templateRepository.findAndCount({
      order: { [pagination.sortBy]: pagination.sortOrder },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });
    return { items, total, page: pagination.page, limit: pagination.limit };
  }

  async findOne(id: string) {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Inspection template ${id} not found`);
    }
    return template;
  }

  async update(id: string, updateDto: UpdateTemplateDto, user: any) {
    const template = await this.findOne(id);
    Object.assign(template, updateDto);
    const saved = await this.templateRepository.save(template);

    await this.auditLogsService.createLog({
      operator: user.id,
      operatorName: user.displayName || user.username,
      action: 'UPDATE',
      entityType: 'INSPECTION_TEMPLATE',
      entityId: id,
      details: { ...updateDto },
    });

    return saved;
  }

  async remove(id: string, user: any) {
    const template = await this.findOne(id);

    await this.auditLogsService.createLog({
      operator: user.id,
      operatorName: user.displayName || user.username,
      action: 'DELETE',
      entityType: 'INSPECTION_TEMPLATE',
      entityId: id,
      details: { name: template.name },
    });

    await this.templateRepository.remove(template);
    return { deleted: true };
  }
}
