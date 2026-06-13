import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Event } from './event.entity';
import { User } from '../../user/entities/user.entity';

@Entity('notes')
export class Note extends BaseEntity {
  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => Event, event => event.notes)
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column()
  eventId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Column()
  creatorId: string;
}
