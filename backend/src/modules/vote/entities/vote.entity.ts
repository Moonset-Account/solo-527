import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Event } from '../../event/entities/event.entity';
import { User } from '../../user/entities/user.entity';
import { VoteRecord } from './vote-record.entity';
import { VoteRule } from './vote-rule.entity';

export type VoteStatus = 'draft' | 'ongoing' | 'ended' | 'cancelled';
export type VoteType = 'single' | 'multiple';

@Entity('votes')
export class Vote extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ['single', 'multiple'],
    default: 'single',
  })
  type: VoteType;

  @Column({
    type: 'enum',
    enum: ['draft', 'ongoing', 'ended', 'cancelled'],
    default: 'draft',
  })
  status: VoteStatus;

  @Column({ type: 'jsonb' })
  options: { id: string; text: string; count: number }[];

  @Column({ type: 'timestamp', nullable: true })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ type: 'int', default: 0 })
  totalVotes: number;

  @Column({ type: 'int', default: 0 })
  eligibleVoters: number;

  @Column({ type: 'boolean', default: true })
  allowAbstain: boolean;

  @Column({ type: 'int', default: 0 })
  abstainCount: number;

  @ManyToOne(() => VoteRule, rule => rule.votes, { nullable: true })
  @JoinColumn({ name: 'ruleId' })
  rule: VoteRule;

  @Column({ nullable: true })
  ruleId: string;

  @ManyToOne(() => Event, event => event.votes, { nullable: true })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column({ nullable: true })
  eventId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Column()
  creatorId: string;

  @OneToMany(() => VoteRecord, record => record.vote)
  records: VoteRecord[];
}
