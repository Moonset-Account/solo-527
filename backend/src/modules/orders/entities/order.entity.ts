import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { OrderStatus, SatisfactionLevel, PaymentMethod } from '../../../common/enums/order.enum';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';
import { Delivery } from '../../deliveries/entities/delivery.entity';
import { Settlement } from '../../settlements/entities/settlement.entity';
import { ExceptionRecord } from '../../exceptions/entities/exception-record.entity';
import { Timeline } from '../../timelines/entities/timeline.entity';

@Entity('orders')
export class Order extends BaseEntity {
  @Column({ unique: true, length: 32, name: 'order_no' })
  orderNo: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING_PAYMENT,
  })
  status: OrderStatus;

  @Column({ type: 'uuid', name: 'client_id' })
  clientId: string;

  @Column({ type: 'uuid', name: 'photographer_id' })
  photographerId: string;

  @ManyToOne(() => User, (user) => user.clientOrders)
  @JoinColumn({ name: 'client_id' })
  client: User;

  @ManyToOne(() => User, (user) => user.photographerOrders)
  @JoinColumn({ name: 'photographer_id' })
  photographer: User;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'discount_amount' })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'final_amount' })
  finalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'photographer_income' })
  photographerIncome: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'platform_income' })
  platformIncome: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  paymentMethod: PaymentMethod;

  @Column({ type: 'timestamp', name: 'paid_at', nullable: true })
  paidAt: Date;

  @Column({ type: 'int', default: 3, name: 'max_revision_rounds' })
  maxRevisionRounds: number;

  @Column({ type: 'int', default: 0, name: 'current_revision_round' })
  currentRevisionRound: number;

  @Column({
    type: 'enum',
    enum: SatisfactionLevel,
    nullable: true,
  })
  satisfactionLevel: SatisfactionLevel;

  @Column({ type: 'text', name: 'satisfaction_feedback', nullable: true })
  satisfactionFeedback: string;

  @Column({ type: 'timestamp', name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', name: 'deadline_at', nullable: true })
  deadlineAt: Date;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => Delivery, (delivery) => delivery.order)
  deliveries: Delivery[];

  @OneToMany(() => Settlement, (settlement) => settlement.order)
  settlements: Settlement[];

  @OneToMany(() => ExceptionRecord, (ex) => ex.order)
  exceptions: ExceptionRecord[];

  @OneToMany(() => Timeline, (timeline) => timeline.order)
  timelines: Timeline[];
}
