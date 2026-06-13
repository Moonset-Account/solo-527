import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Patient } from '../../patient/entities/patient.entity';
import { Clinic } from '../../clinic/entities/clinic.entity';
import { Appointment } from '../../appointment/entities/appointment.entity';
import { User } from '../../user/entities/user.entity';
import { ChargeAccuracy } from '../../charge/entities/charge-accuracy.entity';

@Entity('revisit_churn')
export class RevisitChurn extends BaseEntity {
  @Column({ name: 'patient_id', nullable: false })
  patientId: string;

  @ManyToOne(() => Patient, patient => patient.revisitChurns)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'clinic_id', nullable: false })
  clinicId: string;

  @ManyToOne(() => Clinic, clinic => clinic.revisitChurns)
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @Column({ name: 'last_appointment_id', nullable: true })
  lastAppointmentId: string;

  @OneToOne(() => Appointment, appointment => appointment.revisitChurn)
  @JoinColumn({ name: 'last_appointment_id' })
  lastAppointment: Appointment;

  @Column({ name: 'last_visit_date', type: 'date', nullable: true })
  lastVisitDate: Date;

  @Column({ name: 'planned_revisit_date', type: 'date', nullable: true })
  plannedRevisitDate: Date;

  @Column({ name: 'churn_days', nullable: true })
  churnDays: number;

  @Column({ name: 'churn_type', length: 30, nullable: true })
  churnType: string;

  @Column({ name: 'status', length: 20, default: 'pending' })
  status: string;

  @Column({ name: 'assigned_to', nullable: true })
  assignedToId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to' })
  assignedTo: User;

  @Column({ name: 'handler_id', nullable: true })
  handlerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'handler_id' })
  handler: User;

  @Column({ name: 'handled_at', type: 'timestamp', nullable: true })
  handledAt: Date;

  @Column({ name: 'handle_result', type: 'text', nullable: true })
  handleResult: string;

  @Column({ name: 'handle_notes', type: 'text', nullable: true })
  handleNotes: string;

  @Column({ name: 'is_closed', default: false })
  isClosed: boolean;

  @Column({ name: 'closed_by', nullable: true })
  closedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'closed_by' })
  closedBy: User;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date;

  @Column({ name: 'backfill_to_charge_accuracy', default: false })
  backfillToChargeAccuracy: boolean;

  @Column({ name: 'charge_accuracy_id', nullable: true })
  chargeAccuracyId: string;

  @OneToOne(() => ChargeAccuracy, chargeAccuracy => chargeAccuracy.revisitChurn)
  chargeAccuracy: ChargeAccuracy;

  @Column({ name: 'created_by', nullable: false })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;
}
