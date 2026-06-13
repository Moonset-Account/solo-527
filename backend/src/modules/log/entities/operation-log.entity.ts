import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Clinic } from '../../clinic/entities/clinic.entity';

@Entity('operation_logs')
export class OperationLog extends BaseEntity {
  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => User, user => user.operationLogs)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'clinic_id', nullable: true })
  clinicId: string;

  @ManyToOne(() => Clinic)
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @Column({ name: 'module', length: 50, nullable: false })
  module: string;

  @Column({ name: 'action', length: 50, nullable: false })
  action: string;

  @Column({ name: 'target_type', length: 50, nullable: true })
  targetType: string;

  @Column({ name: 'target_id', type: 'uuid', nullable: true })
  targetId: string;

  @Column({ name: 'old_value', type: 'jsonb', nullable: true })
  oldValue: any;

  @Column({ name: 'new_value', type: 'jsonb', nullable: true })
  newValue: any;

  @Column({ name: 'ip_address', length: 50, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ name: 'status', length: 20, default: 'success' })
  status: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;
}
