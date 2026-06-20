import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Settlement } from './entities/settlement.entity';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { CreateSettlementDto, ConfirmSettlementDto, PaySettlementDto, QuerySettlementsDto } from './dto/settlement.dto';
import { SettlementStatus, SettlementType } from '../../common/enums/settlement.enum';
import { OrderStatus } from '../../common/enums/order.enum';
import { UserRole } from '../../common/enums/user.enum';

@Injectable()
export class SettlementsService {
  constructor(
    @InjectRepository(Settlement)
    private settlementsRepository: Repository<Settlement>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  private generateSettlementNo(): string {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SET${dateStr}${random}`;
  }

  async create(dto: CreateSettlementDto, operatorId: string) {
    const photographer = await this.usersRepository.findOne({ where: { id: dto.photographerId } });
    if (!photographer) throw new NotFoundException('摄影师不存在');

    let orders: Order[] = [];
    if (dto.orderId) {
      const order = await this.ordersRepository.findOne({ where: { id: dto.orderId } });
      if (!order) throw new NotFoundException('订单不存在');
      orders = [order];
    } else {
      const [year, month] = dto.settlementPeriod.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      orders = await this.ordersRepository.find({
        where: {
          photographerId: dto.photographerId,
          status: In([OrderStatus.DELIVERED, OrderStatus.COMPLETED]) as any,
          completedAt: Between(startDate, endDate),
        },
      });
    }

    const orderAmount = orders.reduce((sum, o) => sum + parseFloat(o.finalAmount.toString()), 0);
    const settlementRatio = photographer.settlementRatio || 0.7;
    const grossAmount = parseFloat((orderAmount * settlementRatio).toFixed(2));
    const adjustmentAmount = dto.adjustmentAmount || 0;
    const deductionAmount = dto.deductionAmount || 0;
    const netAmount = parseFloat((grossAmount - deductionAmount + adjustmentAmount).toFixed(2));

    const settlement = this.settlementsRepository.create({
      settlementNo: this.generateSettlementNo(),
      type: dto.type || SettlementType.NORMAL,
      status: SettlementStatus.PENDING,
      photographerId: dto.photographerId,
      orderId: dto.orderId || null,
      settlementPeriod: dto.settlementPeriod,
      orderAmount,
      refundAmount: 0,
      settlementRatio,
      grossAmount,
      deductionAmount,
      adjustmentAmount,
      netAmount,
      orderCount: orders.length,
      remark: dto.remark,
      createdBy: operatorId,
    });

    return this.settlementsRepository.save(settlement);
  }

  async createMonthly(photographerId: string, period: string, operatorId: string) {
    const existing = await this.settlementsRepository.findOne({
      where: { photographerId, settlementPeriod: period, type: SettlementType.NORMAL },
    });
    if (existing) {
      throw new BadRequestException('该周期结算已存在');
    }
    return this.create(
      { photographerId, settlementPeriod: period },
      operatorId,
    );
  }

  async findAll(query: QuerySettlementsDto, userId?: string, userRole?: string) {
    const { photographerId, orderId, status, type, settlementPeriod, startDate, endDate, page, pageSize } = query;
    const p = parseInt(page, 10) || 1;
    const ps = parseInt(pageSize, 10) || 20;

    const where: any = {};
    if (photographerId) where.photographerId = photographerId;
    if (orderId) where.orderId = orderId;
    if (status) where.status = status;
    if (type) where.type = type;
    if (settlementPeriod) where.settlementPeriod = settlementPeriod;
    if (startDate && endDate) where.createdAt = Between(new Date(startDate), new Date(endDate));

    if (userRole === UserRole.PHOTOGRAPHER && userId) {
      where.photographerId = userId;
    }

    const [list, total] = await this.settlementsRepository.findAndCount({
      where,
      relations: ['photographer', 'order'],
      skip: (p - 1) * ps,
      take: ps,
      order: { createdAt: 'DESC' },
    });

    return { list, total, page: p, pageSize: ps };
  }

  async findOne(id: string) {
    const settlement = await this.settlementsRepository.findOne({
      where: { id },
      relations: ['photographer', 'order'],
    });
    if (!settlement) throw new NotFoundException('结算单不存在');
    return settlement;
  }

  async confirm(id: string, dto: ConfirmSettlementDto, operatorId: string) {
    const settlement = await this.findOne(id);
    if (settlement.status !== SettlementStatus.PENDING) {
      throw new BadRequestException('只有待确认状态可以确认');
    }
    settlement.status = SettlementStatus.CONFIRMED;
    settlement.confirmedAt = new Date();
    settlement.confirmedBy = operatorId;
    if (dto.remark) settlement.remark = dto.remark;
    settlement.updatedBy = operatorId;
    return this.settlementsRepository.save(settlement);
  }

  async pay(id: string, dto: PaySettlementDto, operatorId: string) {
    const settlement = await this.findOne(id);
    if (![SettlementStatus.CONFIRMED, SettlementStatus.PROCESSING].includes(settlement.status)) {
      throw new BadRequestException('当前状态不允许付款');
    }
    settlement.status = SettlementStatus.PAID;
    settlement.paidAt = new Date();
    settlement.paidBy = operatorId;
    settlement.paymentProofUrl = dto.paymentProofUrl;
    settlement.bankAccountInfo = dto.bankAccountInfo || settlement.bankAccountInfo;
    if (dto.remark) settlement.remark = dto.remark;
    settlement.updatedBy = operatorId;
    return this.settlementsRepository.save(settlement);
  }

  async cancel(id: string, remark: string, operatorId: string) {
    const settlement = await this.findOne(id);
    if (settlement.status === SettlementStatus.PAID) {
      throw new BadRequestException('已付款的结算单不能取消');
    }
    settlement.status = SettlementStatus.CANCELLED;
    settlement.remark = remark || settlement.remark;
    settlement.updatedBy = operatorId;
    return this.settlementsRepository.save(settlement);
  }

  async getSummary(photographerId?: string, period?: string) {
    const where: any = { status: SettlementStatus.PAID };
    if (photographerId) where.photographerId = photographerId;
    if (period) where.settlementPeriod = period;

    const settlements = await this.settlementsRepository.find({ where });
    return {
      totalCount: settlements.length,
      totalNetAmount: settlements.reduce((s, x) => s + parseFloat(x.netAmount.toString()), 0),
      totalGrossAmount: settlements.reduce((s, x) => s + parseFloat(x.grossAmount.toString()), 0),
      totalOrderAmount: settlements.reduce((s, x) => s + parseFloat(x.orderAmount.toString()), 0),
      totalOrderCount: settlements.reduce((s, x) => s + x.orderCount, 0),
    };
  }
}
