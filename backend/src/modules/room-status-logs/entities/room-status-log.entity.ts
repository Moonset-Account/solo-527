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

  @Column()
  propertyId: string;

  @ManyToOne(() => Property)
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column({
    type: 'enum',
    enum: ['vacant', 'rented', 'maintenance', 'closed'],
  })
  fromStatus: PropertyStatus;

  @Column({
    type: 'enum',
    enum: ['vacant', 'rented', 'maintenance', 'closed'],
  })
  toStatus: PropertyStatus;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ nullable: true })
  source: string;

  @Column({ type: 'text', nullable: true })
  sourceRemark: string;

  @Column({ nullable: true })
  operatorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'operatorId' })
  operator: User;

  @CreateDateColumn()
  createdAt: Date;
}
