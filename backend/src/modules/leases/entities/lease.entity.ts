import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Property } from '../../properties/entities/property.entity';
import { User } from '../../users/entities/user.entity';

export type LeaseStatus = 'active' | 'expired' | 'terminated';

@Entity('leases')
export class Lease {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lease_no', unique: true })
  leaseNo: string;

  @Column({ name: 'property_id' })
  propertyId: string;

  @ManyToOne(() => Property)
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column({ name: 'tenant_name' })
  tenantName: string;

  @Column({ name: 'tenant_contact', nullable: true })
  tenantContact: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'monthly_rent', type: 'decimal', precision: 12, scale: 2 })
  monthlyRent: number;

  @Column({ name: 'deposit_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  depositAmount: number;

  @Column({
    type: 'enum',
    enum: ['active', 'expired', 'terminated'],
    default: 'active',
  })
  status: LeaseStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  source: string;

  @Column({ name: 'source_remark', type: 'text', nullable: true })
  sourceRemark: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
