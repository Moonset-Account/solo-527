import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, In } from 'typeorm';
import { Order, OrderProcess, DeliveryRequirement, ProductionProgress, ProductionNode } from '../../entities';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { OrderNoService } from '../../common/services/order-no.service';
import { NotificationService } from '../../common/services/notification.service';
import { SystemConfigService } from '../system-config/system-config.service';

export interface CreateOrderDto {
  customerId: string;
  salespersonId?: string;
  productName: string;
  productSpec?: string;
  quantity: number;
  unit?: string;
  unitPrice?: number;
  orderDate: Date;
  deliveryDate: Date;
  deliveryAddress?: string;
  remark?: string;
  urgentLevel?: number;
  processes?: Partial<OrderProcess>[];
  deliveryRequirements?: Partial<DeliveryRequirement>[];
  extraFields?: Record<string, any>;
}

export interface UpdateOrderDto {
  customerId?: string;
  salespersonId?: string;
  productName?: string;
  productSpec?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  orderDate?: Date;
  deliveryDate?: Date;
  deliveryAddress?: string;
  remark?: string;
  urgentLevel?: number;
  processes?: Partial<OrderProcess>[];
  deliveryRequirements?: Partial<DeliveryRequirement>[];
  extraFields?: Record<string, any>;
}

export interface OrderQueryDto extends PaginationDto {
  customerId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  urgentLevel?: number;
  salespersonId?: string;
  keyword?: string;
  ids?: string[];
  id?: string;
}

@Injectable()
export class OrderService extends BaseCrudService<Order> {
  constructor(
    @InjectRepository(Order)
    protected readonly repository: Repository<Order>,
    @InjectRepository(ProductionProgress)
    private readonly productionProgressRepository: Repository<ProductionProgress>,
    private readonly orderNoService: OrderNoService,
    private readonly notificationService: NotificationService,
    private readonly systemConfigService: SystemConfigService,
  ) {
    super(repository, '订单');
  }

  protected override getKeywordField(): string {
    return 'orderNo';
  }

