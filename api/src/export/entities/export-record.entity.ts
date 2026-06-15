import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity.js';

@Entity('export_records')
export class ExportRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'exporter_id' })
  exporter: User;

  @Column({ name: 'query_criteria', type: 'simple-json' })
  queryCriteria: Record<string, unknown>;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'file_path', nullable: true })
  filePath: string | null;

  @Column({ name: 'row_count', nullable: true })
  rowCount: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
