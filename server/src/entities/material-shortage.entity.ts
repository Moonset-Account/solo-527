import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Order } from './order.entity';
import { Material } from './material.entity';

export type ShortageStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';

@Entity('material_shortages')
export class MaterialShortage extends BaseEntity {
  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @Column({ name: 'material_id', type: 'uuid' })
  materialId: string;

  @Column({ type: 'varchar', length: 100, name: 'material_name' })
  materialName: string;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'material_spec' })
  materialSpec: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'required_quantity' })
  requiredQuantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'available_quantity' })
  availableQuantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'shortage_quantity' })
  shortageQuantity: number;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  })
  impactLevel: ImpactLevel;

  @Column({ type: 'text', name: 'impact_scope' })
  impactScope: string;

  @Column({ type: 'varchar', length: 100, name: 'responsible_person' })
  responsiblePerson: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'responsible_phone' })
  responsiblePhone: string;

  @Column({ type: 'text', name: 'resolution_path' })
  resolutionPath: string;

  @Column({ type: 'timestamp', nullable: true, name: 'expected_resolution_time' })
  expectedResolutionTime: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'actual_resolution_time' })
  actualResolutionTime: Date;

  @Column({
    type: 'enum',
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
  })
  status: ShortageStatus;

  @Column({ type: 'text', nullable: true, name: 'resolution_result' })
  resolutionResult: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ type: 'simple-json', nullable: true, name: 'extra_fields' })
  extraFields: Record<string, any>;

  @ManyToOne(() => Order, order => order.materialShortages)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Material)
  @JoinColumn({ name: 'material_id' })
  material: Material;
}
