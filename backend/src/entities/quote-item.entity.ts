import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Quote } from './quote.entity';
import { Supplier } from './supplier.entity';

export type QuoteItemType = 'hotel' | 'vehicle' | 'ticket' | 'service' | 'other';

@Entity('quote_items')
export class QuoteItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Quote, quote => quote.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quote_id' })
  quote: Quote;

  @Column({ name: 'quote_id', nullable: true })
  quoteId: string;

  @Column({ type: 'varchar', length: 20 })
  type: QuoteItemType;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 12, scale: 2, default: 0 })
  unitCost: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2, default: 0 })
  unitPrice: number;

  @ManyToOne(() => Supplier, supplier => supplier.quoteItems, { nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ name: 'supplier_id', nullable: true })
  supplierId: string;
}
