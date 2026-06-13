import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Prescription } from '../../prescription/entities/prescription.entity';
import { Patient } from '../../patient/entities/patient.entity';
import { Clinic } from '../../clinic/entities/clinic.entity';
import { User } from '../../user/entities/user.entity';
import { ChargeAccuracy } from './charge-accuracy.entity';

@Entity('charges')
export class Charge extends BaseEntity {
  @Column({ name: 'prescription_id', nullable: true })
  prescriptionId: string;

  @OneToOne(() => Prescription, prescription => prescription.charge)
  @JoinColumn({ name: 'prescription_id' })
  prescription: Prescription;

  @Column({ name: 'patient_id', nullable: false })
  patientId: string;

  @ManyToOne(() => Patient, patient => patient.charges)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'clinic_id', nullable: false })
  clinicId: string;

  @ManyToOne(() => Clinic, clinic => clinic.charges)
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2, nullable: false })
  totalAmount: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'actual_amount', type: 'decimal', precision: 10, scale: 2, nullable: false })
  actualAmount: number;

  @Column({ name: 'paid_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ name: 'payment_method', length: 20, nullable: true })
  paymentMethod: string;

  @Column({ name: 'status', length: 20, default: 'pending' })
  status: string;

  @Column({ name: 'is_checked', default: false })
  isChecked: boolean;

  @Column({ name: 'checked_by', nullable: true })
  checkedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'checked_by' })
  checkedBy: User;

  @Column({ name: 'checked_at', type: 'timestamp', nullable: true })
  checkedAt: Date;

  @Column({ name: 'created_by', nullable: false })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @OneToOne(() => ChargeAccuracy, chargeAccuracy => chargeAccuracy.charge)
  chargeAccuracy: ChargeAccuracy;
}
