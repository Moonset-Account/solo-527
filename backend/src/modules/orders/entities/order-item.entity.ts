import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LicenseType } from '../../../common/enums/material.enum';
import { Order } from './order.entity';
import { Material } from '../../materials/entities/material.entity';

@Entity('order_items')
export class OrderItem extends BaseEntity {
  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Column({ type: 'uuid', name: 'material_id' })
  materialId: string;

  @Column({ length: 200, name: 'material_title' })
  materialTitle: string;

  @Column({ type: 'text', name: 'material_cover_url', nullable: true })
  materialCoverUrl: string;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Material, (material) => material.orderItems)
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @Column({
    type: 'enum',
    enum: LicenseType,
    default: LicenseType.PERSONAL,
  })
  licenseType: LicenseType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'boolean', default: false, name: 'is_selected' })
  isSelected: boolean;

  @Column({ type: 'boolean', default: false, name: 'downloaded' })
  downloaded: boolean;

  @Column({ type: 'timestamp', name: 'selected_at', nullable: true })
  selectedAt: Date;

  @Column({ type: 'timestamp', name: 'downloaded_at', nullable: true })
  downloadedAt: Date;

  @Column({ type: 'text', nullable: true })
  remark: string;
}
