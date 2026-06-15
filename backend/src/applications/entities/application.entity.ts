import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum AccountType {
  NEW_ACCOUNT = 'NEW_ACCOUNT',
  MODIFY_ACCOUNT = 'MODIFY_ACCOUNT',
  DISABLE_ACCOUNT = 'DISABLE_ACCOUNT',
  ENABLE_ACCOUNT = 'ENABLE_ACCOUNT',
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSING = 'IN_PROGRESS',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

@Entity('applications')
export class Application extends BaseEntity {
  @Column()
  title: string;

  @Column({ name: 'applicant_name' })
  applicantName: string;

  @Column({ type: 'enum', enum: AccountType })
  accountType: AccountType;

  @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.PENDING })
  status: ApplicationStatus;

  @Column({ type: 'enum', enum: Priority, default: Priority.MEDIUM })
  priority: Priority;

  @Column({ name: 'responsible_person', nullable: true })
  responsiblePerson: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  department: string;

  @Column({ name: 'system_name', nullable: true })
  systemName: string;

  @Column({ name: 'change_window_start', type: 'timestamp', nullable: true })
  changeWindowStart: Date;

  @Column({ name: 'change_window_end', type: 'timestamp', nullable: true })
  changeWindowEnd: Date;

  @Column({ nullable: true })
  reason: string;

  @Column({ name: 'operator_name', nullable: true })
  operatorName: string;
}
