import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('appointment_slot_configs')
export class AppointmentSlotConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'day_of_week', type: 'int' })
  dayOfWeek: number;

  @Column({ name: 'start_time', length: 10 })
  startTime: string;

  @Column({ name: 'end_time', length: 10 })
  endTime: string;

  @Column({ name: 'interval', type: 'int', default: 60 })
  interval: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
