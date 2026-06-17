import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Property } from '../../properties/entities/property.entity';
import { User } from '../../users/entities/user.entity';
import { TicketLog } from './ticket-log.entity';

export type TicketType = 'maintenance' | 'complaint';
export type TicketStatus = 'pending' | 'processing' | 'completed' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  ticketNo: string;

  @Column({
    type: 'enum',
    enum: ['maintenance', 'complaint'],
  })
  type: TicketType;

  @Column()
  propertyId: string;

  @ManyToOne(() => Property)
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'closed'],
    default: 'pending',
  })
  status: TicketStatus;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  })
  priority: TicketPriority;

  @Column({ nullable: true })
  reporterName: string;

  @Column({ nullable: true })
  reporterContact: string;

  @Column({ nullable: true })
  assigneeId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigneeId' })
  assignee: User;

  @Column({ type: 'text', nullable: true })
  closeRemark: string;

  @Column({ nullable: true })
  source: string;

  @Column({ type: 'text', nullable: true })
  sourceRemark: string;

  @OneToMany(() => TicketLog, (log) => log.ticket)
  logs: TicketLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
