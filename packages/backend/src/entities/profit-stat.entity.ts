import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum StatPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

@Entity('profit_stats')
export class ProfitStat extends BaseEntity {
  @Column({
    type: 'enum',
    enum: StatPeriod,
  })
  period: StatPeriod;

  @Column({ type: 'date' })
  periodStart: Date;

  @Column({ type: 'date' })
  periodEnd: Date;

  @Column({ nullable: true })
  salesPersonId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'salesPersonId' })
  salesPerson: User;

  @Column({ type: 'int', default: 0 })
  totalQuotes: number;

  @Column({ type: 'int', default: 0 })
  acceptedQuotes: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalRevenue: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalProfit: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  averageProfitMargin: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  conversionRate: number;

  @Column({ type: 'jsonb', nullable: true })
  breakdown: {
    hotelProfit: number;
    transportationProfit: number;
    ticketProfit: number;
    serviceFeeProfit: number;
    otherProfit: number;
  };
}
