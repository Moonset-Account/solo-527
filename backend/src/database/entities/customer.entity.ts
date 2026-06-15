import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Subscription } from './subscription.entity';
import { Bill } from './bill.entity';

@Entity('customers')
export class Customer extends BaseEntity {
  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  company: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'jsonb', nullable: true })
  contactPersons: Array<{ name: string; role: string; email: string; phone: string }>;

  @Column({ default: 'active' })
  status: 'active' | 'inactive' | 'suspended';

  @OneToMany(() => Subscription, subscription => subscription.customer)
  subscriptions: Subscription[];

  @OneToMany(() => Bill, bill => bill.customer)
  bills: Bill[];
}
