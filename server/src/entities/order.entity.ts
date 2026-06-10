import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Customer } from './customer.entity';
import { User } from './user.entity';
import { OrderProcess } from './order-process.entity';
import { DeliveryRequirement } from './delivery-requirement.entity';
import { ProductionProgress } from './production-progress.entity';
import { QualityInspection } from './quality-inspection.entity';
import { MaterialShortage } from './material-shortage.entity';
import { MaterialCost } from './material-cost.entity';

export type OrderStatus = 'pending' | 'confirmed' | 'in_production' | 'quality_check' | 'completed' | 'cancelled';

@Entity('orders')
export class Order extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true, name: 'order_no' })
  orderNo: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Column({ name: 'salesperson_id', type: 'uuid', nullable: true })
  salespersonId: string;

  @Column({ type: 'varchar', length: 200, name: 'product_name' })
  productName: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'product_spec' })
  productSpec: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, name: 'total_amount' })
  totalAmount: number;

  @Column({ type: 'timestamp', name: 'order_date' })
  orderDate: Date;

  @Column({ type: 'timestamp', name: 'delivery_date' })
  deliveryDate: Date;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'delivery_address' })
  deliveryAddress: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'confirmed', 'in_production', 'quality_check', 'completed', 'cancelled'],
    default: 'pending',
  })
  status: OrderStatus;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ type: 'int', default: 0, name: 'urgent_level' })
  urgentLevel: number;

  @Column({ type: 'simple-json', nullable: true, name: 'extra_fields' })
  extraFields: Record<string, any>;

  @ManyToOne(() => Customer, customer => customer.orders)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => User, user => user.orders)
  @JoinColumn({ name: 'salesperson_id' })
  salesperson: User;

  @OneToMany(() => OrderProcess, process => process.order, { cascade: true })
  processes: OrderProcess[];

  @OneToMany(() => DeliveryRequirement, requirement => requirement.order, { cascade: true })
  deliveryRequirements: DeliveryRequirement[];

  @OneToMany(() => ProductionProgress, progress => progress.order)
  productionProgress: ProductionProgress[];

  @OneToMany(() => QualityInspection, inspection => inspection.order)
  qualityInspections: QualityInspection[];

  @OneToMany(() => MaterialShortage, shortage => shortage.order)
  materialShortages: MaterialShortage[];

  @OneToMany(() => MaterialCost, cost => cost.order)
  materialCosts: MaterialCost[];
}
