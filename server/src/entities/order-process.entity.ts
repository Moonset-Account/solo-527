import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Order } from './order.entity';

@Entity('order_processes')
export class OrderProcess extends BaseEntity {
  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @Column({ type: 'varchar', length: 100, name: 'process_name' })
  processName: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'process_requirement' })
  processRequirement: string;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'equipment' })
  equipment: string;

  @Column({ type: 'int', nullable: true, name: 'sort_order' })
  sortOrder: number;

  @Column({ type: 'simple-json', nullable: true, name: 'process_params' })
  processParams: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true, name: 'extra_fields' })
  extraFields: Record<string, any>;

  @ManyToOne(() => Order, order => order.processes)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
