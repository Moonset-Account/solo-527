import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TicketType, TicketStatus, TicketPriority } from '../../../../shared/types.js';
import { User } from '../../user/entities/user.entity.js';
import { TimelineEvent } from './timeline-event.entity.js';
import { TicketAsset } from './ticket-asset.entity.js';
import { SlaDetail } from './sla-detail.entity.js';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'enum', enum: TicketType })
  type: TicketType;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.pending })
  status: TicketStatus;

  @Column({ type: 'enum', enum: TicketPriority, default: TicketPriority.medium })
  priority: TicketPriority;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee: User | null;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => TimelineEvent, (event) => event.ticket)
  timelineEvents: TimelineEvent[];

  @OneToMany(() => SlaDetail, (sla) => sla.ticket)
  slaDetails: SlaDetail[];

  @OneToMany(() => TicketAsset, (ta) => ta.ticket)
  ticketAssets: TicketAsset[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
