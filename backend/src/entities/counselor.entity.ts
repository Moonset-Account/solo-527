import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Appointment } from './appointment.entity';
import { Schedule } from './schedule.entity';
import { Service } from './service.entity';

export type CounselorStatus = 'active' | 'inactive' | 'leave';

@Entity('counselors')
export class Counselor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  introduction: string;

  @Column({ type: 'simple-array', nullable: true })
  specialties: string[];

  @Column({ type: 'simple-array', nullable: true })
  certifications: string[];

  @Column({ type: 'int', default: 0 })
  experienceYears: number;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'leave'],
    default: 'active',
  })
  status: CounselorStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hourlyRate: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 5 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'int', default: 0 })
  appointmentCount: number;

  @Column({ nullable: true })
  avatar: string;

  @OneToMany(() => Appointment, (appointment) => appointment.counselor)
  appointments: Appointment[];

  @OneToMany(() => Schedule, (schedule) => schedule.counselor)
  schedules: Schedule[];

  @OneToMany(() => Service, (service) => service.counselor)
  services: Service[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
