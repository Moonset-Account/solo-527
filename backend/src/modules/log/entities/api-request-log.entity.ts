import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { ApiRetryLog } from './api-retry-log.entity';

@Entity('api_request_logs')
export class ApiRequestLog extends BaseEntity {
  @Column({ name: 'request_id', type: 'uuid', nullable: false })
  requestId: string;

  @Column({ name: 'method', length: 10, nullable: false })
  method: string;

  @Column({ name: 'url', type: 'text', nullable: false })
  url: string;

  @Column({ name: 'headers', type: 'jsonb', nullable: true })
  headers: any;

  @Column({ name: 'request_body', type: 'text', nullable: true })
  requestBody: string;

  @Column({ name: 'response_body', type: 'text', nullable: true })
  responseBody: string;

  @Column({ name: 'status_code', nullable: true })
  statusCode: number;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'ip_address', length: 50, nullable: true })
  ipAddress: string;

  @Column({ name: 'duration', nullable: true })
  duration: number;

  @Column({ name: 'is_success', default: true })
  isSuccess: boolean;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'error_stack', type: 'text', nullable: true })
  errorStack: string;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @Column({ name: 'max_retries', default: 3 })
  maxRetries: number;

  @Column({ name: 'is_retryable', default: true })
  isRetryable: boolean;

  @OneToMany(() => ApiRetryLog, retryLog => retryLog.originalRequest)
  retryLogs: ApiRetryLog[];
}
