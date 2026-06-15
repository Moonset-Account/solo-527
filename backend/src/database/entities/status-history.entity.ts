import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Bill } from './bill.entity';
import { BillStatus } from './bill.entity';

@Entity('status_history')
export class StatusHistory extends BaseEntity {
  @Column({ type: 'uuid' })
  @Index()
  billId: string;

  @Column({
    type: 'enum',
    enum: ['draft', 'issued', 'pending', 'partial', 'paid', 'overdue', 'written_off', 'disputed']
  })
  @Index()
  fromStatus: BillStatus;

  @Column({
    type: 'enum',
    enum: ['draft', 'issued', 'pending', 'partial', 'paid', 'overdue', 'written_off', 'disputed']
  })
  @Index()
  toStatus: BillStatus;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'jsonb', nullable: true })
  changedFields: Record<string, { oldValue: any; newValue: any }>;

  @ManyToOne(() => Bill, bill => bill.statusHistory)
  @JoinColumn({ name: 'billId' })
  bill: Bill;
}
