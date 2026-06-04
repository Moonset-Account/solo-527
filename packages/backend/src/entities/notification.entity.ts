import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum NotificationType {
  SYSTEM = 'system',
  QUOTE_APPROVAL = 'quote_approval',
  CONTRACT_APPROVAL = 'contract_approval',
  REQUIREMENT_ASSIGNED = 'requirement_assigned',
  STATUS_CHANGE = 'status_change',
  PROFIT_WARNING = 'profit_warning',
  TASK_REMINDER = 'task_reminder',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  BOTH = 'both',
}

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column()
  recipientId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recipientId' })
  recipient: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    default: NotificationChannel.IN_APP,
  })
  channel: NotificationChannel;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  relatedData: {
    entityType: string;
    entityId: string;
    actionUrl?: string;
  };

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ type: 'boolean', default: false })
  emailSent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  emailSentAt: Date;
}
