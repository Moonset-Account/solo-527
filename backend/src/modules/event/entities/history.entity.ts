import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Event } from './event.entity';
import { User } from '../../user/entities/user.entity';

@Entity('histories')
export class History extends BaseEntity {
  @Column()
  action: string;

  @Column({ type: 'text', nullable: true })
  oldValue: string;

  @Column({ type: 'text', nullable: true })
  newValue: string;

  @Column({ type: 'text', nullable: true })
  changes: string;

  @ManyToOne(() => Event, event => event.histories)
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column()
  eventId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'operatorId' })
  operator: User;

  @Column()
  operatorId: string;
}
