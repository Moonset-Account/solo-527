import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vacancy_alert_configs')
export class VacancyAlertConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', length: 100 })
  name: string;

  @Column({ name: 'alert_type', length: 50 })
  alertType: string;

  @Column({ name: 'threshold_days', type: 'int' })
  thresholdDays: number;

  @Column({ name: 'is_enabled', type: 'boolean', default: true })
  isEnabled: boolean;

  @Column({ name: 'notify_roles', type: 'simple-array', nullable: true })
  notifyRoles: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
