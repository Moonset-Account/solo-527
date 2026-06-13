import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Prescription } from './prescription.entity';
import { ChargeItem } from '../../charge/entities/charge-item.entity';

@Entity('prescription_items')
export class PrescriptionItem extends BaseEntity {
  @Column({ name: 'prescription_id', nullable: false })
  prescriptionId: string;

  @ManyToOne(() => Prescription, prescription => prescription.items)
  @JoinColumn({ name: 'prescription_id' })
  prescription: Prescription;

  @Column({ name: 'charge_item_id', nullable: false })
  chargeItemId: string;

  @ManyToOne(() => ChargeItem, chargeItem => chargeItem.prescriptionItems)
  @JoinColumn({ name: 'charge_item_id' })
  chargeItem: ChargeItem;

  @Column({ name: 'quantity', default: 1 })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2, nullable: false })
  unitPrice: number;

  @Column({ name: 'discount', type: 'decimal', precision: 5, scale: 2, default: 100 })
  discount: number;

  @Column({ name: 'actual_price', type: 'decimal', precision: 10, scale: 2, nullable: false })
  actualPrice: number;

  @Column({ name: 'remarks', type: 'text', nullable: true })
  remarks: string;
}
