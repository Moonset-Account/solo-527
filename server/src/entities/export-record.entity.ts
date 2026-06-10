import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

export type ExportType = 'order' | 'production' | 'material' | 'quality' | 'customer' | 'other';
export type ExportFormat = 'xlsx' | 'csv' | 'pdf';

@Entity('export_records')
export class ExportRecord extends BaseEntity {
  @Column({ type: 'varchar', length: 200, name: 'export_name' })
  exportName: string;

  @Column({
    type: 'enum',
    enum: ['order', 'production', 'material', 'quality', 'customer', 'other'],
    default: 'order',
  })
  exportType: ExportType;

  @Column({
    type: 'enum',
    enum: ['xlsx', 'csv', 'pdf'],
    default: 'xlsx',
  })
  exportFormat: ExportFormat;

  @Column({ type: 'simple-json', name: 'filter_criteria' })
  filterCriteria: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true, name: 'export_fields' })
  exportFields: string[];

  @Column({ type: 'int', default: 0, name: 'record_count' })
  recordCount: number;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'file_path' })
  filePath: string;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'file_name' })
  fileName: string;

  @Column({ type: 'varchar', length: 100, name: 'operator' })
  operator: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'operator_role' })
  operatorRole: string;

  @Column({ type: 'timestamp', name: 'export_time' })
  exportTime: Date;

  @Column({ type: 'simple-json', nullable: true, name: 'extra_info' })
  extraInfo: Record<string, any>;
}