  async findAllWithFilters(query: OrderQueryDto) {
    const qb = this.repository.createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.salesperson', 'salesperson');

    if (query.ids && query.ids.length > 0) {
      qb.andWhere('order.id IN (:...ids)', { ids: query.ids });
    }

    if (query.id) {
      qb.andWhere('order.id = :id', { id: query.id });
    }

    if (query.customerId) {
      qb.andWhere('order.customerId = :customerId', { customerId: query.customerId });
    }

    if (query.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }

    if (query.urgentLevel !== undefined && query.urgentLevel !== null) {
      qb.andWhere('order.urgentLevel = :urgentLevel', { urgentLevel: query.urgentLevel });
    }

    if (query.salespersonId) {
      qb.andWhere('order.salespersonId = :salespersonId', { salespersonId: query.salespersonId });
    }

    if (query.startDate && query.endDate) {
      qb.andWhere('order.orderDate BETWEEN :startDate AND :endDate', {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      });
    } else if (query.startDate) {
      qb.andWhere('order.orderDate >= :startDate', { startDate: new Date(query.startDate) });
    }

    if (query.keyword) {
      qb.andWhere('order.orderNo ILIKE :keyword', { keyword: `%${query.keyword}%` });
    }

    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    qb.skip(skip).take(pageSize);

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'DESC';
    qb.orderBy(`order.${sortBy}`, sortOrder as any);

    const [list, total] = await qb.getManyAndCount();

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOneWithRelations(id: string): Promise<Order> {
    const order = await this.repository.findOne({
      where: { id } as any,
      relations: [
        'customer',
        'salesperson',
        'processes',
        'deliveryRequirements',
        'productionProgress',
        'productionProgress.productionNode',
        'productionProgress.team',
        'qualityInspections',
        'materialShortages',
        'materialCosts',
      ],
      order: {
        processes: { sortOrder: 'ASC' } as any,
        deliveryRequirements: { sortOrder: 'ASC' } as any,
        productionProgress: { sortOrder: 'ASC' } as any,
        qualityInspections: { createdAt: 'DESC' } as any,
        materialShortages: { createdAt: 'DESC' } as any,
        materialCosts: { costDate: 'DESC' } as any,
      } as any,
    });
    if (!order) {
      throw new BadRequestException('订单不存在');
    }
    return order;
  }

  override async create(dto: CreateOrderDto, createdBy?: string): Promise<Order> {
    const orderNo = this.orderNoService.generate('DD');

    const totalAmount = dto.quantity && dto.unitPrice ? dto.quantity * dto.unitPrice : null;

    const defaultNodes = this.systemConfigService.getConfigJson<any[]>('production.default_nodes') || [];

    const order = this.repository.create({
      ...dto,
      orderNo,
      totalAmount,
      status: 'pending',
      createdBy,
      updatedBy: createdBy,
    });

    if (dto.processes && dto.processes.length > 0) {
      order.processes = dto.processes.map((p, index) => ({
        ...p,
        sortOrder: p.sortOrder ?? index,
      })) as OrderProcess[];
    }

    if (dto.deliveryRequirements && dto.deliveryRequirements.length > 0) {
      order.deliveryRequirements = dto.deliveryRequirements.map((d, index) => ({
        ...d,
        sortOrder: d.sortOrder ?? index,
      })) as DeliveryRequirement[];
    }

    const savedOrder = await this.repository.save(order);

    if (defaultNodes.length > 0) {
      const progressRecords: Partial<ProductionProgress>[] = defaultNodes.map((node, index) => ({
        orderId: savedOrder.id,
        nodeName: node.name,
        status: 'pending' as const,
        sortOrder: index,
        plannedQuantity: savedOrder.quantity,
        progressData: {
          estimatedHours: node.estimatedHours,
          nodeCode: node.code,
          nodeType: node.type,
        },
      }));
      await this.productionProgressRepository.save(progressRecords as ProductionProgress[]);
    }

    this.notificationService.create({
      type: 'system',
      title: '新订单创建',
      message: `订单【${orderNo}】${dto.productName} 已创建，待确认。`,
      level: 'info',
      relatedId: savedOrder.id,
    });

    return this.findOneWithRelations(savedOrder.id);
  }

  override async update(id: string, dto: UpdateOrderDto, updatedBy?: string): Promise<Order> {
    const order = await this.findOne(id);

    let totalAmount = order.totalAmount;
    if (dto.quantity !== undefined || dto.unitPrice !== undefined) {
      const quantity = dto.quantity ?? order.quantity;
      const unitPrice = dto.unitPrice ?? order.unitPrice;
      totalAmount = quantity && unitPrice ? quantity * unitPrice : null;
    }

    if (dto.processes) {
      order.processes = dto.processes.map((p, index) => ({
        ...p,
        orderId: id,
        sortOrder: p.sortOrder ?? index,
      })) as OrderProcess[];
    }

    if (dto.deliveryRequirements) {
      order.deliveryRequirements = dto.deliveryRequirements.map((d, index) => ({
        ...d,
        orderId: id,
        sortOrder: d.sortOrder ?? index,
      })) as DeliveryRequirement[];
    }

    this.repository.merge(order as any, {
      ...dto,
      totalAmount,
      updatedBy,
    });

    await this.repository.save(order);
    return this.findOneWithRelations(id);
  }

  async confirmOrder(id: string, updatedBy?: string): Promise<Order> {
    const order = await this.findOne(id);
    if (order.status !== 'pending') {
      throw new BadRequestException('只有待确认状态的订单才能确认');
    }

    order.status = 'confirmed';
    order.updatedBy = updatedBy;
    await this.repository.save(order);

    this.notificationService.create({
      type: 'production',
      title: '订单已确认',
      message: `订单【${order.orderNo}】${order.productName} 已确认，可以开始生产。`,
      level: 'info',
      relatedId: id,
    });

    return this.findOneWithRelations(id);
  }

  async startProduction(id: string, updatedBy?: string): Promise<Order> {
    const order = await this.findOne(id);
    if (order.status !== 'confirmed') {
      throw new BadRequestException('只有已确认状态的订单才能开始生产');
    }

    order.status = 'in_production';
    order.updatedBy = updatedBy;
    await this.repository.save(order);

    const firstProgress = await this.productionProgressRepository.findOne({
      where: { orderId: id, status: 'pending' } as any,
      order: { sortOrder: 'ASC' },
    });
    if (firstProgress) {
      firstProgress.status = 'in_progress';
      firstProgress.startTime = new Date();
      await this.productionProgressRepository.save(firstProgress);
    }

    this.notificationService.create({
      type: 'production',
      title: '开始生产',
      message: `订单【${order.orderNo}】${order.productName} 已开始生产。`,
      level: 'info',
      relatedId: id,
    });

    return this.findOneWithRelations(id);
  }

  async completeProduction(id: string, updatedBy?: string): Promise<Order> {
    const order = await this.findOne(id);
    if (order.status !== 'in_production') {
      throw new BadRequestException('只有生产中状态的订单才能完成生产');
    }

    const progressList = await this.productionProgressRepository.find({
      where: { orderId: id } as any,
      order: { sortOrder: 'ASC' },
    });

    const lastProgress = progressList[progressList.length - 1];
    if (lastProgress) {
      lastProgress.status = 'completed';
      lastProgress.endTime = new Date();
      lastProgress.completedQuantity = order.quantity;
      await this.productionProgressRepository.save(lastProgress);
    }

    order.status = 'quality_check';
    order.updatedBy = updatedBy;
    await this.repository.save(order);

    this.notificationService.create({
      type: 'quality',
      title: '生产完成待质检',
      message: `订单【${order.orderNo}】${order.productName} 生产完成，待质检。`,
      level: 'warning',
      relatedId: id,
    });

    return this.findOneWithRelations(id);
  }

  async qualityCheck(id: string, updatedBy?: string): Promise<Order> {
    const order = await this.findOne(id);
    if (order.status !== 'quality_check') {
      throw new BadRequestException('只有待质检状态的订单才能进行质检');
    }

    order.status = 'completed';
    order.updatedBy = updatedBy;
    await this.repository.save(order);

    this.notificationService.create({
      type: 'quality',
      title: '质检通过',
      message: `订单【${order.orderNo}】${order.productName} 质检通过，已完成。`,
      level: 'info',
      relatedId: id,
    });

    return this.findOneWithRelations(id);
  }

  async completeOrder(id: string, updatedBy?: string): Promise<Order> {
    const order = await this.findOne(id);
    if (order.status !== 'quality_check' && order.status !== 'in_production') {
      throw new BadRequestException('当前状态无法直接完成订单');
    }

    order.status = 'completed';
    order.updatedBy = updatedBy;
    await this.repository.save(order);

    this.notificationService.create({
      type: 'system',
      title: '订单完成',
      message: `订单【${order.orderNo}】${order.productName} 已完成。`,
      level: 'info',
      relatedId: id,
    });

    return this.findOneWithRelations(id);
  }

  async cancelOrder(id: string, updatedBy?: string): Promise<Order> {
    const order = await this.findOne(id);
    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new BadRequestException('已完成或已取消的订单无法取消');
    }

    order.status = 'cancelled';
    order.updatedBy = updatedBy;
    await this.repository.save(order);

    this.notificationService.create({
      type: 'system',
      title: '订单已取消',
      message: `订单【${order.orderNo}】${order.productName} 已取消。`,
      level: 'warning',
      relatedId: id,
    });

    return this.findOneWithRelations(id);
  }
}
