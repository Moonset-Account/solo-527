import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChangeWindow } from './entities/change-window.entity';
import { CreateChangeWindowDto } from './dto/create-change-window.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class ChangeWindowsService {
  constructor(
    @InjectRepository(ChangeWindow)
    private changeWindowRepository: Repository<ChangeWindow>,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(createDto: CreateChangeWindowDto, user: any) {
    const changeWindow = this.changeWindowRepository.create(createDto);
    const saved = await this.changeWindowRepository.save(changeWindow);

    await this.auditLogsService.createLog({
      operator: user.id,
      operatorName: user.displayName || user.username,
      action: 'CREATE',
      entityType: 'CHANGE_WINDOW',
      entityId: saved.id,
      details: { ...createDto },
    });

    return saved;
  }

  async findAll(entityType?: string, entityId?: string) {
    const where: any = {};
    if (entityType) {
      where.entityType = entityType;
    }
    if (entityId) {
      where.entityId = entityId;
    }
    return this.changeWindowRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const changeWindow = await this.changeWindowRepository.findOne({ where: { id } });
    if (!changeWindow) {
      throw new NotFoundException(`Change window ${id} not found`);
    }
    return changeWindow;
  }

  async update(id: string, updateDto: Partial<CreateChangeWindowDto>, user: any) {
    const changeWindow = await this.findOne(id);
    Object.assign(changeWindow, updateDto);
    const saved = await this.changeWindowRepository.save(changeWindow);

    await this.auditLogsService.createLog({
      operator: user.id,
      operatorName: user.displayName || user.username,
      action: 'UPDATE',
      entityType: 'CHANGE_WINDOW',
      entityId: id,
      details: { ...updateDto },
    });

    return saved;
  }
}
