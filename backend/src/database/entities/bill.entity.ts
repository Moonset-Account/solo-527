import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Customer } from './customer.entity';
import { Subscription } from './subscription.entity';
import { StatusHistory } from './status-history.entity';
import { CollectionRecord } from './collection-record.entity';
import { Invoice } from './invoice.entity';
import { Attachment } from './attachment.entity';

export type BillStatus = 'draft' | 'issued' | 'pending' | 'partial' | 'paid' | 'overdue' | 'written_off' | 'disputed';

@Entity('bills')
export class Bill extends BaseEntity {
  @Column({ type: 'uuid' })
  @Index()
  customerId: string;

  @Column({ type: 'uuid', nullable: true })
  subscriptionId: string;

  @Column({ unique: true })
  billNumber: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  remainingAmount: number;

  @Column({ type: 'varchar', length: 10 })
  currency: string;

  @Column({ type: 'timestamp with time zone' })
  @Index()
  issueDate: Date;

  @Column({ type: 'timestamp with time zone' })
  @Index()
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: ['draft', 'issued', 'pending', 'partial', 'paid', 'overdue', 'written_off', 'disputed'],
    default: 'draft'
  })
  @Index()
  status: BillStatus;

  @Column({ type: 'int', default: 0 })
  overdueDays: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  lateFee: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  interestRate: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  items: Array<{
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  paymentTerms: {
    method: string;
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
  };

  @ManyToOne(() => Customer, customer => customer.bills)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(() => Subscription, subscription => subscription.bills, { nullable: true })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  @OneToMany(() => StatusHistory, history => history.bill)
  statusHistory: StatusHistory[];

  @OneToMany(() => CollectionRecord, record => record.bill)
  collectionRecords: CollectionRecord[];

  @OneToMany(() => Invoice, invoice => invoice.bill)
  invoices: Invoice[];

  @OneToMany(() => Attachment, attachment => attachment.bill)
  attachments: Attachment[];
}
