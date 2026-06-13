import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../common/user.entity.js';

export const ExportTypeEnum = {
  FEEDBACKS: 'feedbacks',
  AFTER_SALE: 'after_sale',
  BUDGET: 'budget',
  PROJECTS: 'projects',
} as const;

export const ExportFormatEnum = {
  XLSX: 'xlsx',
  CSV: 'csv',
} as const;

export type ExportType = typeof ExportTypeEnum[keyof typeof ExportTypeEnum];
export type ExportFormat = typeof ExportFormatEnum[keyof typeof ExportFormatEnum];

@Entity('export_logs')
export class ExportLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, type: 'varchar' })
  type: ExportType;

  @Column({ length: 20, type: 'varchar', default: 'xlsx' })
  format: ExportFormat;

  @Column({ length: 255 })
  fileName: string;

  @Column({ type: 'int', default: 0 })
  recordCount: number;

  @Column({ type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'jsonb', nullable: true })
  filters: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
