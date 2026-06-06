import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Contract } from './contract.entity';
import { User } from './user.entity';

export type ApprovalAction = 'submit' | 'approve' | 'reject';

@Entity('approval_logs')
export class ApprovalLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Contract, contract => contract.approvalLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @Column({ name: 'contract_id', nullable: true })
  contractId: string;

  @ManyToOne(() => User, user => user.approvalLogs)
  @JoinColumn({ name: 'approver_id' })
  approver: User;

  @Column({ name: 'approver_id', nullable: true })
  approverId: string;

  @Column({ type: 'varchar', length: 20 })
  action: ApprovalAction;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
