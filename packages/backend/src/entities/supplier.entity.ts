import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum SupplierType {
  HOTEL = 'hotel',
  TRANSPORTATION = 'transportation',
  TICKET = 'ticket',
  RESTAURANT = 'restaurant',
  GUIDE = 'guide',
  OTHER = 'other',
}

@Entity('suppliers')
export class Supplier extends BaseEntity {
  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: SupplierType,
  })
  type: SupplierType;

  @Column({ nullable: true })
  contactPerson: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'jsonb', nullable: true })
  priceList: {
    item: string;
    price: number;
    validFrom: Date;
    validTo: Date;
  }[];

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  commissionRate: number;

  @Column({ type: 'text', nullable: true })
  paymentTerms: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  rating: number;
}
