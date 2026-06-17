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

  @Column({ name: 'ticket_no', unique: true })
  ticketNo: string;

  @Column({
    type: 'enum',
    enum: ['maintenance', 'complaint'],
  })
  type: TicketType;

  @Column({ name: 'property_id' })
  propertyId: string;

  @ManyToOne(() => Property)
  @JoinColumn({ name: 'property_id' })
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

  @Column({ name: 'reporter_name', nullable: true })
  reporterName: string;

  @Column({ name: 'reporter_contact', nullable: true })
  reporterContact: string;

  @Column({ name: 'assignee_id', nullable: true })
  assigneeId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assignee_id' })
  assignee: User;

  @Column({ type: 'text', nullable: true })
  closeRemark: string;

  @Column({ nullable: true })
  source: string;

  @Column({ name: 'source_remark', type: 'text', nullable: true })
  sourceRemark: string;

  @OneToMany(() => TicketLog, (log) => log.ticket)
  logs: TicketLog[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
