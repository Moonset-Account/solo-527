import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Demand } from './demand.entity';
import { Quote } from './quote.entity';
import { ApprovalLog } from './approval-log.entity';

export type UserRole = 'admin' | 'manager' | 'product' | 'sales' | 'finance';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  role: UserRole;

  @Column({ nullable: true, length: 100 })
  email: string;

  @Column({ nullable: true, length: 20 })
  phone: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @OneToMany(() => Demand, demand => demand.assignee)
  assignedDemands: Demand[];

  @OneToMany(() => Quote, quote => quote.createdBy)
  createdQuotes: Quote[];

  @OneToMany(() => ApprovalLog, log => log.approver)
  approvalLogs: ApprovalLog[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
