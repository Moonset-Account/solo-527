import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Patient } from '../../patient/entities/patient.entity';
import { Doctor } from '../../doctor/entities/doctor.entity';
import { AppointmentSlot } from '../../appointment/entities/appointment-slot.entity';
import { Appointment } from '../../appointment/entities/appointment.entity';
import { ChargeItem } from '../../charge/entities/charge-item.entity';
import { Charge } from '../../charge/entities/charge.entity';
import { ChargeAccuracy } from '../../charge/entities/charge-accuracy.entity';
import { ReminderTask } from '../../reminder/entities/reminder-task.entity';
import { FollowUpTask } from '../../followup/entities/follow-up-task.entity';
import { RevisitChurn } from '../../revisit/entities/revisit-churn.entity';

@Entity('clinics')
export class Clinic extends BaseEntity {
  @Column({ name: 'name', length: 100, nullable: false })
  name: string;

  @Column({ name: 'address', length: 255, nullable: true })
  address: string;

  @Column({ name: 'phone', length: 20, nullable: true })
  phone: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => User, user => user.clinic)
  users: User[];

  @OneToMany(() => Patient, patient => patient.clinic)
  patients: Patient[];

  @OneToMany(() => Doctor, doctor => doctor.clinic)
  doctors: Doctor[];

  @OneToMany(() => AppointmentSlot, slot => slot.clinic)
  slots: AppointmentSlot[];

  @OneToMany(() => Appointment, appointment => appointment.clinic)
  appointments: Appointment[];

  @OneToMany('Prescription', 'clinic')
  prescriptions: any[];

  @OneToMany(() => ChargeItem, chargeItem => chargeItem.clinic)
  chargeItems: ChargeItem[];

  @OneToMany(() => Charge, charge => charge.clinic)
  charges: Charge[];

  @OneToMany(() => ChargeAccuracy, chargeAccuracy => chargeAccuracy.clinic)
  chargeAccuracies: ChargeAccuracy[];

  @OneToMany(() => ReminderTask, reminder => reminder.clinic)
  reminderTasks: ReminderTask[];

  @OneToMany(() => FollowUpTask, followUp => followUp.clinic)
  followUpTasks: FollowUpTask[];

  @OneToMany(() => RevisitChurn, revisitChurn => revisitChurn.clinic)
  revisitChurns: RevisitChurn[];
}
