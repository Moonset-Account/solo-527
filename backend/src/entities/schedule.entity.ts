import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Counselor } from './counselor.entity';

export type ScheduleStatus = 'available' | 'booked' | 'unavailable';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Counselor, (counselor) => counselor.schedules, { onDelete: 'CASCADE' })
  counselor: Counselor;

  @Column()
  counselorId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({
    type: 'enum',
    enum: ['available', 'booked', 'unavailable'],
    default: 'available',
  })
  status: ScheduleStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
