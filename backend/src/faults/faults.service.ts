import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fault, FaultStatus, AlertStatus } from './entities/fault.entity';
import { CreateFaultDto } from './dto/create-fault.dto';
import { UpdateFaultDto } from './dto/update-fault.dto';
import { QueryFaultsDto } from './dto/query-faults.dto';
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

  async findAll(query: QueryFaultsDto) {
    const { page, limit, sortBy, sortOrder, status, severity } = query;
    const queryBuilder = this.faultRepository.createQueryBuilder('fault');

    if (status) {
      queryBuilder.andWhere('fault.status = :status', { status });
    }
    if (severity) {
      queryBuilder.andWhere('fault.severity = :severity', { severity });
    }

    queryBuilder.orderBy(`fault.${sortBy}`, sortOrder);
    queryBuilder.skip((page - 1) * limit);
    queryBuilder.take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();
    return { data: items, total, page, limit };
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
