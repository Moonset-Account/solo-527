import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Counselor } from '../counselors/counselor.entity';
import { Package } from '../packages/package.entity';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  counselorId: string;

  @ManyToOne(() => Counselor, (counselor) => counselor.appointments)
  @JoinColumn({ name: 'counselorId' })
  counselor: Counselor;

  @Column({ nullable: true })
  packageId: string;

  @ManyToOne(() => Package)
  @JoinColumn({ name: 'packageId' })
  package: Package;

  @Column()
  clientName: string;

  @Column()
  clientPhone: string;

  @Column({ nullable: true })
  clientEmail: string;

  @Column({ type: 'timestamp' })
  appointmentTime: Date;

  @Column({ type: 'text' })
  reason: string;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column({ nullable: true })
  source: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  lastOperatorId: string;

  @Column({ nullable: true })
  lastOperatorName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
