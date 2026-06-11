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
import { Project } from '../project/project.entity.js';
import { BudgetItem } from './budget-item.entity.js';

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column()
  version: number;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'management_fee' })
  managementFee: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'design_fee' })
  designFee: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'tax_amount' })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'total_amount' })
  totalAmount: number;

  @Column({ length: 20, default: 'draft' })
  status: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Project, (project) => project.budgets)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @OneToMany(() => BudgetItem, (item) => item.budget)
  items: BudgetItem[];
}
