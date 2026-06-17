import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { TicketLog } from './entities/ticket-log.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { CreateTicketLogDto } from './dto/create-ticket-log.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketLog)
    private ticketLogRepository: Repository<TicketLog>,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(
    createTicketDto: CreateTicketDto,
    operatorId?: string,
    ip?: string,
  ): Promise<Ticket> {
    const ticket = this.ticketRepository.create(createTicketDto);
    const saved = await this.ticketRepository.save(ticket);

    await this.addLog(saved.id, { action: '创建工单', remark: createTicketDto.description }, operatorId);

    await this.auditLogsService.create(
      'tickets',
      'create',
      'Ticket',
      saved.id,
      null,
      saved,
      operatorId,
      ip,
    );

    return saved;
  }

  async findAll(
    query: TicketQueryDto,
  ): Promise<{ items: Ticket[]; total: number; page: number; pageSize: number }> {
    const {
      page = 1,
      pageSize = 10,
      keyword,
      propertyId,
      type,
      status,
      priority,
      assigneeId,
      source,
    } = query;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.ticketRepository.createQueryBuilder('ticket');

    if (keyword) {
      queryBuilder.andWhere(
        '(ticket.title LIKE :keyword OR ticket.ticketNo LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }
    if (propertyId) {
      queryBuilder.andWhere('ticket.propertyId = :propertyId', { propertyId });
    }
    if (type) {
      queryBuilder.andWhere('ticket.type = :type', { type });
    }
    if (status) {
      queryBuilder.andWhere('ticket.status = :status', { status });
    }
    if (priority) {
      queryBuilder.andWhere('ticket.priority = :priority', { priority });
    }
    if (assigneeId) {
      queryBuilder.andWhere('ticket.assigneeId = :assigneeId', { assigneeId });
    }
    if (source) {
      queryBuilder.andWhere('ticket.source = :source', { source });
    }

    queryBuilder.leftJoinAndSelect('ticket.property', 'property');
    queryBuilder.leftJoinAndSelect('ticket.assignee', 'assignee');
    queryBuilder.orderBy('ticket.createdAt', 'DESC');
    queryBuilder.skip(skip).take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total, page, pageSize };
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['property', 'assignee', 'logs', 'logs.operator'],
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }
    return ticket;
  }

  async findByTicketNo(ticketNo: string): Promise<Ticket | undefined> {
    return this.ticketRepository.findOneBy({ ticketNo });
  }

  async update(
    id: string,
    updateTicketDto: UpdateTicketDto,
    operatorId?: string,
    ip?: string,
  ): Promise<Ticket> {
    const ticket = await this.findOne(id);
    const oldValue = { ...ticket };

    if (updateTicketDto.status === 'closed' && !updateTicketDto.closeRemark) {
      throw new BadRequestException('关闭工单需要填写关闭备注');
    }

    const statusChanged = updateTicketDto.status && updateTicketDto.status !== ticket.status;

    Object.assign(ticket, updateTicketDto);
    const saved = await this.ticketRepository.save(ticket);

    if (statusChanged) {
      await this.addLog(id, { action: `状态变更为 ${updateTicketDto.status}`, remark: updateTicketDto.closeRemark }, operatorId);
    }

    await this.auditLogsService.create(
      'tickets',
      'update',
      'Ticket',
      id,
      oldValue,
      saved,
      operatorId,
      ip,
    );

    return saved;
  }

  async updateStatus(
    id: string,
    status: TicketStatus,
    closeRemark?: string,
    operatorId?: string,
    ip?: string,
  ): Promise<Ticket> {
    const ticket = await this.findOne(id);
    const oldValue = { ...ticket };

    if (status === 'closed' && !closeRemark) {
      throw new BadRequestException('关闭工单需要填写关闭备注');
    }

    ticket.status = status;
    if (closeRemark) {
      ticket.closeRemark = closeRemark;
    }

    const saved = await this.ticketRepository.save(ticket);

    await this.addLog(id, { action: `状态变更为 ${status}`, remark: closeRemark }, operatorId);

    await this.auditLogsService.create(
      'tickets',
      'status_change',
      'Ticket',
      id,
      oldValue,
      saved,
      operatorId,
      ip,
    );

    return saved;
  }

  async addLog(
    ticketId: string,
    createTicketLogDto: CreateTicketLogDto,
    operatorId?: string,
  ): Promise<TicketLog> {
    const log = this.ticketLogRepository.create({
      ...createTicketLogDto,
      ticketId,
      operatorId,
    });
    return this.ticketLogRepository.save(log);
  }

  async getLogs(ticketId: string): Promise<TicketLog[]> {
    return this.ticketLogRepository.find({
      where: { ticketId },
      relations: ['operator'],
      order: { createdAt: 'DESC' },
    });
  }

  async remove(
    id: string,
    operatorId?: string,
    ip?: string,
  ): Promise<void> {
    const ticket = await this.findOne(id);
    const oldValue = { ...ticket };

    const result = await this.ticketRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    await this.auditLogsService.create(
      'tickets',
      'delete',
      'Ticket',
      id,
      oldValue,
      null,
      operatorId,
      ip,
    );
  }
}
