import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Counselor } from './counselor.entity';
import { Appointment } from './appointment.entity';
import { Service } from './service.entity';

export type WaitlistStatus = 'waiting' | 'notified' | 'confirmed' | 'cancelled' | 'expired';

@Entity('waitlist_entries')
export class WaitlistEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.waitlistEntries, { onDelete: 'CASCADE' })
  client: User;

  @Column()
  clientId: string;

  @ManyToOne(() => Counselor, { onDelete: 'CASCADE' })
  counselor: Counselor;

  @Column()
  counselorId: string;

  @ManyToOne(() => Service, { nullable: true, onDelete: 'SET NULL' })
  service: Service;

  @Column({ nullable: true })
  serviceId: string;

  @Column({ type: 'date' })
  preferredDate: string;

  @Column({ type: 'time', nullable: true })
  preferredStartTime: string;

  @Column({ type: 'time', nullable: true })
  preferredEndTime: string;

  @Column({ type: 'int' })
  queuePosition: number;

  @Column({
    type: 'enum',
    enum: ['waiting', 'notified', 'confirmed', 'cancelled', 'expired'],
    default: 'waiting',
  })
  status: WaitlistStatus;

  @Column({ type: 'text', nullable: true })
  visitReason: string;

  @Column({ type: 'timestamp', nullable: true })
  notifiedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiredAt: Date;

  @OneToOne(() => Appointment, { nullable: true })
  @JoinColumn()
  convertedAppointment: Appointment;

  @Column({ nullable: true })
  convertedAppointmentId: string;

  @Column({ type: 'text', nullable: true })
  cancelReason: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
