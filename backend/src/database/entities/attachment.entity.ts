import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Bill } from './bill.entity';

@Entity('attachments')
export class Attachment extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  billId: string;

  @Column()
  @Index()
  entityType: string;

  @Column({ type: 'uuid' })
  @Index()
  entityId: string;

  @Column()
  fileName: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column()
  storagePath: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => Bill, bill => bill.attachments, { nullable: true })
  @JoinColumn({ name: 'billId' })
  bill: Bill;
}
