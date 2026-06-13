import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Clinic } from '../../clinic/entities/clinic.entity';
import { Appointment } from '../../appointment/entities/appointment.entity';
import { Prescription } from '../../prescription/entities/prescription.entity';
import { Charge } from '../../charge/entities/charge.entity';
import { ChargeAccuracy } from '../../charge/entities/charge-accuracy.entity';
import { ReminderTask } from '../../reminder/entities/reminder-task.entity';
import { FollowUpTask } from '../../followup/entities/follow-up-task.entity';
import { RevisitChurn } from '../../revisit/entities/revisit-churn.entity';

@Entity('patients')
export class Patient extends BaseEntity {
  @Column({ name: 'name', length: 50, nullable: false })
  name: string;

  @Column({ name: 'phone', length: 20, nullable: false })
  phone: string;

  @Column({ name: 'id_card', length: 18, nullable: true })
  idCard: string;

  @Column({ name: 'gender', length: 10, nullable: true })
  gender: string;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate: Date;

  @Column({ name: 'address', length: 255, nullable: true })
  address: string;

  @Column({ name: 'allergy_history', type: 'text', nullable: true })
  allergyHistory: string;

  @Column({ name: 'medical_history', type: 'text', nullable: true })
  medicalHistory: string;

  @Column({ name: 'clinic_id', nullable: true })
  clinicId: string;

  @ManyToOne(() => Clinic, clinic => clinic.patients)
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @OneToMany(() => Appointment, appointment => appointment.patient)
  appointments: Appointment[];

  @OneToMany(() => Prescription, prescription => prescription.patient)
  prescriptions: Prescription[];

  @OneToMany(() => Charge, charge => charge.patient)
  charges: Charge[];

  @OneToMany(() => ChargeAccuracy, chargeAccuracy => chargeAccuracy.patient)
  chargeAccuracies: ChargeAccuracy[];

  @OneToMany(() => ReminderTask, reminder => reminder.patient)
  reminderTasks: ReminderTask[];

  @OneToMany(() => FollowUpTask, followUp => followUp.patient)
  followUpTasks: FollowUpTask[];

  @OneToMany(() => RevisitChurn, revisitChurn => revisitChurn.patient)
  revisitChurns: RevisitChurn[];
}
