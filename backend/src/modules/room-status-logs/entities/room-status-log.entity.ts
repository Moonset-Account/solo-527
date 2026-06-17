import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Property } from '../../properties/entities/property.entity';
import { User } from '../../users/entities/user.entity';
import { PropertyStatus } from '../../properties/entities/property.entity';

@Entity('room_status_logs')
export class RoomStatusLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'property_id' })
  propertyId: string;

  @ManyToOne(() => Property)
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column({
    name: 'from_status',
    type: 'enum',
    enum: ['vacant', 'rented', 'maintenance', 'closed'],
  })
  fromStatus: PropertyStatus;

  @Column({
    name: 'to_status',
    type: 'enum',
    enum: ['vacant', 'rented', 'maintenance', 'closed'],
  })
  toStatus: PropertyStatus;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ nullable: true })
  source: string;

  @Column({ name: 'source_remark', type: 'text', nullable: true })
  sourceRemark: string;

  @Column({ name: 'operator_id', nullable: true })
  operatorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'operator_id' })
  operator: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
