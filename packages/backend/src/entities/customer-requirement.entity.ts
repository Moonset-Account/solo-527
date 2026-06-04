import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Quote } from './quote.entity';

export enum RequirementStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  IN_PROGRESS = 'in_progress',
  QUOTED = 'quoted',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

export enum TripType {
  LEISURE = 'leisure',
  BUSINESS = 'business',
  FAMILY = 'family',
  HONEYMOON = 'honeymoon',
  GROUP = 'group',
}

@Entity('customer_requirements')
export class CustomerRequirement extends BaseEntity {
  @Column()
  customerName: string;

  @Column()
  customerPhone: string;

  @Column({ nullable: true })
  customerEmail: string;

  @Column({ nullable: true })
  customerCompany: string;

  @Column({
    type: 'enum',
    enum: TripType,
    default: TripType.LEISURE,
  })
  tripType: TripType;

  @Column()
  destination: string;

  @Column({ type: 'int' })
  travelerCount: number;

  @Column({ type: 'int' })
  adultCount: number;

  @Column({ type: 'int', default: 0 })
  childCount: number;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'int' })
  durationDays: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  budgetRangeMin: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  budgetRangeMax: number;

  @Column({ type: 'text', nullable: true })
  hotelRequirements: string;

  @Column({ type: 'text', nullable: true })
  transportationNeeds: string;

  @Column({ type: 'text', nullable: true })
  attractions: string;

  @Column({ type: 'text', nullable: true })
  specialRequirements: string;

  @Column({ type: 'text', nullable: true })
  diningPreferences: string;

  @Column({
    type: 'enum',
    enum: RequirementStatus,
    default: RequirementStatus.DRAFT,
  })
  status: RequirementStatus;

  @Column({ nullable: true })
  assignedToId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @OneToMany(() => Quote, quote => quote.requirement)
  quotes: Quote[];

  @Column({ type: 'timestamp', nullable: true })
  followUpAt: Date;

  @Column({ type: 'text', nullable: true })
  internalNotes: string;
}
