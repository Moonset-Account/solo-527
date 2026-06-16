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
    type: 'enum',
    enum: ['active', 'read', 'resolved'],
    default: 'active',
  })
  status: 'active' | 'read' | 'resolved';

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date;

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
