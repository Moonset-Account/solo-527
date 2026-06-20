import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from './entities/delivery.entity';
import { CreateDeliveryDto, ReviewDeliveryDto, QueryDeliveriesDto } from './dto/delivery.dto';
import { DeliveryStatus, DeliveryType } from '../../common/enums/delivery.enum';
import { OrderStatus } from '../../common/enums/order.enum';
import { UserRole } from '../../common/enums/user.enum';
import { AttachmentType } from '../../common/enums/attachment.enum';
import { OrdersService } from '../orders/orders.service';
import { TimelinesService } from '../timelines/timelines.service';
import { AttachmentsService } from '../attachments/attachments.service';
import { TimelineEventType } from '../../common/enums/timeline.enum';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private deliveriesRepository: Repository<Delivery>,
    private ordersService: OrdersService,
    private timelinesService: TimelinesService,
    private attachmentsService: AttachmentsService,
  ) {}

  async create(createDeliveryDto: CreateDeliveryDto, files: Express.Multer.File[], submitterId: string, submitterName: string, submitterRole: string) {
    const order = await this.ordersService.findOne(createDeliveryDto.orderId);

    if (submitterRole !== UserRole.ADMIN && order.photographerId !== submitterId) {
      throw new ForbiddenException('只有摄影师可以提交交付');
    }

    if (![OrderStatus.SELECTED_CONFIRMED, OrderStatus.REVISING, OrderStatus.DELIVERING].includes(order.status)) {
      throw new BadRequestException('当前订单状态不允许提交交付');
    }

    const { itemIds = [] } = createDeliveryDto;
    const normalizedItemIds = Array.isArray(itemIds) ? itemIds : [];
    const validItems = order.items.filter(
      (item: any) => normalizedItemIds.includes(item.id) && item.isSelected,
    );

    if (normalizedItemIds.length === 0) {
      throw new BadRequestException('请选择至少一个订单项进行交付');
    }
    if (validItems.length !== normalizedItemIds.length) {
      throw new BadRequestException('部分订单项无效或未选中，请检查后重试');
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('请至少上传一个交付文件');
    }

    const prevDeliveries = await this.deliveriesRepository.find({
      where: { orderId: order.id },
      order: { revisionRound: 'DESC' },
    });

    let revisionRound = 1;
    let type = createDeliveryDto.type || DeliveryType.INITIAL;

    if (prevDeliveries.length > 0) {
      const lastDelivery = prevDeliveries[0];
      if (type === DeliveryType.REVISION || type === DeliveryType.SUPPLEMENT) {
        revisionRound = lastDelivery.revisionRound + (type === DeliveryType.REVISION ? 1 : 0);
      } else if (type === DeliveryType.FINAL) {
        revisionRound = lastDelivery.revisionRound;
      } else {
        type = DeliveryType.SUPPLEMENT;
        revisionRound = lastDelivery.revisionRound;
      }
    }

    if (revisionRound > order.maxRevisionRounds) {
      throw new BadRequestException(`已超过最大修改轮次(${order.maxRevisionRounds}轮)`);
    }

    const delivery = this.deliveriesRepository.create({
      ...createDeliveryDto,
      type,
      revisionRound,
      status: DeliveryStatus.SUBMITTED,
      submitterId,
      submittedAt: new Date(),
      createdBy: submitterId,
    });

    const saved = await this.deliveriesRepository.save(delivery);

    const savedAttachments: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let matchedItems: any[] = [];

      if (validItems.length === 1) {
        matchedItems = [validItems[0]];
      } else if (files.length === 1 && validItems.length > 1) {
        matchedItems = validItems;
      } else if (files.length >= validItems.length) {
        const idx = Math.min(i, validItems.length - 1);
        matchedItems = [validItems[idx]];
      } else {
        const idx = i % validItems.length;
        matchedItems = [validItems[idx]];
      }

      for (const item of matchedItems) {
        const att = await this.attachmentsService.saveFile(file, AttachmentType.DELIVERY_FILE, submitterId, {
          deliveryId: saved.id,
          orderItemId: item.id,
          materialId: item?.materialId,
          remark: createDeliveryDto.deliveryNote,
        });
        savedAttachments.push({
          id: att.id,
          originalName: att.originalName,
          fileUrl: att.fileUrl,
          mimetype: att.mimetype,
          size: att.size,
          isKey: att.isKey,
          orderItemId: item.id,
          materialId: item?.materialId,
          materialTitle: item?.materialTitle,
        });
      }
    }

    await this.ordersService.updateStatus(order.id, OrderStatus.DELIVERING, submitterId);
    await this.timelinesService.create(
      {
        orderId: order.id,
        eventType: TimelineEventType.DELIVERY_SUBMITTED,
        title: '交付作品提交',
        description: createDeliveryDto.deliveryNote,
        operatorId: submitterId,
        operatorName: submitterName,
        operatorRole: submitterRole,
        relatedEntityId: saved.id,
        relatedEntityType: 'delivery',
        metadata: {
          revisionRound,
          deliveryType: type,
          deliveryNote: createDeliveryDto.deliveryNote,
          attachments: savedAttachments,
          attachmentCount: savedAttachments.length,
          itemIds: normalizedItemIds,
          itemCount: normalizedItemIds.length,
          fileCount: files.length,
          remark: createDeliveryDto.deliveryNote,
        },
      },
      submitterId,
    );

    return this.findOne(saved.id);
  }

  async findAll(query: QueryDeliveriesDto, userId?: string, userRole?: string) {
    const { orderId, status, type, revisionRound, page, pageSize } = query;
    const p = parseInt(page, 10) || 1;
    const ps = parseInt(pageSize, 10) || 20;

    const where: any = {};
    if (orderId) where.orderId = orderId;
    if (status) where.status = status;
    if (type) where.type = type;
    if (revisionRound) where.revisionRound = revisionRound;

    const [list, total] = await this.deliveriesRepository.findAndCount({
      where,
      relations: ['submitter', 'reviewer', 'attachments'],
      skip: (p - 1) * ps,
      take: ps,
      order: { createdAt: 'DESC' },
    });

    return { list, total, page: p, pageSize: ps };
  }

  async findByOrderId(orderId: string) {
    return this.deliveriesRepository.find({
      where: { orderId },
      relations: ['submitter', 'reviewer', 'attachments'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string) {
    const delivery = await this.deliveriesRepository.findOne({
      where: { id },
      relations: ['submitter', 'reviewer', 'attachments', 'order'],
    });
    if (!delivery) throw new NotFoundException('交付记录不存在');
    return delivery;
  }

  async review(id: string, dto: ReviewDeliveryDto, reviewerId: string, reviewerName: string, reviewerRole: string) {
    const delivery = await this.findOne(id);
    const order = delivery.order;

    if (reviewerRole !== UserRole.ADMIN && order.clientId !== reviewerId) {
      throw new ForbiddenException('只有客户可以审核交付');
    }

    if (![DeliveryStatus.SUBMITTED, DeliveryStatus.CLIENT_REVIEWING].includes(delivery.status)) {
      throw new BadRequestException('当前状态不允许审核');
    }

    delivery.status = dto.status;
    delivery.reviewerId = reviewerId;
    delivery.clientFeedback = dto.clientFeedback;
    delivery.revisionRequests = dto.revisionRequests;
    delivery.reviewedAt = new Date();
    delivery.updatedBy = reviewerId;

    let eventType: TimelineEventType;
    let eventTitle: string;
    let newOrderStatus: OrderStatus | null = null;

    if (dto.status === DeliveryStatus.ACCEPTED) {
      delivery.acceptedAt = new Date();
      eventType = TimelineEventType.DELIVERY_ACCEPTED;
      eventTitle = '交付作品已通过';
      newOrderStatus = OrderStatus.DELIVERED;
    } else if (dto.status === DeliveryStatus.REJECTED) {
      eventType = TimelineEventType.DELIVERY_REJECTED;
      eventTitle = '交付作品被退回';
      if (delivery.type !== DeliveryType.INITIAL) {
        newOrderStatus = OrderStatus.REVISING;
        order.currentRevisionRound = delivery.revisionRound;
      }
    } else {
      eventType = TimelineEventType.STATUS_CHANGED;
      eventTitle = `交付状态更新为${dto.status}`;
    }

    await this.deliveriesRepository.save(delivery);

    if (newOrderStatus) {
      await this.ordersService.updateStatus(order.id, newOrderStatus, reviewerId);
    }

    const attachmentsInfo = (delivery.attachments || []).map((att: any) => ({
      id: att.id,
      originalName: att.originalName,
      fileUrl: att.fileUrl,
      mimetype: att.mimetype,
      size: att.size,
      isKey: att.isKey,
    }));

    await this.timelinesService.create(
      {
        orderId: order.id,
        eventType,
        title: eventTitle,
        description: dto.clientFeedback || '',
        operatorId: reviewerId,
        operatorName: reviewerName,
        operatorRole: reviewerRole,
        relatedEntityId: delivery.id,
        relatedEntityType: 'delivery',
        metadata: {
          revisionRound: delivery.revisionRound,
          deliveryType: delivery.type,
          deliveryStatus: dto.status,
          clientFeedback: dto.clientFeedback,
          revisionRequests: dto.revisionRequests,
          attachments: attachmentsInfo,
          attachmentCount: attachmentsInfo.length,
          reviewerName,
          remark: dto.clientFeedback,
        },
      },
      reviewerId,
    );

    return this.findOne(id);
  }
}
