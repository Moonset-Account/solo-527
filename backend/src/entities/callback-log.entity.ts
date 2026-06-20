import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum CallbackType {
  NOTIFICATION = 'notification',
  PAYMENT = 'payment',
  ESIGN = 'esign',
  SMS = 'sms',
  EMAIL = 'email',
  WECHAT = 'wechat',
  WEBHOOK = 'webhook',
}

export enum CallbackStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  RETRYING = 'retrying',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
}

@Entity('callback_logs')
@Index(['callbackType', 'status'])
@Index(['relatedId', 'relatedType'])
@Index(['createdAt'])
export class CallbackLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true, comment: '回调请求唯一标识' })
  requestId: string;

  @Column({
    type: 'enum',
    enum: CallbackType,
    comment: '回调类型',
  })
  callbackType: CallbackType;

  @Column({
    type: 'enum',
    enum: CallbackStatus,
    default: CallbackStatus.PENDING,
    comment: '回调状态',
  })
  status: CallbackStatus;

  @Column({ type: 'varchar', length: 500, comment: '回调目标URL' })
  targetUrl: string;

  @Column({ type: 'varchar', length: 10, default: 'POST', comment: 'HTTP方法' })
  httpMethod: string;

  @Column({ type: 'text', nullable: true, comment: '请求参数' })
  requestPayload: string;

  @Column({ type: 'json', nullable: true, comment: '请求头' })
  requestHeaders: Record<string, string>;

  @Column({ type: 'integer', default: 0, comment: '重试次数' })
  retryCount: number;

  @Column({ type: 'integer', default: 5, comment: '最大重试次数' })
  maxRetryCount: number;

  @Column({ type: 'timestamptz', nullable: true, comment: '下次重试时间' })
  nextRetryAt: Date;

  @Column({ type: 'text', nullable: true, comment: '失败原因' })
  failureReason: string;

  @Column({ type: 'integer', nullable: true, comment: 'HTTP响应状态码' })
  responseStatusCode: number;

  @Column({ type: 'text', nullable: true, comment: '响应内容' })
  responseBody: string;

  @Column({ type: 'json', nullable: true, comment: '响应头' })
  responseHeaders: Record<string, string>;

  @Column({ type: 'bigint', nullable: true, comment: '请求耗时(毫秒)' })
  durationMs: number;

  @Column({ type: 'uuid', nullable: true, comment: '关联业务ID' })
  relatedId: string;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '关联业务类型' })
  relatedType: string;

  @Column({ type: 'uuid', nullable: true, comment: '触发用户ID' })
  triggeredBy: string;

  @Column({ type: 'json', nullable: true, comment: '重试历史记录' })
  retryHistory: {
    attempt: number;
    time: Date;
    status: string;
    statusCode: number;
    error: string;
    durationMs: number;
  }[];

  @Column({ type: 'timestamptz', nullable: true, comment: '首次请求时间' })
  firstAttemptAt: Date;

  @Column({ type: 'timestamptz', nullable: true, comment: '最后一次请求时间' })
  lastAttemptAt: Date;

  @Column({ type: 'timestamptz', nullable: true, comment: '成功处理时间' })
  completedAt: Date;

  @CreateDateColumn({ type: 'timestamptz', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', comment: '更新时间' })
  updatedAt: Date;
}
