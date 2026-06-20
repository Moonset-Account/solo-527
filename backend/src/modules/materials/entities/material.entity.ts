import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MaterialStatus, LicenseType, MaterialCategory } from '../../../common/enums/material.enum';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { Attachment } from '../../attachments/entities/attachment.entity';

@Entity('materials')
export class Material extends BaseEntity {
  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', name: 'cover_image_url' })
  coverImageUrl: string;

  @Column({
    type: 'enum',
    enum: MaterialCategory,
    default: MaterialCategory.OTHER,
  })
  category: MaterialCategory;

  @Column({
    type: 'enum',
    enum: MaterialStatus,
    default: MaterialStatus.DRAFT,
  })
  status: MaterialStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'price_personal' })
  pricePersonal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'price_commercial' })
  priceCommercial: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'price_exclusive', nullable: true })
  priceExclusive: number;

  @Column({
    type: 'simple-array',
    nullable: true,
  })
  tags: string[];

  @Column({ type: 'text', name: 'license_description', nullable: true })
  licenseDescription: string;

  @Column({ type: 'json', nullable: true })
  licenseTerms: Record<string, any>;

  @Column({ type: 'int', default: 0, name: 'view_count' })
  viewCount: number;

  @Column({ type: 'int', default: 0, name: 'sale_count' })
  saleCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5, name: 'average_rating' })
  averageRating: number;

  @Column({ type: 'uuid', name: 'photographer_id' })
  photographerId: string;

  @ManyToOne(() => User, (user) => user.materials)
  @JoinColumn({ name: 'photographer_id' })
  photographer: User;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.material)
  orderItems: OrderItem[];

  @OneToMany(() => Attachment, (attachment) => attachment.material)
  attachments: Attachment[];
}
