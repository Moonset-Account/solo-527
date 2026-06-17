import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Counselor } from './counselor.entity';
import { Service } from './service.entity';
import { Refund } from './refund.entity';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'in_waitlist';
export type PaymentStatus = 'unpaid' | 'paid' | 'failed' | 'refunded' | 'partial_refund';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.appointments, { onDelete: 'CASCADE' })
  client: User;

  @Column()
  clientId: string;

  @ManyToOne(() => Counselor, (counselor) => counselor.appointments, { onDelete: 'CASCADE' })
  counselor: Counselor;

  @Column()
  counselorId: string;

  @ManyToOne(() => Service, (service) => service.appointments, { nullable: true, onDelete: 'SET NULL' })
  service: Service;

  @Column({ nullable: true })
  serviceId: string;

  @Column({ type: 'date' })
  appointmentDate: string;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'text', nullable: true })
  visitReason: string;

  @Column({ type: 'text', nullable: true })
  clientNotes: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'in_waitlist'],
    default: 'pending',
  })
  status: AppointmentStatus;

  @Column({
    type: 'enum',
    enum: ['unpaid', 'paid', 'failed', 'refunded', 'partial_refund'],
    default: 'unpaid',
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  paymentMethod: string;

  @Column({ type: 'timestamp', nullable: true })
  paymentTime: Date;

  @Column({ type: 'text', nullable: true })
  paymentFailureReason: string;

  @OneToOne(() => Refund, { nullable: true })
  @JoinColumn()
  refund: Refund;

  @Column({ nullable: true })
  refundId: string;

  @Column({ type: 'text', nullable: true })
  cancelReason: string;

  @Column({ type: 'timestamp', nullable: true })
  cancelTime: Date;

  @Column({ nullable: true })
  cancelledBy: string;

  @Column({ type: 'text', nullable: true })
  counselorNotes: string;

  @Column({ type: 'text', nullable: true })
  dispatcherNotes: string;

  @Column({ nullable: true })
  processedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
