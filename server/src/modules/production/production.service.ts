import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In, Between } from 'typeorm';
import { ProductionNode, ProductionProgress, Team, TeamSchedule } from '../../entities';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { NotificationService } from '../../common/services/notification.service';
import { SystemConfigService } from '../system-config/system-config.service';

export type ProgressStatus = 'pending' | 'in_progress' | 'completed' | 'paused' | 'cancelled';

export interface CreateProductionNodeDto {
  nodeName: string;
  nodeCode: string;
  nodeType?: string;
  nodeDescription?: string;
  estimatedHours?: number;
  sortOrder?: number;
  isActive?: boolean;
  thresholdConfig?: Record<string, any>;
  extraFields?: Record<string, any>;
}

export interface UpdateProductionNodeDto {
  nodeName?: string;
  nodeCode?: string;
  nodeType?: string;
  nodeDescription?: string;
  estimatedHours?: number;
  sortOrder?: number;
  isActive?: boolean;
  thresholdConfig?: Record<string, any>;
  extraFields?: Record<string, any>;
}

export interface CreateProductionProgressDto {
  orderId: string;
  nodeId?: string;
  nodeName: string;
  teamId?: string;
  status?: ProgressStatus;
  startTime?: Date;
  endTime?: Date;
  plannedQuantity?: number;
  completedQuantity?: number;
  sortOrder?: number;
  progressData?: Record<string, any>;
  remark?: string;
  extraFields?: Record<string, any>;
}

export interface UpdateProductionProgressDto {
  nodeId?: string;
  nodeName?: string;
  teamId?: string;
  status?: ProgressStatus;
  startTime?: Date;
  endTime?: Date;
  plannedQuantity?: number;
  completedQuantity?: number;
  sortOrder?: number;
  progressData?: Record<string, any>;
  remark?: string;
  extraFields?: Record<string, any>;
}

