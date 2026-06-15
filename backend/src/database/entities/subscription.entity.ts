import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Customer } from './customer.entity';
import { Bill } from './bill.entity';

export type BillingCycle = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';

@Entity('subscriptions')
export class Subscription extends BaseEntity {
  @Column({ type: 'uuid' })
  customerId: string;

  @Column()
  planName: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10 })
  currency: string;

  @Column({
    type: 'enum',
    enum: ['monthly', 'quarterly', 'semi-annual', 'annual'],
    default: 'monthly'
  })
  billingCycle: BillingCycle;

  @Column({ type: 'timestamp with time zone' })
  startDate: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  endDate: Date;

  @Column({ default: 'active' })
  status: 'active' | 'paused' | 'cancelled' | 'expired';

  @Column({ type: 'jsonb', nullable: true })
  features: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => Customer, customer => customer.subscriptions)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @OneToMany(() => Bill, bill => bill.subscription)
  bills: Bill[];
}
