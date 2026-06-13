import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Attachment } from './attachment.entity';
import { Note } from './note.entity';
import { History } from './history.entity';
import { Vote } from '../../vote/entities/vote.entity';
import { Task } from '../../task/entities/task.entity';

export type EventType = 'rectification' | 'vote' | 'patrol';
export type EventStatus = 'pending' | 'processing' | 'reviewing' | 'voting' | 'completed' | 'closed';

@Entity('events')
export class Event extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ['rectification', 'vote', 'patrol'],
  })
  type: EventType;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'reviewing', 'voting', 'completed', 'closed'],
    default: 'pending',
  })
  status: EventStatus;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  gridArea: string;

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @ManyToOne(() => User, user => user.reportedEvents)
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @Column()
  reporterId: string;

  @ManyToOne(() => User, user => user.assignedEvents, { nullable: true })
  @JoinColumn({ name: 'assigneeId' })
  assignee: User;

  @Column({ nullable: true })
  assigneeId: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewTime: Date;

  @Column({ type: 'text', nullable: true })
  reviewResult: string;

  @Column({ type: 'boolean', default: false })
  isRectified: boolean;

  @Column({ type: 'text', nullable: true })
  rectificationResult: string;

  @OneToMany(() => Attachment, attachment => attachment.event)
  attachments: Attachment[];

  @OneToMany(() => Note, note => note.event)
  notes: Note[];

  @OneToMany(() => History, history => history.event)
  histories: History[];

  @OneToMany(() => Vote, vote => vote.event)
  votes: Vote[];

  @OneToMany(() => Task, task => task.event)
  tasks: Task[];
}
