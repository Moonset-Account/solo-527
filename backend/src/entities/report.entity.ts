import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum ReportType {
  SERVICE_REPURCHASE = 'service_repurchase',
  FOSTER_SAFETY = 'foster_safety',
  ADOPTION_STATISTICS = 'adoption_statistics',
  HEALTH_STATISTICS = 'health_statistics',
  TRAINING_STATISTICS = 'training_statistics',
  APPOINTMENT_SUMMARY = 'appointment_summary',
  CUSTOM = 'custom',
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: ReportType,
  })
  type: ReportType;

  @Column({
    type: 'enum',
    enum: ReportFormat,
    default: ReportFormat.EXCEL,
  })
  format: ReportFormat;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'initiatorId' })
  initiator: User;

  @Column()
  initiatorId: string;

  @Column({ type: 'text' })
  dataScope: string;

  @Column({ type: 'text' })
  statisticalCaliber: string;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ type: 'json', nullable: true })
  filters: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  summaryData: Record<string, any>;

  @Column({ nullable: true })
  filePath: string;

  @Column({ default: 0 })
  downloadCount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}
