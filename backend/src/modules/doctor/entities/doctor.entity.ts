import { Entity, Column, ManyToOne, JoinColumn, OneToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Clinic } from '../../clinic/entities/clinic.entity';
import { AppointmentSlot } from '../../appointment/entities/appointment-slot.entity';
import { Appointment } from '../../appointment/entities/appointment.entity';
import { Prescription } from '../../prescription/entities/prescription.entity';
import { FollowUpTask } from '../../followup/entities/follow-up-task.entity';

@Entity('doctors')
export class Doctor extends BaseEntity {
  @Column({ name: 'user_id', nullable: false })
  userId: string;

  @OneToOne(() => User, user => user.doctor)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'title', length: 50, nullable: true })
  title: string;

  @Column({ name: 'department', length: 50, nullable: true })
  department: string;

  @Column({ name: 'specialty', length: 100, nullable: true })
  specialty: string;

  @Column({ name: 'clinic_id', nullable: false })
  clinicId: string;

  @ManyToOne(() => Clinic, clinic => clinic.doctors)
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => AppointmentSlot, slot => slot.doctor)
  slots: AppointmentSlot[];

  @OneToMany(() => Appointment, appointment => appointment.doctor)
  appointments: Appointment[];

  @OneToMany(() => Prescription, prescription => prescription.doctor)
  prescriptions: Prescription[];

  @OneToMany(() => FollowUpTask, followUp => followUp.doctor)
  followUpTasks: FollowUpTask[];
}
