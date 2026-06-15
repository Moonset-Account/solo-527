import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum RecordEntityType {
  APPLICATION = 'APPLICATION',
  FAULT = 'FAULT',
  INSPECTION_TASK = 'INSPECTION_TASK',
}

@Entity('processing_records')
export class ProcessingRecord extends BaseEntity {
  @Column({ type: 'enum', enum: RecordEntityType })
  entityType: RecordEntityType;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column()
  action: string;

  @Column()
  operator: string;

  @Column({ name: 'operator_name' })
  operatorName: string;

  @Column({ type: 'simple-json', nullable: true })
  details: Record<string, any>;

  @Column({ name: 'previous_value', type: 'simple-json', nullable: true })
  previousValue: Record<string, any>;

  @Column({ name: 'new_value', type: 'simple-json', nullable: true })
  newValue: Record<string, any>;
}
