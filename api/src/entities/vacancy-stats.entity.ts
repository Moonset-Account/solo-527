import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Room } from './room.entity.js';

@Entity('vacancy_stats')
export class VacancyStats {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'room_id', type: 'int' })
  roomId: number;

  @Column({ name: 'vacant_days', type: 'int', default: 0 })
  vacantDays: number;

  @Column({ name: 'total_days', type: 'int', default: 0 })
  totalDays: number;

  @Column({ name: 'vacancy_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  vacancyRate: number;

  @Column({ name: 'stats_date', type: 'date' })
  statsDate: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Room, (room) => room.vacancyStats)
  @JoinColumn({ name: 'room_id' })
  room: Room;
}
