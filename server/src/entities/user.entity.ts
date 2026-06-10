import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Order } from './order.entity';

export type UserRole = 'admin' | 'sales' | 'production' | 'quality' | 'warehouse';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'sales', 'production', 'quality', 'warehouse'],
    default: 'sales',
  })
  role: UserRole;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'simple-json', nullable: true, name: 'extra_fields' })
  extraFields: Record<string, any>;

  @OneToMany(() => Order, order => order.salesperson)
  orders: Order[];
}
