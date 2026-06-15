import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum ChangeWindowEntityType {
  APPLICATION = 'APPLICATION',
  FAULT = 'FAULT',
}

export enum ChangeWindowStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('change_windows')
export class ChangeWindow extends BaseEntity {
  @Column({ type: 'enum', enum: ChangeWindowEntityType })
  entityType: ChangeWindowEntityType;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ name: 'start_time', type: 'timestamp' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp' })
  endTime: Date;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: string;

  @Column({ type: 'enum', enum: ChangeWindowStatus, default: ChangeWindowStatus.SCHEDULED })
  status: ChangeWindowStatus;

  @Column({ nullable: true })
  description: string;
}
