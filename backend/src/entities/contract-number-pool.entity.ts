import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum NumberPoolStatus {
  AVAILABLE = 'available',
  USED = 'used',
  RESERVED = 'reserved',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('contract_number_pool')
@Index(['prefix', 'year', 'seqNo'], { unique: true })
@Index(['contractId'])
@Index(['status', 'year'])
export class ContractNumberPool {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true, comment: '完整编号' })
  contractNo: string;

  @Column({ type: 'varchar', length: 20, comment: '编号前缀' })
  prefix: string;

  @Column({ type: 'integer', comment: '年份' })
  year: number;

  @Column({ type: 'integer', comment: '序列号' })
  seqNo: number;

  @Column({
    type: 'enum',
    enum: NumberPoolStatus,
    default: NumberPoolStatus.AVAILABLE,
    comment: '编号状态',
  })
  status: NumberPoolStatus;

  @Column({ type: 'uuid', nullable: true, comment: '关联合同ID' })
  contractId: string;

  @Column({ type: 'uuid', nullable: true, comment: '申请人ID' })
  appliedBy: string;

  @Column({ type: 'varchar', length: 20, comment: '编号规则类型' })
  ruleType: string;

  @Column({ type: 'timestamptz', nullable: true, comment: '使用时间' })
  usedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, comment: '预留过期时间' })
  reservedExpireAt: Date;

  @CreateDateColumn({ type: 'timestamptz', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', comment: '更新时间' })
  updatedAt: Date;
}
