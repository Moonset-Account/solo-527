import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Lease } from '../../leases/entities/lease.entity';
import { User } from '../../users/entities/user.entity';

export type BillType = 'rent' | 'deposit' | 'service' | 'other';
export type BillStatus = 'unpaid' | 'paid' | 'partial' | 'void';

@Entity('bills')
export class Bill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bill_no', unique: true })
  billNo: string;

  @Column({ name: 'lease_id' })
  leaseId: string;

  @ManyToOne(() => Lease)
  @JoinColumn({ name: 'lease_id' })
  lease: Lease;

  @Column({
    type: 'enum',
    enum: ['rent', 'deposit', 'service', 'other'],
  })
  type: BillType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'bill_date', type: 'date' })
  billDate: Date;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: ['unpaid', 'paid', 'partial', 'void'],
    default: 'unpaid',
  })
  status: BillStatus;

  @Column({ name: 'paid_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ name: 'paid_date', type: 'date', nullable: true })
  paidDate: Date;

  @Column({ default: false })
  reconciled: boolean;

  @Column({ name: 'reconciled_at', type: 'timestamp', nullable: true })
  reconciledAt: Date;

  @Column({ name: 'reconciled_by', nullable: true })
  reconciledBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reconciled_by' })
  reconciler: User;

  @Column({ nullable: true })
  source: string;

  @Column({ name: 'source_remark', type: 'text', nullable: true })
  sourceRemark: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
