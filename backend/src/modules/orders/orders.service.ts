import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import {
  Order,
  OrderDocument,
  OrderStatus,
  OnTimeRecord,
  SupplyDemandReason,
  AddressSnapshot,
} from '../../schemas/order.schema';

export type RescheduleLog = any;
export type CancelLog = any;
import { Service, ServiceDocument } from '../../schemas/service.schema';
import { Worker, WorkerDocument } from '../../schemas/worker.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { Address, AddressDocument } from '../../schemas/address.schema';
import { Review, ReviewDocument } from '../../schemas/review.schema';
import {
  CreateOrderDto,
  QueryOrdersDto,
  DispatchOrderDto,
  RescheduleOrderDto,
  CancelOrderDto,
  UpdateFulfillmentDto,
  BatchQueryDto,
  MarkSupplyDemandReasonDto,
} from './dto/orders.dto';
import { createHash } from 'crypto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(Worker.name) private workerModel: Model<WorkerDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private generateOrderNo(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `HK${timestamp}${random}`;
  }

  private isOnTime(scheduledAt: Date, actualAt: Date): boolean {
    const scheduled = new Date(scheduledAt).getTime();
    const actual = new Date(actualAt).getTime();
    const diff = Math.abs(actual - scheduled);
    const fifteenMinutes = 15 * 60 * 1000;
    return diff <= fifteenMinutes;
  }

  private generateCacheKey(prefix: string, data: Record<string, any>): string {
    const hash = createHash('md5').update(JSON.stringify(data)).digest('hex');
    return `orders:${prefix}:${hash}`;
  }

  private clearOrderRelatedCache(): void {
    this.cacheManager.store.keys('orders:*').then((keys: string[]) => {
      keys.forEach((key: string) => {
        this.cacheManager.del(key);
      });
    });
  }

  private createAddressSnapshot(address: AddressDocument): AddressSnapshot {
    return {
      contactName: address.contactName,
      phone: address.phone,
      province: address.province,
      city: address.city,
      district: address.district,
      community: address.community,
      detail: address.detail,
      lng: address.lng,
      lat: address.lat,
    };
  }

  async createOrder(dto: CreateOrderDto): Promise<OrderDocument> {
    const service = await this.serviceModel.findById(dto.serviceId);
    if (!service) {
      throw new HttpException('服务不存在', HttpStatus.NOT_FOUND);
    }
    if (!service.enabled) {
      throw new HttpException('该服务未启用', HttpStatus.BAD_REQUEST);
    }

    const user = await this.userModel.findById(dto.userId);
    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    }

    const address = await this.addressModel.findById(dto.addressId);
    if (!address) {
      throw new HttpException('地址不存在', HttpStatus.NOT_FOUND);
    }

    const orderNo = await this.generateUniqueOrderNo();

    const scheduledAt = new Date(dto.scheduledAt);
    const duration = service.duration;
    const scheduledEndAt = new Date(scheduledAt.getTime() + duration * 60 * 1000);

    const order = new this.orderModel({
      orderNo,
      userId: dto.userId,
      serviceId: dto.serviceId,
      addressId: dto.addressId,
      addressSnapshot: this.createAddressSnapshot(address),
      status: 'pending' as OrderStatus,
      scheduledAt,
      scheduledEndAt,
      duration,
      price: service.price,
      community: address.community || '',
      remark: dto.remark || '',
      supplyDemandReason: dto.supplyDemandReason || 'none',
      onTimeRecord: {
        scheduled: this.isOnTime(scheduledAt, scheduledAt),
        arrived: false,
        completed: false,
      } as OnTimeRecord,
    });

    const savedOrder = await order.save();
    this.clearOrderRelatedCache();
    return savedOrder;
  }

  private async generateUniqueOrderNo(): Promise<string> {
    let orderNo: string;
    let exists: OrderDocument | null;
    let attempts = 0;
    do {
      orderNo = this.generateOrderNo();
      exists = await this.orderModel.findOne({ orderNo });
      attempts++;
      if (attempts > 10) {
        throw new HttpException('生成订单号失败，请稍后重试', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } while (exists);
    return orderNo;
  }

  async queryOrders(dto: QueryOrdersDto): Promise<{
    list: OrderDocument[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const filter: FilterQuery<OrderDocument> = {};

    if (dto.status) {
      filter.status = Array.isArray(dto.status) ? { $in: dto.status } : dto.status;
    }

    if (dto.startTime || dto.endTime) {
      filter.scheduledAt = {};
      if (dto.startTime) {
        filter.scheduledAt.$gte = new Date(dto.startTime);
      }
      if (dto.endTime) {
        filter.scheduledAt.$lte = new Date(dto.endTime);
      }
    }

    if (dto.community) {
      filter.community = dto.community;
    } else if (dto.communities && dto.communities.length > 0) {
      filter.community = { $in: dto.communities };
    }

    if (dto.workerId) {
      filter.workerId = dto.workerId;
    }

    if (dto.userId) {
      filter.userId = dto.userId;
    }

    if (dto.supplyDemandReason) {
      filter.supplyDemandReason = dto.supplyDemandReason;
    }

    const cacheKey = this.generateCacheKey('list', { filter, page, pageSize });
    const cached = await this.cacheManager.get<{
      list: OrderDocument[];
      total: number;
      page: number;
      pageSize: number;
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    const [list, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('serviceId', 'name category price unit duration')
        .populate('workerId', 'name phone rating status community')
        .populate('userId', 'name phone level avatar')
        .populate('addressId', 'contactName phone province city district community detail lng lat')
        .exec(),
      this.orderModel.countDocuments(filter).exec(),
    ]);

    const result = { list, total, page, pageSize };
    await this.cacheManager.set(cacheKey, result, 60);
    return result;
  }

  async getOrderDetail(orderId: Types.ObjectId): Promise<any> {
    const cacheKey = this.generateCacheKey('detail', { orderId: orderId.toString() });
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const order = await this.orderModel
      .findById(orderId)
      .populate('serviceId', 'name category price unit description duration')
      .populate('workerId', 'name phone rating skills status community idCard hireDate')
      .populate('userId', 'name phone level avatar')
      .populate('addressId', 'contactName phone province city district community detail lng lat isDefault')
      .exec();

    if (!order) {
      throw new HttpException('订单不存在', HttpStatus.NOT_FOUND);
    }

    const review = await this.reviewModel
      .findOne({ orderId })
      .select('rating tags content reply followUpStatus followUpContent followUpBy followUpAt createdAt')
      .exec();

    const result = {
      ...order.toObject(),
      review,
    };

    await this.cacheManager.set(cacheKey, result, 120);
    return result;
  }

  async dispatchOrder(dto: DispatchOrderDto): Promise<OrderDocument> {
    const order = await this.orderModel.findById(dto.orderId);
    if (!order) {
      throw new HttpException('订单不存在', HttpStatus.NOT_FOUND);
    }

    if (order.status !== 'pending' && order.status !== 'rescheduled') {
      throw new HttpException(`当前订单状态为 ${order.status}，无法派单`, HttpStatus.BAD_REQUEST);
    }

    const worker = await this.workerModel.findById(dto.workerId);
    if (!worker) {
      throw new HttpException('师傅不存在', HttpStatus.NOT_FOUND);
    }

    if (worker.status !== 'on') {
      throw new HttpException('师傅当前未上线，无法接单', HttpStatus.BAD_REQUEST);
    }

    const hasSkill = worker.skills.some(
      (skillId) => skillId.toString() === order.serviceId.toString(),
    );
    if (!hasSkill) {
      throw new HttpException('该师傅不具备此服务所需技能', HttpStatus.BAD_REQUEST);
    }

    const hasConflict = await this.checkWorkerTimeConflict(dto.workerId, order.scheduledAt, order.duration, order._id);
    if (hasConflict) {
      throw new HttpException('该师傅在此时间段已有订单安排', HttpStatus.BAD_REQUEST);
    }

    order.workerId = dto.workerId;
    order.status = 'dispatched' as OrderStatus;
    order.operator = dto.operator?.name || 'system';
    const updatedOrder = await order.save();

    this.clearOrderRelatedCache();
    return updatedOrder;
  }

  private async checkWorkerTimeConflict(
    workerId: Types.ObjectId,
    scheduledAt: Date,
    duration: number,
    excludeOrderId?: Types.ObjectId,
  ): Promise<boolean> {
    const scheduledTime = new Date(scheduledAt).getTime();
    const startTime = scheduledTime - duration * 60 * 1000;
    const endTime = scheduledTime + duration * 60 * 1000;

    const filter: FilterQuery<OrderDocument> = {
      workerId,
      status: { $in: ['dispatched', 'arrived', 'inProgress'] as OrderStatus[] },
      scheduledAt: {
        $gte: new Date(startTime),
        $lte: new Date(endTime),
      },
    };

    if (excludeOrderId) {
      filter._id = { $ne: excludeOrderId };
    }

    const conflictOrders = await this.orderModel.find(filter).exec();
    return conflictOrders.length > 0;
  }

  async rescheduleOrder(dto: RescheduleOrderDto): Promise<OrderDocument> {
    const order = await this.orderModel.findById(dto.orderId);
    if (!order) {
      throw new HttpException('订单不存在', HttpStatus.NOT_FOUND);
    }

    const nonReschedulableStatuses: OrderStatus[] = ['completed', 'cancelled'];
    if (nonReschedulableStatuses.includes(order.status)) {
      throw new HttpException(
        `当前订单状态为 ${order.status}，无法改约`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!dto.reason || dto.reason.trim() === '') {
      throw new HttpException('请填写改约原因', HttpStatus.BAD_REQUEST);
    }

    const oldScheduledAt = order.scheduledAt;
    const newScheduledAt = new Date(dto.newScheduledAt);
    const duration = order.duration;
    const newScheduledEndAt = new Date(newScheduledAt.getTime() + duration * 60 * 1000);

    if (order.workerId) {
      const hasConflict = await this.checkWorkerTimeConflict(
        order.workerId,
        newScheduledAt,
        duration,
        order._id,
      );
      if (hasConflict) {
        throw new HttpException('该师傅在新预约时间段已有订单安排', HttpStatus.BAD_REQUEST);
      }
    }

    order.scheduledAt = newScheduledAt;
    order.scheduledEndAt = newScheduledEndAt;
    order.rescheduleCount = (order.rescheduleCount || 0) + 1;
    order.rescheduleReason = dto.reason;
    order.operator = dto.operator?.name || 'system';

    if (order.status === 'inProgress' || order.status === 'arrived') {
      order.status = 'dispatched' as OrderStatus;
      order.actualArrivedAt = undefined;
      order.actualStartedAt = undefined;
      order.onTimeRecord = {
        scheduled: this.isOnTime(newScheduledAt, newScheduledAt),
        arrived: false,
        completed: false,
      } as OnTimeRecord;
    } else if (order.status === 'dispatched') {
      order.status = 'dispatched' as OrderStatus;
    } else {
      order.status = 'rescheduled' as OrderStatus;
    }

    const updatedOrder = await order.save();
    this.clearOrderRelatedCache();
    return updatedOrder;
  }

  async cancelOrder(dto: CancelOrderDto): Promise<OrderDocument> {
    const order = await this.orderModel.findById(dto.orderId);
    if (!order) {
      throw new HttpException('订单不存在', HttpStatus.NOT_FOUND);
    }

    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new HttpException(
        `当前订单状态为 ${order.status}，无法取消`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!dto.reason || dto.reason.trim() === '') {
      throw new HttpException('请填写取消原因', HttpStatus.BAD_REQUEST);
    }

    order.status = 'cancelled' as OrderStatus;
    order.cancelReason = dto.reason;
    order.operator = dto.operator?.name || 'system';

    const updatedOrder = await order.save();
    this.clearOrderRelatedCache();
    return updatedOrder;
  }

  async markArrived(dto: UpdateFulfillmentDto): Promise<OrderDocument> {
    const order = await this.orderModel.findById(dto.orderId);
    if (!order) {
      throw new HttpException('订单不存在', HttpStatus.NOT_FOUND);
    }

    if (order.status !== 'dispatched') {
      throw new HttpException(
        `当前订单状态为 ${order.status}，需先派单后才能标记到场`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const actualArrivedAt = new Date();
    order.actualArrivedAt = actualArrivedAt;
    order.status = 'arrived' as OrderStatus;
    order.onTimeRecord = {
      ...order.onTimeRecord,
      arrived: this.isOnTime(order.scheduledAt, actualArrivedAt),
    } as OnTimeRecord;

    const updatedOrder = await order.save();
    this.clearOrderRelatedCache();
    return updatedOrder;
  }

  async markStarted(dto: UpdateFulfillmentDto): Promise<OrderDocument> {
    const order = await this.orderModel.findById(dto.orderId);
    if (!order) {
      throw new HttpException('订单不存在', HttpStatus.NOT_FOUND);
    }

    if (order.status !== 'arrived') {
      throw new HttpException(
        `当前订单状态为 ${order.status}，需先标记到场后才能开始服务`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const actualStartedAt = new Date();
    order.actualStartedAt = actualStartedAt;
    order.status = 'inProgress' as OrderStatus;

    const updatedOrder = await order.save();
    this.clearOrderRelatedCache();
    return updatedOrder;
  }

  async markCompleted(dto: UpdateFulfillmentDto): Promise<OrderDocument> {
    const order = await this.orderModel.findById(dto.orderId);
    if (!order) {
      throw new HttpException('订单不存在', HttpStatus.NOT_FOUND);
    }

    if (order.status !== 'inProgress') {
      throw new HttpException(
        `当前订单状态为 ${order.status}，需先标记开始服务后才能完成`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const actualCompletedAt = new Date();
    order.actualCompletedAt = actualCompletedAt;
    order.status = 'completed' as OrderStatus;
    order.onTimeRecord = {
      ...order.onTimeRecord,
      completed: this.isOnTime(order.scheduledEndAt || order.scheduledAt, actualCompletedAt),
    } as OnTimeRecord;

    const updatedOrder = await order.save();
    this.clearOrderRelatedCache();
    return updatedOrder;
  }

  async batchQuery(dto: BatchQueryDto): Promise<OrderDocument[]> {
    const filter: FilterQuery<OrderDocument> = {};

    if (dto.addressIds && dto.addressIds.length > 0) {
      filter.addressId = { $in: dto.addressIds };
    }

    if (dto.communities && dto.communities.length > 0) {
      filter.community = { $in: dto.communities };
    }

    if (dto.timeRange) {
      filter.scheduledAt = {
        $gte: new Date(dto.timeRange.startTime),
        $lte: new Date(dto.timeRange.endTime),
      };
    }

    if (Object.keys(filter).length === 0) {
      throw new HttpException('请至少提供一个查询条件（addressIds、communities 或 timeRange）', HttpStatus.BAD_REQUEST);
    }

    const cacheKey = this.generateCacheKey('batch', filter);
    const cached = await this.cacheManager.get<OrderDocument[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const orders = await this.orderModel
      .find(filter)
      .sort({ scheduledAt: 1 })
      .populate('serviceId', 'name category price')
      .populate('workerId', 'name phone')
      .populate('userId', 'name phone')
      .populate('addressId', 'contactName phone province city district community detail')
      .exec();

    await this.cacheManager.set(cacheKey, orders, 180);
    return orders;
  }

  async markSupplyDemandReason(dto: MarkSupplyDemandReasonDto): Promise<OrderDocument> {
    const order = await this.orderModel.findById(dto.orderId);
    if (!order) {
      throw new HttpException('订单不存在', HttpStatus.NOT_FOUND);
    }

    const validReasons: SupplyDemandReason[] = [
      'worker_shortage',
      'peak_hours',
      'address_remote',
      'none',
    ];
    if (!validReasons.includes(dto.supplyDemandReason)) {
      throw new HttpException('无效的供需原因类型', HttpStatus.BAD_REQUEST);
    }

    order.supplyDemandReason = dto.supplyDemandReason;
    const updatedOrder = await order.save();
    this.clearOrderRelatedCache();
    return updatedOrder;
  }
}
