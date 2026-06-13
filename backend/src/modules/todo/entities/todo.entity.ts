import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';

export type TodoType = 'voting_exception' | 'review' | 'follow_up' | 'urgent';
export type TodoStatus = 'pending' | 'processing' | 'completed';

@Entity('todos')
export class Todo extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ['voting_exception', 'review', 'follow_up', 'urgent'],
  })
  type: TodoType;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed'],
    default: 'pending',
  })
  status: TodoStatus;

  @Column({ type: 'int', default: 1 })
  priority: number;

  @Column({ nullable: true })
  relatedModule: string;

  @Column({ nullable: true })
  relatedId: string;

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date;

  @Column({ type: 'boolean', default: false })
  affectsHelpProgress: boolean;

  @Column({ type: 'text', nullable: true })
  helpProgressImpact: string;

  @ManyToOne(() => User, user => user.assignedTodos)
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
