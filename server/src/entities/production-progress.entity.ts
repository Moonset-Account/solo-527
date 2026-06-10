import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Order } from './order.entity';
import { ProductionNode } from './production-node.entity';
import { Team } from './team.entity';

export type ProgressStatus = 'pending' | 'in_progress' | 'completed' | 'paused' | 'delayed' | 'skipped' | 'cancelled';

@Entity('production_progress')
export class ProductionProgress extends BaseEntity {
  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @Column({ name: 'node_id', type: 'uuid', nullable: true })
  nodeId: string;

  @Column({ name: 'team_id', type: 'uuid', nullable: true })
  teamId: string;

  @Column({ type: 'varchar', length: 100, name: 'node_name' })
  nodeName: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'in_progress', 'completed', 'paused', 'delayed', 'skipped', 'cancelled'],
    default: 'pending',
  })
  status: ProgressStatus;

  @Column({ type: 'timestamp', nullable: true, name: 'start_time' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'end_time' })
  endTime: Date;

  @Column({ type: 'int', nullable: true, name: 'planned_quantity' })
  plannedQuantity: number;

  @Column({ type: 'int', nullable: true, name: 'completed_quantity' })
  completedQuantity: number;

  @Column({ type: 'int', nullable: true, name: 'defect_quantity' })
  defectQuantity: number;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ type: 'int', nullable: true, name: 'sort_order' })
  sortOrder: number;

  @Column({ type: 'simple-json', nullable: true, name: 'progress_data' })
  progressData: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true, name: 'extra_fields' })
  extraFields: Record<string, any>;

  @ManyToOne(() => Order, order => order.productionProgress)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => ProductionNode, node => node.productionProgress)
  @JoinColumn({ name: 'node_id' })
  productionNode: ProductionNode;

  @ManyToOne(() => Team, team => team.productionProgress)
  @JoinColumn({ name: 'team_id' })
  team: Team;
}
