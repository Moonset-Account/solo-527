import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Quote } from './quote.entity';
import { User } from './user.entity';

@Entity('quote_versions')
export class QuoteVersion extends BaseEntity {
  @Column()
  quoteId: string;

  @ManyToOne(() => Quote, quote => quote.versions)
  @JoinColumn({ name: 'quoteId' })
  quote: Quote;

  @Column({ type: 'int' })
  version: number;

  @Column({ type: 'jsonb' })
  snapshot: {
    hotels: any[];
    transportation: any[];
    tickets: any[];
    meals: any[];
    guides: any[];
    otherExpenses: any[];
    totalCost: number;
    serviceFee: number;
    totalPrice: number;
    profit: number;
    profitMargin: number;
    remarks: string;
  };

  @Column({ type: 'text', nullable: true })
  changeDescription: string;

  @Column({ nullable: true })
  modifiedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'modifiedById' })
  modifiedBy: User;
}
