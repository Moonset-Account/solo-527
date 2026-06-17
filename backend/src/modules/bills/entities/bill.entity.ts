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

  @Column({ unique: true })
  billNo: string;

  @Column()
  leaseId: string;

  @ManyToOne(() => Lease)
  @JoinColumn({ name: 'leaseId' })
  lease: Lease;

  @Column({
    type: 'enum',
    enum: ['rent', 'deposit', 'service', 'other'],
  })
  type: BillType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  billDate: Date;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: ['unpaid', 'paid', 'partial', 'void'],
    default: 'unpaid',
  })
  status: BillStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'date', nullable: true })
  paidDate: Date;

  @Column({ default: false })
  reconciled: boolean;

  @Column({ type: 'timestamp', nullable: true })
  reconciledAt: Date;

  @Column({ nullable: true })
  reconciledBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reconciledBy' })
  reconciler: User;

  @Column({ nullable: true })
  source: string;

  @Column({ type: 'text', nullable: true })
  sourceRemark: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;
}
