import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SlaStage } from '../../../../shared/types.js';
import { Ticket } from './ticket.entity.js';
import { User } from '../../user/entities/user.entity.js';

@Entity('sla_details')
export class SlaDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Ticket, (ticket) => ticket.slaDetails)
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Column({ type: 'enum', enum: SlaStage })
  stage: SlaStage;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'operator_id' })
  operator: User | null;

  @Column({ name: 'started_at', type: 'timestamp' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'duration_minutes', nullable: true })
  durationMinutes: number | null;

  @Column({ name: 'is_overdue', default: false })
  isOverdue: boolean;
}
