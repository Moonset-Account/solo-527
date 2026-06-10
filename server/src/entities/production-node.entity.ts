import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ProductionProgress } from './production-progress.entity';

export type NodeType = 'process' | 'quality' | 'packaging' | 'delivery';

@Entity('production_nodes')
export class ProductionNode extends BaseEntity {
  @Column({ type: 'varchar', length: 100, name: 'node_name' })
  nodeName: string;

  @Column({ type: 'varchar', length: 50, name: 'node_code', unique: true })
  nodeCode: string;

  @Column({
    type: 'enum',
    enum: ['process', 'quality', 'packaging', 'delivery'],
    default: 'process',
  })
  nodeType: NodeType;

  @Column({ type: 'text', nullable: true, name: 'node_description' })
  nodeDescription: string;

  @Column({ type: 'int', nullable: true, name: 'estimated_hours' })
  estimatedHours: number;

  @Column({ type: 'int', nullable: true, name: 'sort_order' })
  sortOrder: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'simple-json', nullable: true, name: 'threshold_config' })
  thresholdConfig: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true, name: 'extra_fields' })
  extraFields: Record<string, any>;

  @OneToMany(() => ProductionProgress, progress => progress.productionNode)
  productionProgress: ProductionProgress[];
}
