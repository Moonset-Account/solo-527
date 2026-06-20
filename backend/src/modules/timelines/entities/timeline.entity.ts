import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { TimelineEventType } from '../../../common/enums/timeline.enum';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';

@Entity('timelines')
export class Timeline extends BaseEntity {
  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Column({
    type: 'enum',
    enum: TimelineEventType,
    default: TimelineEventType.OTHER,
  })
  eventType: TimelineEventType;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', name: 'operator_id', nullable: true })
  operatorId: string;

  @Column({ length: 100, name: 'operator_name' })
  operatorName: string;

  @Column({ length: 50, name: 'operator_role' })
  operatorRole: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'uuid', nullable: true, name: 'related_entity_id' })
  relatedEntityId: string;

  @Column({ length: 50, nullable: true, name: 'related_entity_type' })
  relatedEntityType: string;

  @ManyToOne(() => Order, (order) => order.timelines)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'operator_id' })
  operator: User;
}
