import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../auth/user.entity.js';

export type ExportType = 'feedbacks' | 'after_sale' | 'budget' | 'projects';
export type ExportFormat = 'xlsx' | 'csv';

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
