import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Bill } from './bill.entity';
import { CollectionRhythm, CollectionChannel, CollectionSeverity } from './collection-rhythm.entity';

export type CollectionStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
export type CustomerResponse = 'no_response' | 'promised_to_pay' | 'disputed' | 'negotiated' | 'paid';

@Entity('collection_records')
export class CollectionRecord extends BaseEntity {
  @Column({ type: 'uuid' })
  @Index()
  billId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  rhythmId: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'in_progress', 'completed', 'failed', 'skipped'],
    default: 'pending'
  })
  status: CollectionStatus;

  @Column({
    type: 'enum',
    enum: ['reminder', 'warning', 'urgent', 'legal'],
    default: 'reminder'
  })
  severity: CollectionSeverity;

  @Column({
    type: 'enum',
    enum: ['email', 'sms', 'phone', 'letter', 'in_person'],
    default: 'email'
  })
  channel: CollectionChannel;

  @Column({
    type: 'enum',
    enum: ['no_response', 'promised_to_pay', 'disputed', 'negotiated', 'paid'],
    default: 'no_response'
  })
  customerResponse: CustomerResponse;

  @Column({ type: 'timestamp with time zone', nullable: true })
  contactDate: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  scheduledDate: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  promisedPaymentDate: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  promisedAmount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'text', nullable: true })
  conversationRecord: string;

  @Column({ type: 'jsonb', nullable: true })
  followUpActions: {
    action: string;
    scheduledDate: Date;
    assignee: string;
    completed: boolean;
  }[];

  @ManyToOne(() => Bill, bill => bill.collectionRecords)
  @JoinColumn({ name: 'billId' })
  bill: Bill;

  @ManyToOne(() => CollectionRhythm, rhythm => rhythm.collectionRecords, { nullable: true })
  @JoinColumn({ name: 'rhythmId' })
  rhythm: CollectionRhythm;
}
