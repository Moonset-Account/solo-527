import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ExceptionType, ExceptionStatus, ExceptionPriority, RefundStatus } from '../../common/enums/exception.enum';
import { Order } from '../../modules/orders/entities/order.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Attachment } from '../../modules/attachments/entities/attachment.entity';

@Entity('exception_records')
export class ExceptionRecord extends BaseEntity {
  @Column({ unique: true, length: 32, name: 'exception_no' })
  exceptionNo: string;

  @Column({
    type: 'enum',
    enum: ExceptionType,
    default: ExceptionType.OTHER,
  })
  type: ExceptionType;

  @Column({
    type: 'enum',
    enum: ExceptionStatus,
    default: ExceptionStatus.OPEN,
  })
  status: ExceptionStatus;

  @Column({
    type: 'enum',
    enum: ExceptionPriority,
    default: ExceptionPriority.MEDIUM,
  })
  priority: ExceptionPriority;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Column({ length: 200, name: 'reporter_name' })
  reporterName: string;

  @Column({ type: 'uuid', name: 'reporter_id', nullable: true })
  reporterId: string;

  @Column({ type: 'uuid', name: 'handler_id', nullable: true })
  handlerId: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', name: 'description' })
  description: string;

  @Column({
    type: 'enum',
    enum: RefundStatus,
    default: RefundStatus.NONE,
  })
  refundStatus: RefundStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'refund_requested_amount' })
  refundRequestedAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'refund_approved_amount' })
  refundApprovedAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'refund_actual_amount' })
  refundActualAmount: number;

  @Column({ type: 'text', name: 'refund_reason', nullable: true })
  refundReason: string;

  @Column({ type: 'text', name: 'refund_evidence', nullable: true })
  refundEvidence: string;

  @Column({ type: 'timestamp', name: 'assigned_at', nullable: true })
  assignedAt: Date;

  @Column({ type: 'timestamp', name: 'resolved_at', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'timestamp', name: 'closed_at', nullable: true })
  closedAt: Date;

  @Column({ type: 'uuid', name: 'closed_by', nullable: true })
  closedBy: string;

  @Column({ type: 'text', name: 'handler_conclusion', nullable: true, comment: '知识博主处理结论' })
  handlerConclusion: string;

  @Column({ type: 'text', name: 'processing_notes', nullable: true, comment: '处理过程说明' })
  processingNotes: string;

  @Column({ type: 'text', name: 'closing_explanation', nullable: true, comment: '关闭前补充说明' })
  closingExplanation: string;

  @Column({ type: 'int', default: 0, name: 'follow_up_count' })
  followUpCount: number;

  @ManyToOne(() => Order, (order) => order.exceptions)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @ManyToOne(() => User, (user) => user.handledExceptions)
  @JoinColumn({ name: 'handler_id' })
  handler: User;

  @OneToMany(() => Attachment, (attachment) => attachment.exceptionRecord)
  attachments: Attachment[];
}
