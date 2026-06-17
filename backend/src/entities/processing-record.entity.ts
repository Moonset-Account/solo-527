import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

export type ProcessingType = 'appointment_create' | 'appointment_cancel' | 'appointment_complete' | 'waitlist_add' | 'waitlist_release' | 'refund_create' | 'refund_approve' | 'refund_reject' | 'schedule_update' | 'service_update' | 'counselor_update' | 'other';

@Entity('processing_records')
export class ProcessingRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: [
      'appointment_create',
      'appointment_cancel',
      'appointment_complete',
      'waitlist_add',
      'waitlist_release',
      'refund_create',
      'refund_approve',
      'refund_reject',
      'schedule_update',
      'service_update',
      'counselor_update',
      'other',
    ],
  })
  type: ProcessingType;

  @Column({ nullable: true })
  relatedId: string;

  @Column({ nullable: true })
  relatedType: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  operator: User;

  @Column({ nullable: true })
  operatorId: string;

  @Column({ type: 'text', nullable: true })
  action: string;

  @Column({ type: 'text', nullable: true })
  beforeState: string;

  @Column({ type: 'text', nullable: true })
  afterState: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ type: 'text', nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;
}
