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

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'labor_cost' })
  laborCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'material_cost' })
  materialCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'total_cost' })
  totalCost: number;

  @Column({ length: 20, default: 'draft' })
  status: string;

  @Column({ type: 'text', nullable: true, name: 'change_reason' })
  changeReason: string | null;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Project, (project) => project.budgets)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @OneToMany(() => BudgetItem, (item) => item.budget, { cascade: true })
  items: BudgetItem[];
}
