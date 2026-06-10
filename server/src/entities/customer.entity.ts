import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Order } from './order.entity';
import { PriceList } from './price-list.entity';

@Entity('customers')
export class Customer extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'contact_person' })
  contactPerson: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'tax_number' })
  taxNumber: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  remark: string;

  @Column({ type: 'simple-json', nullable: true, name: 'extra_fields' })
  extraFields: Record<string, any>;

  @OneToMany(() => Order, order => order.customer)
  orders: Order[];

  @OneToMany(() => PriceList, priceList => priceList.customer)
  priceLists: PriceList[];
}
