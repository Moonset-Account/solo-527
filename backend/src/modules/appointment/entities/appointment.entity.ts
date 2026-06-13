import { Entity, Column, ManyToOne, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Patient } from '../../patient/entities/patient.entity';
import { Doctor } from '../../doctor/entities/doctor.entity';
import { AppointmentSlot } from './appointment-slot.entity';
import { Clinic } from '../../clinic/entities/clinic.entity';
import { User } from '../../user/entities/user.entity';
import { Prescription } from '../../prescription/entities/prescription.entity';
import { FollowUpTask } from '../../followup/entities/follow-up-task.entity';
import { RevisitChurn } from '../../revisit/entities/revisit-churn.entity';

@Entity('appointments')
export class Appointment extends BaseEntity {
  @Column({ name: 'patient_id', nullable: false })
  patientId: string;

  @ManyToOne(() => Patient, patient => patient.appointments)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'doctor_id', nullable: false })
  doctorId: string;

  @ManyToOne(() => Doctor, doctor => doctor.appointments)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ name: 'slot_id', nullable: false })
  slotId: string;

  @ManyToOne(() => AppointmentSlot, slot => slot.appointments)
  @JoinColumn({ name: 'slot_id' })
  slot: AppointmentSlot;

  @Column({ name: 'clinic_id', nullable: false })
  clinicId: string;

  @ManyToOne(() => Clinic, clinic => clinic.appointments)
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @Column({ name: 'chief_complaint', type: 'text', nullable: false })
  chiefComplaint: string;

  @Column({ name: 'status', length: 20, default: 'pending' })
  status: string;

  @Column({ name: 'appointment_type', length: 50, default: 'first_visit' })
  appointmentType: string;

  @Column({ name: 'source', length: 50, default: '前台' })
  source: string;

  @Column({ name: 'check_in_time', type: 'timestamp', nullable: true })
  checkInTime: Date;

  @Column({ name: 'completed_time', type: 'timestamp', nullable: true })
  completedTime: Date;

  @Column({ name: 'cancel_reason', type: 'text', nullable: true })
  cancelReason: string;

  @Column({ name: 'created_by', nullable: false })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @OneToMany(() => Prescription, prescription => prescription.appointment)
  prescriptions: Prescription[];

  @OneToMany(() => FollowUpTask, followUp => followUp.appointment)
  followUpTasks: FollowUpTask[];

  @OneToOne(() => RevisitChurn, revisitChurn => revisitChurn.lastAppointment)
  revisitChurn: RevisitChurn;
}
