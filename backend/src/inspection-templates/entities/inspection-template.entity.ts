import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum TemplateFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
}

@Entity('inspection_templates')
export class InspectionTemplate extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'simple-json' })
  items: { name: string; type: string; required: boolean; options?: string[] }[];

  @Column({ type: 'enum', enum: TemplateFrequency })
  frequency: TemplateFrequency;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'created_by' })
  createdBy: string;
}
