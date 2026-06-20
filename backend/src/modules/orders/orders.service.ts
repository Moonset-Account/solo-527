import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, In, Not } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto, ConfirmSelectionDto, RecordDownloadDto, SubmitSatisfactionDto, PaymentDto, QueryOrdersDto } from './dto/order.dto';
import { OrderStatus, PaymentMethod } from '../../common/enums/order.enum';
import { LicenseType } from '../../common/enums/material.enum';
import { UserRole } from '../../common/enums/user.enum';
import { TimelineEventType } from '../../common/enums/timeline.enum';
import { MaterialsService } from '../materials/materials.service';
import { User } from '../users/entities/user.entity';
import { TimelinesService } from '../timelines/timelines.service';

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
    private timelinesService: TimelinesService,
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
      relations: ['client', 'photographer', 'items', 'deliveries', 'deliveries.attachments', 'settlements', 'exceptions', 'timelines', 'timelines.operator'],
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

    const payer = await this.usersRepository.findOne({ where: { id: userId } });

    await this.ordersRepository.save(order);

    const materialIds = order.items.map((item) => item.materialId);
    await this.materialsService.incrementSale(materialIds);

    await this.timelinesService.create(
      {
        orderId: order.id,
        eventType: TimelineEventType.PAYMENT_CONFIRMED,
        title: '订单已支付',
        description: paymentDto.paymentMethod ? `支付方式: ${paymentDto.paymentMethod}` : '',
        operatorId: userId,
        operatorName: payer?.name || '客户',
        operatorRole: payer?.role || userRole,
        relatedEntityId: order.id,
        relatedEntityType: 'order',
        metadata: {
          paymentMethod: paymentDto.paymentMethod,
          paidAt: order.paidAt,
          finalAmount: order.finalAmount,
          remark: paymentDto.paymentMethod ? `支付方式: ${paymentDto.paymentMethod}` : '',
        },
      },
      userId,
    );

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

    const operator = await this.usersRepository.findOne({ where: { id: userId } });
    const selectedItems = order.items.filter((i) => dto.selectedItemIds.includes(i.id));

    await this.timelinesService.create(
      {
        orderId: order.id,
        eventType: TimelineEventType.SELECTION_CONFIRMED,
        title: '选片已确认',
        description: `已确认 ${validIds.length} 张照片`,
        operatorId: userId,
        operatorName: operator?.name || '客户',
        operatorRole: operator?.role || userRole,
        relatedEntityId: order.id,
        relatedEntityType: 'order',
        metadata: {
          selectedCount: validIds.length,
          totalCount: order.items.length,
          selectedItemIds: validIds,
          selectedItems: selectedItems.map((i) => ({ id: i.id, materialTitle: i.materialTitle })),
          remark: `已确认 ${validIds.length} 张照片`,
        },
      },
      userId,
    );

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

    const allAttachments: any[] = [];
    order.deliveries.forEach((delivery) => {
      if (delivery.status === 'accepted' || delivery.status === 'submitted') {
        delivery.attachments.forEach((att: any) => {
          allAttachments.push({
            id: att.id,
            originalName: att.originalName,
            fileUrl: att.fileUrl,
            mimetype: att.mimetype,
            size: att.size,
            deliveryId: delivery.id,
            deliveryRound: delivery.revisionRound,
            isKey: att.isKey,
          });
        });
      }
    });

    const downloadItems = items.map((item) => {
      const matchingAttachments = allAttachments.filter((att) => {
        const lowerName = att.originalName.toLowerCase();
        const itemTitle = item.materialTitle.toLowerCase();
        return lowerName.includes(itemTitle.substring(0, 5)) || lowerName.includes(item.id.substring(0, 8)) || true;
      });

      return {
        id: item.id,
        materialId: item.materialId,
        materialTitle: item.materialTitle,
        materialCoverUrl: item.materialCoverUrl,
        licenseType: item.licenseType,
        unitPrice: item.unitPrice,
        attachments: matchingAttachments,
        downloadUrl: matchingAttachments.length > 0 ? matchingAttachments[0].fileUrl : null,
        downloaded: item.downloaded,
        downloadedAt: item.downloadedAt,
      };
    });

    if (ids.length > 0) {
      await this.orderItemsRepository.update(
        { id: In(ids) },
        { downloaded: true, downloadedAt: new Date() },
      );
    }

    const operator = await this.usersRepository.findOne({ where: { id: userId } });

    await this.timelinesService.create(
      {
        orderId: order.id,
        eventType: TimelineEventType.DOWNLOAD_RECORDED,
        title: '成片已下载',
        description: `已下载 ${ids.length} 个文件`,
        operatorId: userId,
        operatorName: operator?.name || '客户',
        operatorRole: operator?.role || userRole,
        relatedEntityId: order.id,
        relatedEntityType: 'order',
        metadata: {
          downloadedCount: ids.length,
          downloadedItemIds: ids,
          attachments: allAttachments,
          remark: `已下载 ${ids.length} 个文件`,
        },
      },
      userId,
    );

    return {
      success: true,
      downloadedCount: ids.length,
      items: downloadItems,
      allAttachments,
    };
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

    const operator = await this.usersRepository.findOne({ where: { id: userId } });

    await this.timelinesService.create(
      {
        orderId: order.id,
        eventType: TimelineEventType.SATISFACTION_SUBMITTED,
        title: '满意度已提交',
        description: dto.satisfactionFeedback || '',
        operatorId: userId,
        operatorName: operator?.name || '客户',
        operatorRole: operator?.role || userRole,
        relatedEntityId: order.id,
        relatedEntityType: 'order',
        metadata: {
          satisfactionLevel: dto.satisfactionLevel,
          satisfactionFeedback: dto.satisfactionFeedback,
          stars: dto.satisfactionLevel,
          remark: dto.satisfactionFeedback || '',
        },
      },
      userId,
    );

    return this.findOne(id);
  }

  async updateStatus(id: string, status: OrderStatus, operatorId: string) {
    const order = await this.findOne(id);
    const oldStatus = order.status;
    order.status = status;
    order.updatedBy = operatorId;
    if (status === OrderStatus.COMPLETED) order.completedAt = new Date();
    await this.ordersRepository.save(order);

    const operator = await this.usersRepository.findOne({ where: { id: operatorId } });

    await this.timelinesService.create(
      {
        orderId: order.id,
        eventType: TimelineEventType.STATUS_CHANGED,
        title: `订单状态更新`,
        description: `从 ${oldStatus} 变更为 ${status}`,
        operatorId,
        operatorName: operator?.name || '管理员',
        operatorRole: operator?.role || UserRole.ADMIN,
        relatedEntityId: order.id,
        relatedEntityType: 'order',
        metadata: {
          oldStatus,
          newStatus: status,
          completedAt: order.completedAt,
          remark: `从 ${oldStatus} 变更为 ${status}`,
        },
      },
      operatorId,
    );

    return this.findOne(id);
  }

  async getMyOrders(userId: string, query: QueryOrdersDto) {
    return this.findAll({ ...query, clientId: userId });
  }

  async getPhotographerOrders(userId: string, query: QueryOrdersDto) {
    return this.findAll({ ...query, photographerId: userId });
  }
}
