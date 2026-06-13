import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Company } from '../common/company.entity.js';
import { Customer } from '../common/customer.entity.js';
import { Budget } from '../budget/budget.entity.js';
import { Contract } from '../contract/contract.entity.js';
import { ProjectPhoto } from '../file/project-photo.entity.js';
import { Attachment } from '../file/attachment.entity.js';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 500, nullable: true })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area: number;

  @Column({ length: 50, nullable: true })
  style: string;

  @Column({ length: 20, default: 'draft' })
  status: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  budget: number;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @OneToMany(() => Budget, (budget) => budget.project)
  budgets: Budget[];

  @OneToMany(() => Contract, (contract) => contract.project)
  contracts: Contract[];

  @OneToMany(() => ProjectPhoto, (photo) => photo.project)
  photos: ProjectPhoto[];

  @OneToMany(() => Attachment, (attachment) => attachment.project)
  attachments: Attachment[];
}
