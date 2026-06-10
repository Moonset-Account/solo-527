import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Material } from './material.entity';
import { Order } from './order.entity';

@Entity('material_costs')
export class MaterialCost extends BaseEntity {
  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @Column({ name: 'material_id', type: 'uuid' })
  materialId: string;

  @Column({ type: 'varchar', length: 100, name: 'material_name' })
  materialName: string;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'material_spec' })
  materialSpec: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'quantity_used' })
  quantityUsed: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'unit' })
  unit: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'unit_cost' })
  unitCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'total_cost' })
  totalCost: number;

  @Column({ type: 'date', nullable: true, name: 'cost_date' })
  costDate: Date;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ type: 'simple-json', nullable: true, name: 'extra_fields' })
  extraFields: Record<string, any>;

  @ManyToOne(() => Material, material => material.materialCosts)
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
