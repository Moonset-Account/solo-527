import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum NotificationType {
  APPROVAL_REQUEST = 'approval_request',
  APPROVAL_RESULT = 'approval_result',
  MATERIAL_INCOMPLETE = 'material_incomplete',
  MATERIAL_COMPLETE = 'material_complete',
  CONTRACT_REJECTED = 'contract_rejected',
  CONTRACT_APPROVED = 'contract_approved',
  CONFLICT_CREATED = 'conflict_created',
  CONFLICT_RESOLVED = 'conflict_resolved',
  ARCHIVE_REMINDER = 'archive_reminder',
  SYSTEM = 'system',
  CALLBACK_FAILURE = 'callback_failure',
  CUSTOM = 'custom',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  WECHAT = 'wechat',
  DINGTALK = 'dingtalk',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
  RETRYING = 'retrying',
  READ = 'read',
}

@Entity('notifications')
@Index(['recipientId', 'status', 'createdAt'])
@Index(['type', 'status'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true, comment: '接收人ID' })
  recipientId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '接收人手机/邮箱' })
  recipientTarget: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM,
    comment: '通知类型',
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    default: NotificationChannel.IN_APP,
    comment: '通知渠道',
  })
  channel: NotificationChannel;

  @Column({ type: 'varchar', length: 255, comment: '通知标题' })
  title: string;

  @Column({ type: 'text', nullable: true, comment: '通知内容' })
  content: string;

  @Column({ type: 'json', nullable: true, comment: '模板参数' })
  templateParams: Record<string, any>;

  @Column({ type: 'json', nullable: true, comment: '关联业务数据' })
  relatedData: {
    contractId?: string;
    approvalId?: string;
    conflictId?: string;
    callbackId?: string;
    extra?: Record<string, any>;
  };

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
    comment: '通知状态',
  })
  status: NotificationStatus;

  @Column({ type: 'integer', default: 0, comment: '重试次数' })
  retryCount: number;

  @Column({ type: 'integer', default: 3, comment: '最大重试次数' })
  maxRetryCount: number;

  @Column({ type: 'timestamptz', nullable: true, comment: '下次重试时间' })
  nextRetryAt: Date;

  @Column({ type: 'text', nullable: true, comment: '失败原因' })
  failureReason: string;

  @Column({ type: 'timestamptz', nullable: true, comment: '发送时间' })
  sentAt: Date;

  @Column({ type: 'timestamptz', nullable: true, comment: '读取时间' })
  readAt: Date;

  @Column({ type: 'timestamptz', nullable: true, comment: '过期时间' })
  expiresAt: Date;

  @CreateDateColumn({ type: 'timestamptz', comment: '创建时间' })
  createdAt: Date;
}
