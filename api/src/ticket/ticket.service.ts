import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './entities/ticket.entity.js';
import { TimelineEvent } from './entities/timeline-event.entity.js';
import { TicketAsset } from './entities/ticket-asset.entity.js';
import { SlaDetail } from './entities/sla-detail.entity.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { AssetService } from '../asset/asset.service.js';
import {
  TicketStatus,
  EventType,
  SlaStage,
  TargetType,
} from '../../../shared/types.js';
import type { User } from '../user/entities/user.entity.js';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(TimelineEvent)
    private timelineEventRepository: Repository<TimelineEvent>,
    @InjectRepository(TicketAsset)
    private ticketAssetRepository: Repository<TicketAsset>,
    @InjectRepository(SlaDetail)
    private slaDetailRepository: Repository<SlaDetail>,
    private auditService: AuditService,
    private assetService: AssetService,
  ) {}

  async findAll(query: {
    type?: string;
    status?: string;
    assignee?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { type, status, assignee, page = 1, pageSize = 10 } = query;
    const qb = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.creator', 'creator')
      .leftJoinAndSelect('ticket.assignee', 'assignee');

    if (type) {
      qb.andWhere('ticket.type = :type', { type });
    }
    if (status) {
      qb.andWhere('ticket.status = :status', { status });
    }
    if (assignee) {
      qb.andWhere('ticket.assignee_id = :assignee', { assignee: parseInt(assignee, 10) });
    }

    qb.orderBy('ticket.created_at', 'DESC');
    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return { items, total, page, pageSize };
  }

  async findOne(id: number) {
    return this.ticketRepository.findOne({
      where: { id },
      relations: [
        'creator',
        'assignee',
        'timelineEvents',
        'timelineEvents.operator',
        'slaDetails',
        'slaDetails.operator',
        'ticketAssets',
        'ticketAssets.asset',
      ],
    });
  }

  async create(dto: CreateTicketDto, creator: User) {
    const ticket = this.ticketRepository.create({
      title: dto.title,
      type: dto.type,
      priority: dto.priority,
      description: dto.description,
      creator: { id: creator.id } as User,
    });
    const saved = await this.ticketRepository.save(ticket);

    const slaDetail = this.slaDetailRepository.create({
      ticket: saved,
      stage: SlaStage.created,
      operator: { id: creator.id } as User,
      startedAt: new Date(),
    });
    await this.slaDetailRepository.save(slaDetail);

    const timelineEvent = this.timelineEventRepository.create({
      ticket: saved,
      eventType: EventType.status_change,
      title: '工单已创建',
      description: `工单 "${dto.title}" 已创建`,
      operator: { id: creator.id } as User,
    });
    await this.timelineEventRepository.save(timelineEvent);

    if (dto.assetIds && dto.assetIds.length > 0) {
      for (const assetId of dto.assetIds) {
        const ticketAsset = this.ticketAssetRepository.create({
          ticket: saved,
          asset: { id: assetId },
        });
        await this.ticketAssetRepository.save(ticketAsset);
      }
    }

    await this.auditService.log(
      creator.id,
      'create_ticket',
      TargetType.ticket,
      saved.id,
      null,
      { title: saved.title, type: saved.type } as unknown as Record<string, unknown>,
    );

    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateTicketDto, operator: User) {
    const before = await this.ticketRepository.findOne({ where: { id } });
    if (!before) throw new NotFoundException('Ticket not found');

    if (dto.status && dto.status !== before.status) {
      await this.handleStatusChange(id, before.status, dto.status, operator);
    }

    if (dto.assigneeId) {
      const oldAssignee = before.assignee?.id || null;
      await this.ticketRepository.update(id, {
        assignee: { id: dto.assigneeId } as User,
      } as Partial<Ticket>);
      if (!oldAssignee) {
        dto.status = TicketStatus.assigned;
        await this.handleStatusChange(id, before.status, TicketStatus.assigned, operator);
      }
    }

    await this.ticketRepository.update(id, dto as Partial<Ticket>);
    const after = await this.ticketRepository.findOne({ where: { id } });

    await this.auditService.log(
      operator.id,
      'update_ticket',
      TargetType.ticket,
      id,
      before as unknown as Record<string, unknown>,
      after as unknown as Record<string, unknown>,
    );

    return this.findOne(id);
  }

  private async handleStatusChange(
    ticketId: number,
    fromStatus: string,
    toStatus: string,
    operator: User,
  ) {
    const stageMap: Record<string, SlaStage> = {
      [TicketStatus.pending]: SlaStage.created,
      [TicketStatus.assigned]: SlaStage.assigned,
      [TicketStatus.processing]: SlaStage.processing,
      [TicketStatus.approved]: SlaStage.approved,
      [TicketStatus.closed]: SlaStage.closed,
    };

    const previousSla = await this.slaDetailRepository.findOne({
      where: { ticket: { id: ticketId }, completedAt: null as unknown as Date },
      order: { id: 'DESC' },
    });

    if (previousSla && !previousSla.completedAt) {
      previousSla.completedAt = new Date();
      const diff = previousSla.completedAt.getTime() - new Date(previousSla.startedAt).getTime();
      previousSla.durationMinutes = Math.round(diff / 60000);
      await this.slaDetailRepository.save(previousSla);
    }

    const newStage = stageMap[toStatus];
    if (newStage) {
      const slaDetail = this.slaDetailRepository.create({
        ticket: { id: ticketId } as Ticket,
        stage: newStage,
        operator: { id: operator.id } as User,
        startedAt: new Date(),
      });
      await this.slaDetailRepository.save(slaDetail);
    }

    const timelineEvent = this.timelineEventRepository.create({
      ticket: { id: ticketId } as Ticket,
      eventType: EventType.status_change,
      title: `状态变更: ${fromStatus} → ${toStatus}`,
      description: `工单状态从 ${fromStatus} 变更为 ${toStatus}`,
      operator: { id: operator.id } as User,
      payload: { fromStatus, toStatus },
    });
    await this.timelineEventRepository.save(timelineEvent);
  }

  async assign(id: number, assigneeId: number, operator: User) {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    await this.ticketRepository.update(id, {
      assignee: { id: assigneeId } as User,
      status: TicketStatus.assigned,
    });

    await this.handleStatusChange(id, ticket.status, TicketStatus.assigned, operator);

    const timelineEvent = this.timelineEventRepository.create({
      ticket: { id } as Ticket,
      eventType: EventType.status_change,
      title: '工单已分配',
      description: `工单已分配给用户 ${assigneeId}`,
      operator: { id: operator.id } as User,
    });
    await this.timelineEventRepository.save(timelineEvent);

    await this.auditService.log(
      operator.id,
      'assign_ticket',
      TargetType.ticket,
      id,
      { assignee: ticket.assignee?.id } as unknown as Record<string, unknown>,
      { assignee: assigneeId } as unknown as Record<string, unknown>,
    );

    return this.findOne(id);
  }

  async approve(id: number, userId: number) {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    await this.ticketRepository.update(id, { status: TicketStatus.approved });
    await this.handleStatusChange(id, ticket.status, TicketStatus.approved, { id: userId } as User);

    const timelineEvent = this.timelineEventRepository.create({
      ticket: { id } as Ticket,
      eventType: EventType.status_change,
      title: '工单已审批通过',
      description: '工单已审批通过',
      operator: { id: userId } as User,
    });
    await this.timelineEventRepository.save(timelineEvent);

    await this.auditService.log(
      userId,
      'approve_ticket',
      TargetType.ticket,
      id,
      { status: ticket.status } as unknown as Record<string, unknown>,
      { status: TicketStatus.approved } as unknown as Record<string, unknown>,
    );

    return this.findOne(id);
  }

  async reject(id: number, userId: number, comment: string) {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    await this.ticketRepository.update(id, { status: TicketStatus.rejected });
    await this.handleStatusChange(id, ticket.status, TicketStatus.rejected, { id: userId } as User);

    const timelineEvent = this.timelineEventRepository.create({
      ticket: { id } as Ticket,
      eventType: EventType.status_change,
      title: '工单已驳回',
      description: comment,
      operator: { id: userId } as User,
      payload: { comment },
    });
    await this.timelineEventRepository.save(timelineEvent);

    await this.auditService.log(
      userId,
      'reject_ticket',
      TargetType.ticket,
      id,
      { status: ticket.status } as unknown as Record<string, unknown>,
      { status: TicketStatus.rejected } as unknown as Record<string, unknown>,
    );

    return this.findOne(id);
  }
}
