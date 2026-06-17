import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type PropertyType = 'private_office' | 'hot_desk' | 'meeting_room' | 'long_term';
export type PropertyStatus = 'vacant' | 'rented' | 'maintenance' | 'closed';

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ['private_office', 'hot_desk', 'meeting_room', 'long_term'],
  })
  type: PropertyType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area: number;

  @Column({ type: 'int', nullable: true })
  capacity: number;

  @Column({ nullable: true })
  floor: string;

  @Column({ nullable: true })
  building: string;

  @Column({
    type: 'enum',
    enum: ['vacant', 'rented', 'maintenance', 'closed'],
    default: 'vacant',
  })
  status: PropertyStatus;

  @Column({ name: 'base_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
  basePrice: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'close_reason', type: 'text', nullable: true })
  closeReason: string;

  @Column({ nullable: true })
  source: string;

  @Column({ name: 'source_remark', type: 'text', nullable: true })
  sourceRemark: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