export interface ProgressQueryDto extends PaginationDto {
  orderId?: string;
  status?: ProgressStatus;
  nodeId?: string;
  teamId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface CreateTeamDto {
  teamName: string;
  teamCode: string;
  teamType?: string;
  teamLeader?: string;
  leaderPhone?: string;
  memberCount?: number;
  members?: Record<string, any>[];
  isActive?: boolean;
  capacityConfig?: Record<string, any>;
  extraFields?: Record<string, any>;
}

export interface UpdateTeamDto {
  teamName?: string;
  teamCode?: string;
  teamType?: string;
  teamLeader?: string;
  leaderPhone?: string;
  memberCount?: number;
  members?: Record<string, any>[];
  isActive?: boolean;
  capacityConfig?: Record<string, any>;
  extraFields?: Record<string, any>;
}

export interface CreateTeamScheduleDto {
  teamId: string;
  orderId?: string;
  taskName?: string;
  scheduleDate: Date;
  shift?: string;
  startTime?: Date;
  endTime?: Date;
  plannedQuantity?: number;
  actualQuantity?: number;
  status?: string;
  remark?: string;
  extraFields?: Record<string, any>;
}

export interface UpdateTeamScheduleDto {
  teamId?: string;
  orderId?: string;
  taskName?: string;
  scheduleDate?: Date;
  shift?: string;
  startTime?: Date;
  endTime?: Date;
  plannedQuantity?: number;
  actualQuantity?: number;
  status?: string;
  remark?: string;
  extraFields?: Record<string, any>;
}

export interface ScheduleQueryDto extends PaginationDto {
  teamId?: string;
  orderId?: string;
  status?: string;
  shift?: string;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class ProductionNodeService extends BaseCrudService<ProductionNode> {
  constructor(
    @InjectRepository(ProductionNode)
    protected readonly repository: Repository<ProductionNode>,
  ) {
    super(repository, '生产节点');
  }

  protected override getKeywordField(): string {
    return 'nodeName';
  }

  async findAllActive(): Promise<ProductionNode[]> {
    return this.repository.find({
      where: { isActive: true } as any,
      order: { sortOrder: 'ASC' } as any,
    });
  }

  async findByNodeType(nodeType: string): Promise<ProductionNode[]> {
    return this.repository.find({
      where: { nodeType, isActive: true } as any,
      order: { sortOrder: 'ASC' } as any,
    });
  }

  override async create(dto: CreateProductionNodeDto, createdBy?: string): Promise<ProductionNode> {
    const existing = await this.repository.findOne({
      where: { nodeCode: dto.nodeCode } as any,
    });
    if (existing) {
      throw new BadRequestException('节点编码已存在');
    }
    return super.create(dto, createdBy);
  }

  override async update(id: string, dto: UpdateProductionNodeDto, updatedBy?: string): Promise<ProductionNode> {
    if (dto.nodeCode) {
      const existing = await this.repository.findOne({
        where: { nodeCode: dto.nodeCode } as any,
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('节点编码已存在');
      }
    }
    return super.update(id, dto, updatedBy);
  }
}

@Injectable()
export class ProductionProgressService extends BaseCrudService<ProductionProgress> {
  constructor(
    @InjectRepository(ProductionProgress)
    protected readonly repository: Repository<ProductionProgress>,
    private readonly notificationService: NotificationService,
    private readonly systemConfigService: SystemConfigService,
  ) {
    super(repository, '生产进度');
  }

  async findAllWithFilters(query: ProgressQueryDto) {
    const where: FindOptionsWhere<ProductionProgress> = {};

    if (query.orderId) {
      (where as any).orderId = query.orderId;
    }
    if (query.status) {
      (where as any).status = query.status;
    }
    if (query.nodeId) {
      (where as any).nodeId = query.nodeId;
    }
    if (query.teamId) {
      (where as any).teamId = query.teamId;
    }
    if (query.startDate && query.endDate) {
      (where as any).createdAt = Between(new Date(query.startDate), new Date(query.endDate));
    }

    return this.findAll(query, where);
  }

  async findByOrderId(orderId: string): Promise<ProductionProgress[]> {
    return this.repository.find({
      where: { orderId } as any,
      order: { sortOrder: 'ASC' } as any,
      relations: ['productionNode', 'team'],
    });
  }

  async findOneWithRelations(id: string): Promise<ProductionProgress> {
    const progress = await this.repository.findOne({
      where: { id } as any,
      relations: ['productionNode', 'team', 'order'],
    });
    if (!progress) {
      throw new BadRequestException('生产进度不存在');
    }
    return progress;
  }

  override async create(dto: CreateProductionProgressDto, createdBy?: string): Promise<ProductionProgress> {
    const progress = this.repository.create({
      ...dto,
      status: dto.status || 'pending',
      createdBy,
      updatedBy: createdBy,
    });
    return this.repository.save(progress);
  }

  async startProgress(id: string, updatedBy?: string): Promise<ProductionProgress> {
    const progress = await this.findOne(id);
    if (progress.status !== 'pending' && progress.status !== 'paused') {
      throw new BadRequestException('只有待开始或暂停状态才能开始生产');
    }

    progress.status = 'in_progress';
    if (!progress.startTime) {
      progress.startTime = new Date();
    }
    progress.updatedBy = updatedBy;
    return this.repository.save(progress);
  }

  async pauseProgress(id: string, updatedBy?: string): Promise<ProductionProgress> {
    const progress = await this.findOne(id);
    if (progress.status !== 'in_progress') {
      throw new BadRequestException('只有进行中状态才能暂停');
    }

    progress.status = 'paused';
    progress.updatedBy = updatedBy;
    return this.repository.save(progress);
  }

  async completeProgress(id: string, completedQuantity?: number, updatedBy?: string): Promise<ProductionProgress> {
    const progress = await this.findOne(id);
    if (progress.status === 'completed') {
      throw new BadRequestException('该节点已完成');
    }

    progress.status = 'completed';
    progress.endTime = new Date();
    if (completedQuantity !== undefined) {
      progress.completedQuantity = completedQuantity;
    }
    progress.updatedBy = updatedBy;

    const saved = await this.repository.save(progress);

    this.notificationService.create({
      type: 'production',
      title: '生产节点完成',
      message: `生产节点【${saved.nodeName}】已完成。`,
      level: 'info',
      relatedId: saved.id,
    });

    return saved;
  }

  async assignTeam(id: string, teamId: string, updatedBy?: string): Promise<ProductionProgress> {
    const progress = await this.findOne(id);
    progress.teamId = teamId;
    progress.updatedBy = updatedBy;
    return this.repository.save(progress);
  }

  async checkDelays(): Promise<ProductionProgress[]> {
    const reminderDays = parseInt(this.systemConfigService.getConfigValue('delivery.reminder_days') || '3');
    const now = new Date();
    const allProgress = await this.repository.find({
      where: { status: In(['pending', 'in_progress', 'paused']) } as any,
      relations: ['order'],
    });

    const delayed: ProductionProgress[] = [];
    for (const p of allProgress) {
      if ((p as any).order?.deliveryDate) {
        const deliveryDate = new Date((p as any).order.deliveryDate);
        const diffDays = (deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays <= reminderDays && p.status !== 'completed') {
          delayed.push(p);
        }
      }
    }

    return delayed;
  }
}

@Injectable()
export class TeamService extends BaseCrudService<Team> {
  constructor(
    @InjectRepository(Team)
    protected readonly repository: Repository<Team>,
  ) {
    super(repository, '班组');
  }

  protected override getKeywordField(): string {
    return 'teamName';
  }

  async findAllActive(): Promise<Team[]> {
    return this.repository.find({
      where: { isActive: true } as any,
      order: { teamName: 'ASC' } as any,
    });
  }

  async findByTeamType(teamType: string): Promise<Team[]> {
    return this.repository.find({
      where: { teamType, isActive: true } as any,
      order: { teamName: 'ASC' } as any,
    });
  }

  override async create(dto: CreateTeamDto, createdBy?: string): Promise<Team> {
    const existing = await this.repository.findOne({
      where: { teamCode: dto.teamCode } as any,
    });
    if (existing) {
      throw new BadRequestException('班组编码已存在');
    }
    return super.create(dto, createdBy);
  }

  override async update(id: string, dto: UpdateTeamDto, updatedBy?: string): Promise<Team> {
    if (dto.teamCode) {
      const existing = await this.repository.findOne({
        where: { teamCode: dto.teamCode } as any,
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('班组编码已存在');
      }
    }
    return super.update(id, dto, updatedBy);
  }
}

@Injectable()
export class TeamScheduleService extends BaseCrudService<TeamSchedule> {
  constructor(
    @InjectRepository(TeamSchedule)
    protected readonly repository: Repository<TeamSchedule>,
    private readonly notificationService: NotificationService,
  ) {
    super(repository, '班组排期');
  }

  async findAllWithFilters(query: ScheduleQueryDto) {
    const where: FindOptionsWhere<TeamSchedule> = {};

    if (query.teamId) {
      (where as any).teamId = query.teamId;
    }
    if (query.orderId) {
      (where as any).orderId = query.orderId;
    }
    if (query.status) {
      (where as any).status = query.status;
    }
    if (query.shift) {
      (where as any).shift = query.shift;
    }
    if (query.startDate && query.endDate) {
      (where as any).scheduleDate = Between(new Date(query.startDate), new Date(query.endDate));
    }

    return this.findAll(query, where);
  }

  async findByTeamAndDate(teamId: string, date: Date): Promise<TeamSchedule[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return this.repository.find({
      where: {
        teamId,
        scheduleDate: Between(start, end),
      } as any,
      order: { shift: 'ASC' } as any,
      relations: ['team'],
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<TeamSchedule[]> {
    return this.repository.find({
      where: {
        scheduleDate: Between(new Date(startDate), new Date(endDate)),
      } as any,
      order: { scheduleDate: 'ASC', shift: 'ASC' } as any,
      relations: ['team'],
    });
  }

  async findOneWithRelations(id: string): Promise<TeamSchedule> {
    const schedule = await this.repository.findOne({
      where: { id } as any,
      relations: ['team'],
    });
    if (!schedule) {
      throw new BadRequestException('排期不存在');
    }
    return schedule;
  }

  override async create(dto: CreateTeamScheduleDto, createdBy?: string): Promise<TeamSchedule> {
    const schedule = this.repository.create({
      ...dto,
      status: (dto.status as any) || 'scheduled',
      createdBy,
      updatedBy: createdBy,
    } as any);
    const saved = await this.repository.save(schedule as any) as unknown as TeamSchedule;

    this.notificationService.create({
      type: 'production',
      title: '新建班组排期',
      message: `${(saved as any).taskName || '新任务'} 已安排到 ${new Date((saved as any).scheduleDate).toLocaleDateString()}。`,
      level: 'info',
      relatedId: (saved as any).id,
    });

    return saved;
  }

  async startSchedule(id: string, updatedBy?: string): Promise<TeamSchedule> {
    const schedule = await this.findOne(id);
    if (schedule.status !== 'scheduled') {
      throw new BadRequestException('只有已排期状态才能开始');
    }

    schedule.status = 'in_progress';
    schedule.startTime = schedule.startTime || new Date();
    schedule.updatedBy = updatedBy;
    return this.repository.save(schedule);
  }

  async completeSchedule(id: string, actualQuantity?: number, updatedBy?: string): Promise<TeamSchedule> {
    const schedule = await this.findOne(id);
    if (schedule.status === 'completed') {
      throw new BadRequestException('该排期已完成');
    }

    schedule.status = 'completed';
    schedule.endTime = new Date();
    if (actualQuantity !== undefined) {
      schedule.actualQuantity = actualQuantity;
    }
    schedule.updatedBy = updatedBy;
    return this.repository.save(schedule);
  }

  async cancelSchedule(id: string, updatedBy?: string): Promise<TeamSchedule> {
    const schedule = await this.findOne(id);
    if (schedule.status === 'completed') {
      throw new BadRequestException('已完成的排期无法取消');
    }

    schedule.status = 'cancelled';
    schedule.updatedBy = updatedBy;
    return this.repository.save(schedule);
  }
}
