import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Team } from './team.entity';

export type ScheduleStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type ShiftType = 'morning' | 'afternoon' | 'night' | 'overtime';

@Entity('team_schedules')
export class TeamSchedule extends BaseEntity {
  @Column({ name: 'team_id', type: 'uuid' })
  teamId: string;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId: string;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'task_name' })
  taskName: string;

  @Column({ type: 'date', name: 'schedule_date' })
  scheduleDate: Date;

  @Column({
    type: 'enum',
    enum: ['morning', 'afternoon', 'night', 'overtime'],
    default: 'morning',
  })
  shift: ShiftType;

  @Column({ type: 'timestamp', nullable: true, name: 'start_time' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'end_time' })
  endTime: Date;

  @Column({ type: 'int', nullable: true, name: 'planned_quantity' })
  plannedQuantity: number;

  @Column({ type: 'int', nullable: true, name: 'actual_quantity' })
  actualQuantity: number;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled',
  })
  status: ScheduleStatus;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ type: 'simple-json', nullable: true, name: 'extra_fields' })
  extraFields: Record<string, any>;

  @ManyToOne(() => Team, team => team.schedules)
  @JoinColumn({ name: 'team_id' })
  team: Team;
}
