import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Customer } from './customer.entity';

export type PriceListStatus = 'active' | 'inactive';

@Entity('price_lists')
export class PriceList extends BaseEntity {
  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Column({ type: 'varchar', length: 200, name: 'product_name' })
  productName: string;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'product_spec' })
  productSpec: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'varchar', length: 50, name: 'price_unit' })
  priceUnit: string;

  @Column({ type: 'int', nullable: true, name: 'min_quantity' })
  minQuantity: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  remark: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: PriceListStatus;

  @Column({ type: 'simple-json', nullable: true, name: 'extra_fields' })
  extraFields: Record<string, any>;

  @ManyToOne(() => Customer, customer => customer.priceLists)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;
}
