import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

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

  @OneToMany('Event', 'reporter')
  reportedEvents: any[];

  @OneToMany('Event', 'assignee')
  assignedEvents: any[];

  @OneToMany('Task', 'assignee')
  assignedTasks: any[];

  @OneToMany('Todo', 'assignee')
  assignedTodos: any[];

  @OneToMany('VoteRecord', 'voter')
  voteRecords: any[];
}
