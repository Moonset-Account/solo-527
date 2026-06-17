import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Appointment } from './appointment.entity';

export type RefundStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type RefundReason = 'client_cancel' | 'counselor_cancel' | 'no_show' | 'service_issue' | 'other';

@Entity('refunds')
export class Refund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Appointment, { onDelete: 'CASCADE' })
  appointment: Appointment;

  @Column()
  appointmentId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  client: User;

  @Column()
  clientId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  originalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  refundAmount: number;

  @Column({
    type: 'enum',
    enum: ['client_cancel', 'counselor_cancel', 'no_show', 'service_issue', 'other'],
  })
  reason: RefundReason;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending',
  })
  status: RefundStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  rejectReason: string;

  @Column({ nullable: true })
  processedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'text', nullable: true })
  refundMethod: string;

  @Column({ type: 'text', nullable: true })
  transactionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
