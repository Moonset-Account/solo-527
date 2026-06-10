import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MaterialCost } from './material-cost.entity';

export type MaterialCategory = 'paper' | 'ink' | 'plate' | 'chemical' | 'packaging' | 'other';

@Entity('materials')
export class Material extends BaseEntity {
  @Column({ type: 'varchar', length: 100, name: 'material_name' })
  materialName: string;

  @Column({ type: 'varchar', length: 50, name: 'material_code', unique: true })
  materialCode: string;

  @Column({
    type: 'enum',
    enum: ['paper', 'ink', 'plate', 'chemical', 'packaging', 'other'],
    default: 'other',
  })
  category: MaterialCategory;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'material_spec' })
  materialSpec: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'stock_unit' })
  stockUnit: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'safety_stock' })
  safetyStock: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'current_stock' })
  currentStock: number;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'supplier' })
  supplier: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'simple-json', nullable: true, name: 'threshold_config' })
  thresholdConfig: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true, name: 'extra_fields' })
  extraFields: Record<string, any>;

  @OneToMany(() => MaterialCost, cost => cost.material)
  materialCosts: MaterialCost[];
}
