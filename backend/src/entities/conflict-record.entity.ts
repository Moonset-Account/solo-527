import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Contract } from './contract.entity';
import { User } from './user.entity';

export enum ConflictStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  RESOLVING = 'resolving',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
  CLOSED = 'closed',
}

export enum ConflictSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ConflictType {
  NUMBER_CONFLICT = 'number_conflict',
  FILE_LOCK = 'file_lock',
  AMOUNT_DISCREPANCY = 'amount_discrepancy',
  PARTY_CONFLICT = 'party_conflict',
  DATE_OVERLAP = 'date_overlap',
  DEADLOCK = 'deadlock',
  PERMISSION_DENIED = 'permission_denied',
  OTHER = 'other',
}

@Entity('conflict_records')
@Index(['contractId'])
@Index(['handlerId', 'status'])
@Index(['severity', 'status'])
export class ConflictRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  contractId: string;

  @Column({ type: 'varchar', length: 200, comment: '冲突标题' })
  title: string;

  @Column({ type: 'text', comment: '详细描述' })
  description: string;

  @Column({
    type: 'enum',
    enum: ConflictType,
    default: ConflictType.OTHER,
    comment: '冲突类型',
  })
  conflictType: ConflictType;

  @Column({
    type: 'enum',
    enum: ConflictSeverity,
    default: ConflictSeverity.MEDIUM,
    comment: '严重程度',
  })
  severity: ConflictSeverity;

  @Column({
    type: 'enum',
    enum: ConflictStatus,
    default: ConflictStatus.OPEN,
    comment: '处理状态',
  })
  status: ConflictStatus;

  @Column({ type: 'text', nullable: true, comment: '影响范围' })
  impactScope: string;

  @Column({ type: 'text', nullable: true, comment: '涉及资源列表' })
  affectedResources: string;

  @Column({ type: 'uuid', nullable: true, comment: '处理人ID' })
  handlerId: string;

  @Column({ type: 'uuid', nullable: true, comment: '上报人ID' })
  reporterId: string;

  @Column({ type: 'text', nullable: true, comment: '下一步操作计划' })
  nextSteps: string;

  @Column({ type: 'text', nullable: true, comment: '解决方案' })
  resolution: string;

  @Column({ type: 'json', nullable: true, comment: '处理记录时间线' })
  timeline: {
    time: Date;
    actor: string;
    action: string;
    remark: string;
  }[];

  @Column({ type: 'timestamptz', nullable: true, comment: '解决时间' })
  resolvedAt: Date;

  @Column({ type: 'uuid', nullable: true, comment: '关联冲突ID' })
  relatedConflictId: string;

  @ManyToOne(() => Contract, (contract) => contract.conflicts, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'contractId' })
  contract: Contract;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'handlerId' })
  handler: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @CreateDateColumn({ type: 'timestamptz', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', comment: '更新时间' })
  updatedAt: Date;
}
