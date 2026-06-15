import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Bill } from './bill.entity';

@Entity('invoices')
export class Invoice extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  @Index()
  billId: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10 })
  currency: string;

  @Column({ type: 'timestamp with time zone' })
  invoiceDate: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: ['draft', 'issued', 'sent', 'paid', 'overdue', 'cancelled', 'void'],
    default: 'draft'
  })
  @Index()
  status: string;

  @Column({ type: 'text', nullable: true })
  customerAddress: string;

  @Column({ type: 'text', nullable: true })
  billingAddress: string;

  @Column({ type: 'jsonb', nullable: true })
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    taxRate: number;
    taxAmount: number;
  }>;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  taxTotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'text', nullable: true })
  paymentTerms: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  recipientEmail: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  sentDate: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  paidDate: Date;

  @ManyToOne(() => Bill, bill => bill.invoices, { nullable: true })
  @JoinColumn({ name: 'billId' })
  bill: Bill;
}
