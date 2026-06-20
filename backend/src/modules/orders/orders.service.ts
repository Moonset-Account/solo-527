import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, In, Not } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto, ConfirmSelectionDto, RecordDownloadDto, SubmitSatisfactionDto, PaymentDto, QueryOrdersDto } from './dto/order.dto';
import { OrderStatus, PaymentMethod } from '../../common/enums/order.enum';
import { LicenseType } from '../../common/enums/material.enum';
import { UserRole } from '../../common/enums/user.enum';
import { MaterialsService } from '../materials/materials.service';
import { User } from '../users/entities/user.entity';
import { TimelineEventType } from '../../common/enums/timeline.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private materialsService: MaterialsService,
    private dataSource: DataSource,
  ) {}

  private generateOrderNo(): string {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0') +
      date.getHours().toString().padStart(2, '0') +
      date.getMinutes().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD${dateStr}${random}`;
  }

  async create(createOrderDto: CreateOrderDto, clientId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const materialIds = createOrderDto.items.map((i) => i.materialId);
      const materials = await this.materialsService.findByIds(materialIds);

      if (materials.length !== materialIds.length) {
        throw new BadRequestException('部分素材不存在');
      }

      const photographer = await this.usersRepository.findOne({
        where: { id: createOrderDto.photographerId },
      });
      if (!photographer) throw new NotFoundException('摄影师不存在');

      let totalAmount = 0;
      const items: OrderItem[] = createOrderDto.items.map((item) => {
        const material = materials.find((m) => m.id === item.materialId);
        let unitPrice = material.pricePersonal;
        const licenseType = item.licenseType || LicenseType.PERSONAL;

        if (licenseType === LicenseType.COMMERCIAL) unitPrice = material.priceCommercial;
        if (licenseType === LicenseType.EXCLUSIVE) {
          if (!material.priceExclusive) throw new BadRequestException('该素材不支持独家授权');
          unitPrice = material.priceExclusive;
        }

        const quantity = item.quantity || 1;
        const subtotal = parseFloat((unitPrice * quantity).toFixed(2));
        totalAmount += subtotal;

        return this.orderItemsRepository.create({
          materialId: material.id,
          materialTitle: material.title,
          materialCoverUrl: material.coverImageUrl,
          licenseType,
          unitPrice,
          quantity,
          subtotal,
          remark: item.remark,
        });
      });

      totalAmount = parseFloat(totalAmount.toFixed(2));
      const settlementRatio = photographer.settlementRatio || 0.7;
      const photographerIncome = parseFloat((totalAmount * settlementRatio).toFixed(2));
      const platformIncome = parseFloat((totalAmount - photographerIncome).toFixed(2));

      const order = manager.create(Order, {
        orderNo: this.generateOrderNo(),
        clientId,
        photographerId: photographer.id,
        totalAmount,
        finalAmount: totalAmount,
        discountAmount: 0,
        photographerIncome,
        platformIncome,
        status: OrderStatus.PENDING_PAYMENT,
        maxRevisionRounds: createOrderDto.maxRevisionRounds || 3,
        currentRevisionRound: 0,
        deadlineAt: createOrderDto.deadlineAt ? new Date(createOrderDto.deadlineAt) : null,
        remark: createOrderDto.remark,
        items,
        createdBy: clientId,
      });

      const saved = await manager.save(order);
      return this.findOne(saved.id);
    });
  }

  async findAll(query: QueryOrdersDto, userId?: string, userRole?: string) {
    const { status, clientId, photographerId, orderNo, satisfactionLevel, startDate, endDate, page, pageSize } = query;
    const p = parseInt(page, 10) || 1;
    const ps = parseInt(pageSize, 10) || 20;

    const where: any = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (photographerId) where.photographerId = photographerId;
    if (orderNo) where.orderNo = orderNo;
    if (satisfactionLevel) where.satisfactionLevel = satisfactionLevel;
    if (startDate && endDate) where.createdAt = Between(new Date(startDate), new Date(endDate));

    if (userRole === UserRole.CLIENT && userId) {
      where.clientId = userId;
    } else if (userRole === UserRole.PHOTOGRAPHER && userId) {
      where.photographerId = userId;
    }

    const [list, total] = await this.ordersRepository.findAndCount({
      where,
      relations: ['client', 'photographer', 'items'],
      skip: (p - 1) * ps,
      take: ps,
      order: { createdAt: 'DESC' },
    });

    return { list, total, page: p, pageSize: ps };
  }

  async findOne(id: string) {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['client', 'photographer', 'items', 'deliveries', 'settlements', 'exceptions', 'timelines'],
    });
    if (!order) throw new NotFoundException('订单不存在');
    return order;
  }

  async findByOrderNo(orderNo: string) {
    const order = await this.ordersRepository.findOne({
      where: { orderNo },
      relations: ['client', 'photographer', 'items', 'deliveries'],
    });
    if (!order) throw new NotFoundException('订单不存在');
    return order;
  }

  async checkPermission(orderId: string, userId: string, userRole: string): Promise<Order> {
    const order = await this.findOne(orderId);
    if (userRole !== UserRole.ADMIN && order.clientId !== userId && order.photographerId !== userId) {
      throw new ForbiddenException('无权访问此订单');
    }
    return order;
  }

  async pay(id: string, paymentDto: PaymentDto, userId: string, userRole: string) {
    const order = await this.checkPermission(id, userId, userRole);
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('订单状态不允许支付');
    }

    order.status = OrderStatus.PAID;
    order.paymentMethod = paymentDto.paymentMethod;
    order.paidAt = new Date();
    order.updatedBy = userId;

    await this.ordersRepository.save(order);

    const materialIds = order.items.map((item) => item.materialId);
    await this.materialsService.incrementSale(materialIds);

    return this.findOne(id);
  }

  async confirmSelection(id: string, dto: ConfirmSelectionDto, userId: string, userRole: string) {
    const order = await this.checkPermission(id, userId, userRole);
    if (order.clientId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('只有客户可以确认选片');
    }
    if (order.status !== OrderStatus.PAID && order.status !== OrderStatus.SELECTING) {
      throw new BadRequestException('订单状态不允许确认选片');
    }

    const validIds = order.items.filter((i) => dto.selectedItemIds.includes(i.id)).map((i) => i.id);
    await this.orderItemsRepository.update(
      { id: In(validIds) },
      { isSelected: true, selectedAt: new Date() },
    );

    await this.orderItemsRepository.update(
      { orderId: id, id: Not(In(validIds)) } as any,
      { isSelected: false, selectedAt: null },
    );

    order.status = OrderStatus.SELECTED_CONFIRMED;
    order.updatedBy = userId;
    await this.ordersRepository.save(order);

    return this.findOne(id);
  }

  async recordDownload(id: string, dto: RecordDownloadDto, userId: string, userRole: string) {
    const order = await this.checkPermission(id, userId, userRole);
    if (order.clientId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('只有客户可以下载');
    }
    if ([OrderStatus.PENDING_PAYMENT, OrderStatus.PAID].includes(order.status)) {
      throw new BadRequestException('当前状态不可下载，请等待交付完成');
    }

    const items = order.items.filter((i) => dto.itemIds.includes(i.id) && i.isSelected);
    const ids = items.map((i) => i.id);
    if (ids.length > 0) {
      await this.orderItemsRepository.update(
        { id: In(ids) },
        { downloaded: true, downloadedAt: new Date() },
      );
    }

    return { success: true, downloadedCount: ids.length, items };
  }

  async submitSatisfaction(id: string, dto: SubmitSatisfactionDto, userId: string, userRole: string) {
    const order = await this.checkPermission(id, userId, userRole);
    if (order.clientId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('只有客户可以提交满意度');
    }
    if (![OrderStatus.DELIVERED, OrderStatus.REVISING, OrderStatus.COMPLETED].includes(order.status)) {
      throw new BadRequestException('订单状态不允许提交满意度');
    }

    order.satisfactionLevel = dto.satisfactionLevel;
    order.satisfactionFeedback = dto.satisfactionFeedback;
    order.updatedBy = userId;
    await this.ordersRepository.save(order);

    return this.findOne(id);
  }

  async updateStatus(id: string, status: OrderStatus, operatorId: string) {
    const order = await this.findOne(id);
    order.status = status;
    order.updatedBy = operatorId;
    if (status === OrderStatus.COMPLETED) order.completedAt = new Date();
    await this.ordersRepository.save(order);
    return this.findOne(id);
  }

  async getMyOrders(userId: string, query: QueryOrdersDto) {
    return this.findAll({ ...query, clientId: userId });
  }

  async getPhotographerOrders(userId: string, query: QueryOrdersDto) {
    return this.findAll({ ...query, photographerId: userId });
  }
}
