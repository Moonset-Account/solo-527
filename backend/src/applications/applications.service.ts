import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from './entities/application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(createDto: CreateApplicationDto, user: any) {
    const application = this.applicationRepository.create(createDto);
    const saved = await this.applicationRepository.save(application);

    await this.auditLogsService.createLog({
      operator: user.id,
      operatorName: user.displayName || user.username,
      action: 'CREATE',
      entityType: 'APPLICATION',
      entityId: saved.id,
      details: { ...createDto },
    });

    return saved;
  }

  async findAll(pagination: PaginationDto, status?: string, priority?: string) {
    const query = this.applicationRepository.createQueryBuilder('app');

    if (status) {
      query.andWhere('app.status = :status', { status });
    }
    if (priority) {
      query.andWhere('app.priority = :priority', { priority });
    }

    query.orderBy(`app.${pagination.sortBy}`, pagination.sortOrder);
    query.skip((pagination.page - 1) * pagination.limit);
    query.take(pagination.limit);

    const [items, total] = await query.getManyAndCount();
    return { items, total, page: pagination.page, limit: pagination.limit };
  }

  async findOne(id: string) {
    const application = await this.applicationRepository.findOne({ where: { id } });
    if (!application) {
      throw new NotFoundException(`Application ${id} not found`);
    }
    return application;
  }

  async update(id: string, updateDto: UpdateApplicationDto, user: any) {
    const application = await this.findOne(id);
    const previousResponsiblePerson = application.responsiblePerson;

    if (updateDto.responsiblePerson !== undefined && updateDto.responsiblePerson !== previousResponsiblePerson) {
      if (!updateDto.reason || !updateDto.operatorName) {
        throw new Error('Reason and operatorName are required when changing responsible person');
      }
    }

    Object.assign(application, updateDto);
    const saved = await this.applicationRepository.save(application);

    await this.auditLogsService.createLog({
      operator: user.id,
      operatorName: user.displayName || user.username,
      action: 'UPDATE',
      entityType: 'APPLICATION',
      entityId: id,
      details: {
        ...updateDto,
        responsiblePersonChanged: updateDto.responsiblePerson !== undefined && updateDto.responsiblePerson !== previousResponsiblePerson,
        previousResponsiblePerson,
        newResponsiblePerson: updateDto.responsiblePerson,
        reason: updateDto.reason,
        operatorName: updateDto.operatorName,
      },
    });

    return saved;
  }

  async remove(id: string, user: any) {
    const application = await this.findOne(id);

    await this.auditLogsService.createLog({
      operator: user.id,
      operatorName: user.displayName || user.username,
      action: 'DELETE',
      entityType: 'APPLICATION',
      entityId: id,
      details: { title: application.title },
    });

    await this.applicationRepository.remove(application);
    return { deleted: true };
  }
}
