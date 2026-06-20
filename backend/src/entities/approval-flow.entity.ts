import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Contract } from './contract.entity';
import { User } from './user.entity';

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RETURNED = 'returned',
  TRANSFERRED = 'transferred',
  SKIPPED = 'skipped',
}

export enum ApprovalNodeType {
  AND = 'and',
  OR = 'or',
  SINGLE = 'single',
}

@Entity('approval_flows')
@Index(['contractId', 'stepOrder'])
@Index(['approverId', 'status'])
export class ApprovalFlow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  contractId: string;

  @Column({ type: 'varchar', length: 100, comment: '节点名称' })
  nodeName: string;

  @Column({ type: 'integer', comment: '步骤顺序' })
  stepOrder: number;

  @Column({
    type: 'enum',
    enum: ApprovalNodeType,
    default: ApprovalNodeType.SINGLE,
    comment: '节点类型',
  })
  nodeType: ApprovalNodeType;

  @Column({ type: 'uuid' })
  approverId: string;

  @Column({ type: 'uuid', nullable: true, comment: '转交后审批人ID' })
  transferredToId: string;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
    comment: '审批状态',
  })
  status: ApprovalStatus;

  @Column({ type: 'text', nullable: true, comment: '审批意见' })
  opinion: string;

  @Column({ type: 'text', nullable: true, comment: '退回原因' })
  rejectionReason: string;

  @Column({ type: 'timestamptz', nullable: true, comment: '审批时间' })
  approvedAt: Date;

  @Column({ type: 'integer', default: 0, comment: '审批耗时(小时)' })
  durationHours: number;

  @Column({ type: 'json', nullable: true, comment: '审批签名数据' })
  signature: Record<string, any>;

  @ManyToOne(() => Contract, (contract) => contract.approvalFlows, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contractId' })
  contract: Contract;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'approverId' })
  approver: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'transferredToId' })
  transferredTo: User;

  @CreateDateColumn({ type: 'timestamptz', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', comment: '更新时间' })
  updatedAt: Date;
}
