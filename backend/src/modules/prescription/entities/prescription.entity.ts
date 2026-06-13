import { Entity, Column, ManyToOne, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Appointment } from '../../appointment/entities/appointment.entity';
import { Patient } from '../../patient/entities/patient.entity';
import { Doctor } from '../../doctor/entities/doctor.entity';
import { Clinic } from '../../clinic/entities/clinic.entity';
import { User } from '../../user/entities/user.entity';
import { PrescriptionItem } from './prescription-item.entity';
import { Charge } from '../../charge/entities/charge.entity';
import { ChargeAccuracy } from '../../charge/entities/charge-accuracy.entity';

@Entity('prescriptions')
export class Prescription extends BaseEntity {
  @Column({ name: 'appointment_id', nullable: false })
  appointmentId: string;

  @ManyToOne(() => Appointment, appointment => appointment.prescriptions)
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @Column({ name: 'patient_id', nullable: false })
  patientId: string;

  @ManyToOne(() => Patient, patient => patient.prescriptions)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'doctor_id', nullable: false })
  doctorId: string;

  @ManyToOne(() => Doctor, doctor => doctor.prescriptions)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ name: 'clinic_id', nullable: false })
  clinicId: string;

  @ManyToOne(() => Clinic, clinic => clinic.prescriptions)
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @Column({ name: 'diagnosis', type: 'text', nullable: false })
  diagnosis: string;

  @Column({ name: 'treatment_plan', type: 'text', nullable: true })
  treatmentPlan: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'status', length: 20, default: 'pending' })
  status: string;

  @Column({ name: 'created_by', nullable: false })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @OneToMany(() => PrescriptionItem, item => item.prescription, { cascade: true })
  items: PrescriptionItem[];

  @OneToOne(() => Charge, charge => charge.prescription)
  charge: Charge;

  @OneToOne(() => ChargeAccuracy, chargeAccuracy => chargeAccuracy.prescription)
  chargeAccuracy: ChargeAccuracy;
}
