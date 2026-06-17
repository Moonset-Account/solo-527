import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Ticket } from './ticket.entity';
import { User } from '../../users/entities/user.entity';

@Entity('ticket_logs')
export class TicketLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ticketId: string;

  @ManyToOne(() => Ticket, (ticket) => ticket.logs)
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;

  @Column()
  action: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ nullable: true })
  operatorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'operatorId' })
  operator: User;

  @CreateDateColumn()
  createdAt: Date;
}
