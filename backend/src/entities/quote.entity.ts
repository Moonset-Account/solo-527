import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { Demand } from './demand.entity';
import { QuoteItem } from './quote-item.entity';
import { PaymentNode } from './payment-node.entity';
import { Contract } from './contract.entity';

export type QuoteStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'sent';

@Entity('quotes')
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Demand, demand => demand.quotes)
  @JoinColumn({ name: 'demand_id' })
  demand: Demand;

  @Column({ name: 'demand_id', nullable: true })
  demandId: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'varchar', length: 30, default: 'draft' })
  status: QuoteStatus;

  @Column({ name: 'total_cost', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalCost: number;

  @Column({ name: 'total_price', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalPrice: number;

  @Column({ name: 'profit_margin', type: 'decimal', precision: 5, scale: 2, default: 0 })
  profitMargin: number;

  @Column({ name: 'requires_manager_approval', type: 'boolean', default: false })
  requiresManagerApproval: boolean;

  @ManyToOne(() => User, user => user.createdQuotes)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ name: 'created_by', nullable: true })
  createdById: string;

  @OneToMany(() => QuoteItem, item => item.quote, { cascade: true })
  items: QuoteItem[];

  @OneToMany(() => PaymentNode, node => node.quote, { cascade: true })
  paymentNodes: PaymentNode[];

  @OneToOne(() => Contract, contract => contract.quote)
  contract: Contract;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
