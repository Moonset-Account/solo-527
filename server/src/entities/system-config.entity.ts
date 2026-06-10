import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

export type ConfigCategory = 'order' | 'production' | 'quality' | 'material' | 'team' | 'delivery' | 'export' | 'other';
export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'select' | 'multiselect' | 'textarea';

@Entity('system_configs')
export class SystemConfig extends BaseEntity {
  @Column({ type: 'varchar', length: 100, name: 'config_key', unique: true })
  configKey: string;

  @Column({ type: 'varchar', length: 200, name: 'config_name' })
  configName: string;

  @Column({
    type: 'enum',
    enum: ['order', 'production', 'quality', 'material', 'team', 'delivery', 'export', 'other'],
    default: 'other',
  })
  category: ConfigCategory;

  @Column({
    type: 'enum',
    enum: ['string', 'number', 'boolean', 'date', 'datetime', 'select', 'multiselect', 'textarea'],
    default: 'string',
  })
  fieldType: FieldType;

  @Column({ type: 'text', nullable: true, name: 'config_value' })
  configValue: string;

  @Column({ type: 'text', nullable: true, name: 'default_value' })
  defaultValue: string;

  @Column({ type: 'simple-json', nullable: true, name: 'field_options' })
  fieldOptions: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true, name: 'validation_rules' })
  validationRules: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true, name: 'threshold_config' })
  thresholdConfig: Record<string, any>;

  @Column({ type: 'text', nullable: true, name: 'description' })
  description: string;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_system' })
  isSystem: boolean;
}
