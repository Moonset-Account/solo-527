import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { SettlementStatus, SettlementType } from '../../common/enums/settlement.enum';
import { User } from '../../modules/users/entities/user.entity';
import { Order } from '../../modules/orders/entities/order.entity';

@Entity('settlements')
export class Settlement extends BaseEntity {
  @Column({ unique: true, length: 32, name: 'settlement_no' })
  settlementNo: string;

  @Column({
    type: 'enum',
    enum: SettlementType,
    default: SettlementType.NORMAL,
  })
  type: SettlementType;

  @Column({
    type: 'enum',
    enum: SettlementStatus,
    default: SettlementStatus.PENDING,
  })
  status: SettlementStatus;

  @Column({ type: 'uuid', name: 'photographer_id' })
  photographerId: string;

  @Column({ type: 'uuid', name: 'order_id', nullable: true })
  orderId: string;

  @Column({ length: 64, name: 'settlement_period', comment: '结算周期 YYYY-MM' })
  settlementPeriod: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'order_amount', default: 0 })
  orderAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'refund_amount', default: 0 })
  refundAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, name: 'settlement_ratio' })
  settlementRatio: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'gross_amount' })
  grossAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'deduction_amount' })
  deductionAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'adjustment_amount' })
  adjustmentAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'net_amount' })
  netAmount: number;

  @Column({ type: 'int', default: 0, name: 'order_count' })
  orderCount: number;

  @Column({ type: 'timestamp', name: 'confirmed_at', nullable: true })
  confirmedAt: Date;

  @Column({ type: 'uuid', name: 'confirmed_by', nullable: true })
  confirmedBy: string;

  @Column({ type: 'timestamp', name: 'paid_at', nullable: true })
  paidAt: Date;

  @Column({ type: 'uuid', name: 'paid_by', nullable: true })
  paidBy: string;

  @Column({ type: 'text', name: 'payment_proof_url', nullable: true })
  paymentProofUrl: string;

  @Column({ type: 'text', name: 'bank_account_info', nullable: true })
  bankAccountInfo: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @ManyToOne(() => User, (user) => user.settlements)
  @JoinColumn({ name: 'photographer_id' })
  photographer: User;

  @ManyToOne(() => Order, (order) => order.settlements)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
