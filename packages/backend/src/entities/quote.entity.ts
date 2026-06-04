import { Entity, Column, ManyToOne, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { CustomerRequirement } from './customer-requirement.entity';
import { QuoteVersion } from './quote-version.entity';
import { Contract } from './contract.entity';

export enum QuoteStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SENT_TO_CUSTOMER = 'sent_to_customer',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  OBSOLETE = 'obsolete',
}

export enum ProfitWarningLevel {
  NORMAL = 'normal',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

@Entity('quotes')
export class Quote extends BaseEntity {
  @Column()
  requirementId: string;

  @ManyToOne(() => CustomerRequirement, requirement => requirement.quotes)
  @JoinColumn({ name: 'requirementId' })
  requirement: CustomerRequirement;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({
    type: 'enum',
    enum: QuoteStatus,
    default: QuoteStatus.DRAFT,
  })
  status: QuoteStatus;

  @Column({ type: 'text', nullable: true })
  itineraryName: string;

  @Column({ type: 'date', nullable: true })
  travelStartDate: Date;

  @Column({ type: 'date', nullable: true })
  travelEndDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  hotels: {
    id?: string;
    name: string;
    starRating: number;
    roomType: string;
    nights: number;
    costPerNight: number;
    totalCost: number;
    supplier: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  transportation: {
    id?: string;
    type: string;
    description: string;
    vehicleType: string;
    days: number;
    costPerDay: number;
    totalCost: number;
    supplier: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  tickets: {
    id?: string;
    attraction: string;
    quantity: number;
    costPerTicket: number;
    totalCost: number;
    supplier: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  meals: {
    id?: string;
    type: string;
    count: number;
    costPerPerson: number;
    totalCost: number;
    description: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  guides: {
    id?: string;
    type: string;
    days: number;
    costPerDay: number;
    totalCost: number;
    language: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  otherExpenses: {
    id?: string;
    description: string;
    amount: number;
  }[];

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  serviceFee: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  profit: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  profitMargin: number;

  @Column({
    type: 'enum',
    enum: ProfitWarningLevel,
    default: ProfitWarningLevel.NORMAL,
  })
  profitWarning: ProfitWarningLevel;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  approvedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approvedById' })
  approvedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  approvalComments: string;

  @OneToMany(() => QuoteVersion, version => version.quote)
  versions: QuoteVersion[];

  @OneToOne(() => Contract, contract => contract.quote)
  contract: Contract;

  @Column({ type: 'timestamp', nullable: true })
  sentToCustomerAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  customerResponseAt: Date;
}
