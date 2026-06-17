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

  @Column({ unique: true })
  depositNo: string;

  @Column()
  leaseId: string;

  @ManyToOne(() => Lease)
  @JoinColumn({ name: 'leaseId' })
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

  @Column({ type: 'date', nullable: true })
  receiveDate: Date;

  @Column({ type: 'date', nullable: true })
  refundDate: Date;

  @Column({ nullable: true })
  source: string;

  @Column({ type: 'text', nullable: true })
  sourceRemark: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;
}
