import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { EventType, EventResult } from '../../../../shared/types.js';
import { Ticket } from './ticket.entity.js';
import { User } from '../../user/entities/user.entity.js';

@Entity('timeline_events')
export class TimelineEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Ticket, (ticket) => ticket.timelineEvents)
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Column({ type: 'enum', enum: EventType })
  eventType: EventType;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: EventResult, default: EventResult.success })
  result: EventResult;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'operator_id' })
  operator: User;

  @Column({ type: 'simple-json', nullable: true })
  payload: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
