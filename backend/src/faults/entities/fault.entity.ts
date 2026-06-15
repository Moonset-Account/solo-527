import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum FaultSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum FaultStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  SUPPRESSED = 'SUPPRESSED',
  RESOLVED = 'RESOLVED',
}

@Entity('faults')
export class Fault extends BaseEntity {
  @Column()
  title: string;

  @Column({ name: 'reporter_name' })
  reporterName: string;

  @Column({ type: 'enum', enum: FaultSeverity, default: FaultSeverity.MEDIUM })
  severity: FaultSeverity;

  @Column({ type: 'enum', enum: FaultStatus, default: FaultStatus.OPEN })
  status: FaultStatus;

  @Column({ name: 'responsible_person', nullable: true })
  responsiblePerson: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  resolution: string;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ nullable: true })
  department: string;

  @Column({ name: 'system_name', nullable: true })
  systemName: string;

  @Column({ type: 'enum', enum: AlertStatus, default: AlertStatus.ACTIVE })
  alertStatus: AlertStatus;

  @Column({ name: 'alert_log_id', nullable: true })
  alertLogId: string;
}
