import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BudgetItem } from './budget-item.entity.js';

@Entity('material_items')
export class MaterialItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'budget_item_id' })
  budgetItemId: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 100, nullable: true })
  brand: string;

  @Column({ length: 200, nullable: true })
  specification: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  quantity: number;

  @Column({ length: 20, nullable: true })
  unit: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'total_price' })
  totalPrice: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => BudgetItem, (item) => item.materials)
  @JoinColumn({ name: 'budget_item_id' })
  budgetItem: BudgetItem;
}
