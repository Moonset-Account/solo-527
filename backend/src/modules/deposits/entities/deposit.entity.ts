import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Lease } from '../../leases/entities/lease.entity';

export type DepositType = 'received' | 'refunded' | 'deducted';
export type DepositStatus = 'active' | 'refunded' | 'deducted';

@Entity('deposits')
export class Deposit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'deposit_no', unique: true })
  depositNo: string;

  @Column({ name: 'lease_id' })
  leaseId: string;

  @ManyToOne(() => Lease)
  @JoinColumn({ name: 'lease_id' })
  lease: Lease;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ['received', 'refunded', 'deducted'],
  })
  type: DepositType;

  @Column({
    type: 'enum',
    enum: ['active', 'refunded', 'deducted'],
    default: 'active',
  })
  status: DepositStatus;

  @Column({ name: 'receive_date', type: 'date', nullable: true })
  receiveDate: Date;

  @Column({ name: 'refund_date', type: 'date', nullable: true })
  refundDate: Date;

  @Column({ nullable: true })
  source: string;

  @Column({ name: 'source_remark', type: 'text', nullable: true })
  sourceRemark: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
