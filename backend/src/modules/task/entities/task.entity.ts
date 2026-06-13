import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Event } from '../../event/entities/event.entity';
import { User } from '../../user/entities/user.entity';

export type TaskType = 'rectification' | 'patrol' | 'review';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

@Entity('tasks')
export class Task extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['rectification', 'patrol', 'review'],
  })
  type: TaskType;

  @Column({
    type: 'enum',
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  })
  status: TaskStatus;

  @Column({ type: 'timestamp', nullable: true })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date;

  @Column({ type: 'text', nullable: true })
  checkpoints: string;

  @Column({ type: 'text', nullable: true })
  result: string;

  @ManyToOne(() => Event, event => event.tasks, { nullable: true })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column({ nullable: true })
  eventId: string;

  @ManyToOne(() => User, user => user.assignedTasks)
  @JoinColumn({ name: 'assigneeId' })
  assignee: User;

  @Column()
  assigneeId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Column()
  creatorId: string;
}
