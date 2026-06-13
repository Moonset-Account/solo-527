import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Charge } from './charge.entity';
import { Prescription } from '../../prescription/entities/prescription.entity';
import { Patient } from '../../patient/entities/patient.entity';
import { Clinic } from '../../clinic/entities/clinic.entity';
import { User } from '../../user/entities/user.entity';
import { RevisitChurn } from '../../revisit/entities/revisit-churn.entity';

@Entity('charge_accuracy')
export class ChargeAccuracy extends BaseEntity {
  @Column({ name: 'charge_id', nullable: false, unique: true })
  chargeId: string;

  @OneToOne(() => Charge, charge => charge.chargeAccuracy)
  @JoinColumn({ name: 'charge_id' })
  charge: Charge;

  @Column({ name: 'prescription_id', nullable: true })
  prescriptionId: string;

  @OneToOne(() => Prescription, prescription => prescription.chargeAccuracy)
  @JoinColumn({ name: 'prescription_id' })
  prescription: Prescription;

  @Column({ name: 'patient_id', nullable: false })
  patientId: string;

  @ManyToOne(() => Patient, patient => patient.chargeAccuracies)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'clinic_id', nullable: false })
  clinicId: string;

  @ManyToOne(() => Clinic, clinic => clinic.chargeAccuracies)
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @Column({ name: 'is_accurate', default: false })
  isAccurate: boolean;

  @Column({ name: 'accuracy_notes', type: 'text', nullable: true })
  accuracyNotes: string;

  @Column({ name: 'checked_amount', type: 'decimal', precision: 10, scale: 2, nullable: false })
  checkedAmount: number;

  @Column({ name: 'system_amount', type: 'decimal', precision: 10, scale: 2, nullable: false })
  systemAmount: number;

  @Column({ name: 'difference_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  differenceAmount: number;

  @Column({ name: 'completed_by', nullable: true })
  completedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'completed_by' })
  completedBy: User;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ name: 'is_revisit_backfill', default: false })
  isRevisitBackfill: boolean;

  @Column({ name: 'revisit_churn_id', nullable: true })
  revisitChurnId: string;

  @OneToOne(() => RevisitChurn, revisitChurn => revisitChurn.chargeAccuracy)
  @JoinColumn({ name: 'revisit_churn_id' })
  revisitChurn: RevisitChurn;
}
