import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fault, FaultStatus, AlertStatus } from './entities/fault.entity';
import { CreateFaultDto } from './dto/create-fault.dto';
import { UpdateFaultDto } from './dto/update-fault.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class FaultsService {
  constructor(
    @InjectRepository(Fault)
    private faultRepository: Repository<Fault>,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(createDto: CreateFaultDto, user: any) {
    const fault = this.faultRepository.create(createDto);
    const saved = await this.faultRepository.save(fault);

    await this.auditLogsService.createLog({
      operator: user.id,
      operatorName: user.displayName || user.username,
      action: 'CREATE',
      entityType: 'FAULT',
      entityId: saved.id,
      details: { ...createDto },
    });

    return saved;
  }

  async findAll(pagination: PaginationDto, status?: string, severity?: string) {
    const query = this.faultRepository.createQueryBuilder('fault');

    if (status) {
      query.andWhere('fault.status = :status', { status });
    }
    if (severity) {
      query.andWhere('fault.severity = :severity', { severity });
    }

    query.orderBy(`fault.${pagination.sortBy}`, pagination.sortOrder);
    query.skip((pagination.page - 1) * pagination.limit);
    query.take(pagination.limit);

    const [items, total] = await query.getManyAndCount();
    return { data: items, total, page: pagination.page, limit: pagination.limit };
  }

  async findOne(id: string) {
    const fault = await this.faultRepository.findOne({ where: { id } });
    if (!fault) {
      throw new NotFoundException(`Fault ${id} not found`);
    }
    return fault;
  }

  async update(id: string, updateDto: UpdateFaultDto, user: any) {
    const fault = await this.findOne(id);
    const previousResponsiblePerson = fault.responsiblePerson;

    if (updateDto.responsiblePerson !== undefined && updateDto.responsiblePerson !== previousResponsiblePerson) {
      if (!updateDto.reason || !updateDto.operatorName) {
        throw new Error('Reason and operatorName are required when changing responsible person');
      }
    }

    Object.assign(fault, updateDto);
    const saved = await this.faultRepository.save(fault);

    await this.auditLogsService.createLog({
      operator: user.id,
      operatorName: user.displayName || user.username,
      action: 'UPDATE',
      entityType: 'FAULT',
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

  async resolve(id: string, resolution: string, user: any) {
    const fault = await this.findOne(id);

    fault.status = FaultStatus.RESOLVED;
    fault.resolution = resolution;
    fault.resolvedAt = new Date();

    if (fault.alertStatus === AlertStatus.ACTIVE) {
      fault.alertStatus = AlertStatus.RESOLVED;

      await this.auditLogsService.createLog({
        operator: user.id,
        operatorName: user.displayName || user.username,
        action: 'RESOLVE_ALERT',
        entityType: 'FAULT',
        entityId: id,
        details: {
          alertWasActive: true,
          previousAlertStatus: AlertStatus.ACTIVE,
          newAlertStatus: AlertStatus.RESOLVED,
          resolution,
        },
      });
    }

    const saved = await this.faultRepository.save(fault);

    await this.auditLogsService.createLog({
      operator: user.id,
      operatorName: user.displayName || user.username,
      action: 'RESOLVE',
      entityType: 'FAULT',
      entityId: id,
      details: { resolution },
    });

    return saved;
  }

  async findAlerts() {
    return this.faultRepository.find({ where: { alertStatus: AlertStatus.ACTIVE } });
  }
}
