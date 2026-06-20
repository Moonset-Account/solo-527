import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from './entities/delivery.entity';
import { CreateDeliveryDto, ReviewDeliveryDto, QueryDeliveriesDto } from './dto/delivery.dto';
import { DeliveryStatus, DeliveryType } from '../../common/enums/delivery.enum';
import { OrderStatus } from '../../common/enums/order.enum';
import { UserRole } from '../../common/enums/user.enum';
import { OrdersService } from '../orders/orders.service';
import { TimelinesService } from '../timelines/timelines.service';
import { TimelineEventType } from '../../common/enums/timeline.enum';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private deliveriesRepository: Repository<Delivery>,
    private ordersService: OrdersService,
    private timelinesService: TimelinesService,
  ) {}

  async create(createDeliveryDto: CreateDeliveryDto, submitterId: string, submitterName: string, submitterRole: string) {
    const order = await this.ordersService.findOne(createDeliveryDto.orderId);

    if (submitterRole !== UserRole.ADMIN && order.photographerId !== submitterId) {
      throw new ForbiddenException('只有摄影师可以提交交付');
    }

    if (![OrderStatus.SELECTED_CONFIRMED, OrderStatus.REVISING, OrderStatus.DELIVERING].includes(order.status)) {
      throw new BadRequestException('当前订单状态不允许提交交付');
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

    await this.ordersService.updateStatus(order.id, OrderStatus.DELIVERING, submitterId);
    await this.timelinesService.create(
      {
        orderId: order.id,
        eventType: TimelineEventType.DELIVERY_SUBMITTED,
        title: '交付作品提交',
        description: `第${revisionRound}轮作品交付已提交: ${createDeliveryDto.deliveryNote}`,
        operatorId: submitterId,
        operatorName: submitterName,
        operatorRole: submitterRole,
        relatedEntityId: saved.id,
        relatedEntityType: 'delivery',
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
      },
      reviewerId,
    );

    return this.findOne(id);
  }
}
