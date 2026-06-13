import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Event } from '../../modules/event/entities/event.entity';
import { Task } from '../../modules/task/entities/task.entity';
import { Todo } from '../../modules/todo/entities/todo.entity';
import { VoteRecord } from '../../modules/vote/entities/vote-record.entity';

export type UserRole = 'admin' | 'manager' | 'worker' | 'resident';
export type UserShift = 'morning' | 'afternoon' | 'night';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'manager', 'worker', 'resident'],
    default: 'resident',
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: ['morning', 'afternoon', 'night'],
    default: 'morning',
  })
  shift: UserShift;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  gridArea: string;

  @Column({ type: 'boolean', default: true })
  isVotingEligible: boolean;

  @Column({ type: 'text', nullable: true })
  votingIneligibleReason: string;

  @OneToMany(() => Event, event => event.reporter)
  reportedEvents: Event[];

  @OneToMany(() => Event, event => event.assignee)
  assignedEvents: Event[];

  @OneToMany(() => Task, task => task.assignee)
  assignedTasks: Task[];

  @OneToMany(() => Todo, todo => todo.assignee)
  assignedTodos: Todo[];

  @OneToMany(() => VoteRecord, record => record.voter)
  voteRecords: VoteRecord[];
}
