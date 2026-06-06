import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { QuoteItem } from './quote-item.entity';

export type SupplierType = 'hotel' | 'vehicle' | 'ticket' | 'guide';

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  type: SupplierType;

  @Column({ length: 200 })
  name: string;

  @Column({ name: 'contact_person', nullable: true, length: 100 })
  contactPerson: string;

  @Column({ name: 'contact_phone', nullable: true, length: 20 })
  contactPhone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
  rating: number;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: 'active' | 'inactive';

  @OneToMany(() => QuoteItem, item => item.supplier)
  quoteItems: QuoteItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
