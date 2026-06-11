import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type NotificationType = 'info' | 'warning' | 'urgent';
export type NotificationCategory = 
  | 'resume_status'
  | 'interview_schedule'
  | 'score_dispute'
  | 'deadline_reminder'
  | 'escalation'
  | 'system';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({
    type: 'text',
    default: 'info'
  })
  type: NotificationType;

  @Column({
    type: 'text',
    default: 'system'
  })
  category: NotificationCategory;

  @Column()
  recipientId: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  relatedType: string;

  @Column({ nullable: true })
  relatedId: string;

  @Column({ nullable: true })
  actionUrl: string;

  @Column({ nullable: true })
  priority: number;

  @Column({ type: 'datetime', nullable: true })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('escalation_rules')
export class EscalationRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  eventType: string;

  @Column('int', { default: 24 })
  timeoutHours: number;

  @Column()
  primaryRole: string;

  @Column()
  escalateToRole: string;

  @Column({ default: true })
  isActive: boolean;

  @Column('text', { nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('notification_tasks')
export class NotificationTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  notificationId: string;

  @Column()
  assigneeId: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'datetime', nullable: true })
  deadline: Date;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date;

  @Column({ default: 0 })
  escalationLevel: number;

  @Column({ nullable: true })
  parentTaskId: string;

  @CreateDateColumn()
  createdAt: Date;
}
