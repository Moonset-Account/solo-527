import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Vote } from './vote.entity';
import { User } from '../../user/entities/user.entity';

@Entity('vote_records')
export class VoteRecord extends BaseEntity {
  @Column({ type: 'jsonb', nullable: true })
  selectedOptions: string[];

  @Column({ type: 'boolean', default: false })
  isAbstained: boolean;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'boolean', default: false })
  hasVotingException: boolean;

  @Column({ type: 'text', nullable: true })
  votingExceptionReason: string;

  @ManyToOne(() => Vote, vote => vote.records)
  @JoinColumn({ name: 'voteId' })
  vote: Vote;

  @Column()
  voteId: string;

  @ManyToOne(() => User, user => user.voteRecords)
  @JoinColumn({ name: 'voterId' })
  voter: User;

  @Column()
  voterId: string;
}
