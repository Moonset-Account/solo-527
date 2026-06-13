import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Vote } from './vote.entity';

@Entity('vote_rules')
export class VoteRule extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int', default: 50 })
  passThreshold: number;

  @Column({ type: 'int', default: 30 })
  quorumThreshold: number;

  @Column({ type: 'int', default: 24 })
  votingDurationHours: number;

  @Column({ type: 'boolean', default: true })
  allowProxyVoting: boolean;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'jsonb', nullable: true })
  eligibleRoles: string[];

  @OneToMany(() => Vote, vote => vote.rule)
  votes: Vote[];
}
