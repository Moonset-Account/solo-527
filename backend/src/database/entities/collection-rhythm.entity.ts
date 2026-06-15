import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { CollectionRecord } from './collection-record.entity';

export type CollectionChannel = 'email' | 'sms' | 'phone' | 'letter' | 'in_person';
export type CollectionSeverity = 'reminder' | 'warning' | 'urgent' | 'legal';

@Entity('collection_rhythms')
export class CollectionRhythm extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  daysOverdue: number;

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

  @Column({ type: 'text' })
  template: string;

  @Column({ type: 'text', nullable: true })
  subject: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'jsonb', nullable: true })
  escalationRules: {
    afterDays: number;
    nextRhythmId: string;
    autoEscalate: boolean;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  conditions: {
    minAmount?: number;
    maxAmount?: number;
    customerSegments?: string[];
    subscriptionPlans?: string[];
  };

  @OneToMany(() => CollectionRecord, record => record.rhythm)
  collectionRecords: CollectionRecord[];
}
