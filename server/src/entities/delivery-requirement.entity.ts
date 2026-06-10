import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Order } from './order.entity';

@Entity('delivery_requirements')
export class DeliveryRequirement extends BaseEntity {
  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @Column({ type: 'varchar', length: 100, name: 'requirement_type' })
  requirementType: string;

  @Column({ type: 'varchar', length: 500, name: 'requirement_content' })
  requirementContent: string;

  @Column({ type: 'boolean', default: false, name: 'is_mandatory' })
  isMandatory: boolean;

  @Column({ type: 'int', nullable: true, name: 'sort_order' })
  sortOrder: number;

  @Column({ type: 'simple-json', nullable: true, name: 'extra_fields' })
  extraFields: Record<string, any>;

  @ManyToOne(() => Order, order => order.deliveryRequirements)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
