import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Clinic } from '../../clinic/entities/clinic.entity';
import { PrescriptionItem } from '../../prescription/entities/prescription-item.entity';

@Entity('charge_items')
export class ChargeItem extends BaseEntity {
  @Column({ name: 'code', length: 50, unique: true, nullable: false })
  code: string;

  @Column({ name: 'name', length: 100, nullable: false })
  name: string;

  @Column({ name: 'category', length: 50, nullable: false })
  category: string;

  @Column({ name: 'unit', length: 20, nullable: false })
  unit: string;

  @Column({ name: 'price', type: 'decimal', precision: 10, scale: 2, nullable: false })
  price: number;

  @Column({ name: 'cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'clinic_id', nullable: true })
  clinicId: string;

  @ManyToOne(() => Clinic, clinic => clinic.chargeItems)
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @OneToMany(() => PrescriptionItem, prescriptionItem => prescriptionItem.chargeItem)
  prescriptionItems: PrescriptionItem[];
}
