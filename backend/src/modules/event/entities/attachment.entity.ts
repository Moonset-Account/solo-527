import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Event } from './event.entity';
import { User } from '../../user/entities/user.entity';

@Entity('attachments')
export class Attachment extends BaseEntity {
  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @Column()
  path: string;

  @ManyToOne(() => Event, event => event.attachments)
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column()
  eventId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaderId' })
  uploader: User;

  @Column()
  uploaderId: string;
}
