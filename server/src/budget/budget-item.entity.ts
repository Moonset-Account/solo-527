import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Budget } from './budget.entity.js';
import { MaterialItem } from './material-item.entity.js';

@Entity('budget_items')
export class BudgetItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'budget_id' })
  budgetId: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  quantity: number;

  @Column({ length: 20, nullable: true })
  unit: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'labor_cost' })
  laborCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'total_price' })
  totalPrice: number;

  @Column({ type: 'int', default: 0 })
  sort: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Budget, (budget) => budget.items)
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @OneToMany(() => MaterialItem, (material) => material.budgetItem)
  materials: MaterialItem[];
}
