import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ApiRequestLog } from './api-request-log.entity';

@Entity('api_retry_logs')
export class ApiRetryLog extends BaseEntity {
  @Column({ name: 'original_request_id', nullable: false })
  originalRequestId: string;

  @ManyToOne(() => ApiRequestLog, requestLog => requestLog.retryLogs)
  @JoinColumn({ name: 'original_request_id' })
  originalRequest: ApiRequestLog;

  @Column({ name: 'request_id', type: 'uuid', nullable: false })
  requestId: string;

  @Column({ name: 'attempt_number', nullable: false })
  attemptNumber: number;

  @Column({ name: 'method', length: 10, nullable: false })
  method: string;

  @Column({ name: 'url', type: 'text', nullable: false })
  url: string;

  @Column({ name: 'status_code', nullable: true })
  statusCode: number;

  @Column({ name: 'is_success', default: false })
  isSuccess: boolean;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'delay_ms', nullable: true })
  delayMs: number;

  @Column({ name: 'duration', nullable: true })
  duration: number;
}
