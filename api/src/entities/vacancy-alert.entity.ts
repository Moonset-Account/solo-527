import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Room } from './room.entity.js';
import { VacancyAlertConfig } from './vacancy-alert-config.entity.js';

@Entity('vacancy_alerts')
export class VacancyAlert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'room_id', type: 'int' })
  roomId: number;

  @Column({ name: 'config_id', type: 'int', nullable: true })
  configId: number;

  @Column({ name: 'alert_type', length: 50 })
  alertType: string;

  @Column({ name: 'threshold_days', type: 'int' })
  thresholdDays: number;

  @Column({ name: 'current_vacant_days', type: 'int' })
  currentVacantDays: number;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: 'active',
  })
  status: 'active' | 'read' | 'resolved';

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ name: 'project_area', length: 200, nullable: true })
  projectArea: string;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @Column({ name: 'vacancy_rate', type: 'decimal', precision: 5, scale: 4, default: 0 })
  vacancyRate: number;

  @Column({ name: 'threshold', type: 'decimal', precision: 5, scale: 4, default: 0 })
  threshold: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => VacancyAlertConfig)
  @JoinColumn({ name: 'config_id' })
  config: VacancyAlertConfig;
}
