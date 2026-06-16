import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('appointment_slot_configs')
export class AppointmentSlotConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', length: 100 })
  name: string;

  @Column({ name: 'start_time', length: 10 })
  startTime: string;

  @Column({ name: 'end_time', length: 10 })
  endTime: string;

  @Column({ name: 'interval_minutes', type: 'int', default: 60 })
  intervalMinutes: number;

  @Column({ name: 'max_appointments', type: 'int', default: 5 })
  maxAppointments: number;

  @Column({ name: 'is_enabled', type: 'boolean', default: true })
  isEnabled: boolean;

  @Column({ name: 'effective_date', type: 'date', nullable: true })
  effectiveDate: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
