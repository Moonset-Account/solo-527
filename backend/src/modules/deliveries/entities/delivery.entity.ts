import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { DeliveryStatus, DeliveryType } from '../../common/enums/delivery.enum';
import { Order } from '../../modules/orders/entities/order.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Attachment } from '../../modules/attachments/entities/attachment.entity';

@Entity('deliveries')
export class Delivery extends BaseEntity {
  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Column({
    type: 'enum',
    enum: DeliveryType,
    default: DeliveryType.INITIAL,
  })
  type: DeliveryType;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
  })
  status: DeliveryStatus;

  @Column({ type: 'int', default: 1, name: 'revision_round' })
  revisionRound: number;

  @Column({ type: 'uuid', name: 'submitter_id', nullable: true })
  submitterId: string;

  @Column({ type: 'text', name: 'delivery_note' })
  deliveryNote: string;

  @Column({ type: 'text', name: 'client_feedback', nullable: true })
  clientFeedback: string;

  @Column({ type: 'json', nullable: true, name: 'revision_requests' })
  revisionRequests: Record<string, any>[];

  @Column({ type: 'timestamp', name: 'submitted_at', nullable: true })
  submittedAt: Date;

  @Column({ type: 'timestamp', name: 'reviewed_at', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'timestamp', name: 'accepted_at', nullable: true })
  acceptedAt: Date;

  @Column({ type: 'uuid', name: 'reviewer_id', nullable: true })
  reviewerId: string;

  @ManyToOne(() => Order, (order) => order.deliveries)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'submitter_id' })
  submitter: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @OneToMany(() => Attachment, (attachment) => attachment.delivery)
  attachments: Attachment[];
}
