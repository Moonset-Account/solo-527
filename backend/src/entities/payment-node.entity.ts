import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Quote } from './quote.entity';

export type PaymentNodeStatus = 'pending' | 'paid' | 'overdue';

@Entity('payment_nodes')
export class PaymentNode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Quote, quote => quote.paymentNodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quote_id' })
  quote: Quote;

  @Column({ name: 'quote_id', nullable: true })
  quoteId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  percentage: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount: number;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: PaymentNodeStatus;

  @Column({ name: 'paid_at', nullable: true })
  paidAt: Date;
}
