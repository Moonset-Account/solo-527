import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { User } from './user.entity';
import { ContractAttachment } from './contract-attachment.entity';
import { ApprovalFlow } from './approval-flow.entity';
import { ConflictRecord } from './conflict-record.entity';

export enum ContractStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVING = 'approving',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SIGNING = 'signing',
  SIGNED = 'signed',
  ARCHIVED = 'archived',
  CANCELLED = 'cancelled',
}

export enum ContractType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  SERVICE = 'service',
  LABOR = 'labor',
  COOPERATION = 'cooperation',
  CONFIDENTIAL = 'confidential',
  OTHER = 'other',
}

export enum UrgencyLevel {
  NORMAL = 'normal',
  URGENT = 'urgent',
  VERY_URGENT = 'very_urgent',
}

@Entity('contracts')
@Index(['contractNo'], { unique: true })
@Index(['status', 'createdAt'])
@Index(['applicantId', 'status'])
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true, comment: '合同编号' })
  contractNo: string;

  @Column({ type: 'varchar', length: 255, comment: '合同标题' })
  title: string;

  @Column({ type: 'text', nullable: true, comment: '合同摘要' })
  summary: string;

  @Column({
    type: 'enum',
    enum: ContractType,
    default: ContractType.OTHER,
    comment: '合同类型',
  })
  contractType: ContractType;

  @Column({
    type: 'enum',
    enum: ContractStatus,
    default: ContractStatus.DRAFT,
    comment: '合同状态',
  })
  status: ContractStatus;

  @Column({
    type: 'enum',
    enum: UrgencyLevel,
    default: UrgencyLevel.NORMAL,
    comment: '紧急程度',
  })
  urgency: UrgencyLevel;

  @Column({ type: 'varchar', length: 100, comment: '甲方' })
  partyA: string;

  @Column({ type: 'varchar', length: 100, comment: '乙方' })
  partyB: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: '合同金额' })
  amount: number;

  @Column({ type: 'varchar', length: 10, comment: '货币单位' })
  currency: string;

  @Column({ type: 'date', nullable: true, comment: '生效日期' })
  effectiveDate: Date;

  @Column({ type: 'date', nullable: true, comment: '到期日期' })
  expiryDate: Date;

  @Column({ type: 'uuid' })
  applicantId: string;

  @Column({ type: 'uuid', nullable: true })
  ownerId: string;

  @Column({ type: 'json', nullable: true, comment: '材料清单检查' })
  materialChecklist: {
    name: string;
    required: boolean;
    uploaded: boolean;
    remark: string;
  }[];

  @Column({ type: 'boolean', default: false, comment: '材料是否完整' })
  materialsComplete: boolean;

  @Column({ type: 'text', nullable: true, comment: '退回原因' })
  rejectionReason: string;

  @Column({ type: 'json', nullable: true, comment: '自定义字段' })
  customFields: Record<string, any>;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'applicantId' })
  applicant: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @OneToMany(() => ContractAttachment, (att) => att.contract)
  attachments: ContractAttachment[];

  @OneToMany(() => ApprovalFlow, (flow) => flow.contract)
  approvalFlows: ApprovalFlow[];

  @OneToMany(() => ConflictRecord, (conflict) => conflict.contract)
  conflicts: ConflictRecord[];

  @CreateDateColumn({ type: 'timestamptz', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', comment: '更新时间' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, comment: '归档时间' })
  archivedAt: Date;
}
