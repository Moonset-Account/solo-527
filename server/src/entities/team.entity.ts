import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ProductionProgress } from './production-progress.entity';
import { TeamSchedule } from './team-schedule.entity';

export type TeamType = 'printing' | 'cutting' | 'binding' | 'packaging' | 'quality' | 'maintenance';

@Entity('teams')
export class Team extends BaseEntity {
  @Column({ type: 'varchar', length: 100, name: 'team_name' })
  teamName: string;

  @Column({ type: 'varchar', length: 50, name: 'team_code', unique: true })
  teamCode: string;

  @Column({
    type: 'enum',
    enum: ['printing', 'cutting', 'binding', 'packaging', 'quality', 'maintenance'],
    default: 'printing',
  })
  teamType: TeamType;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'team_leader' })
  teamLeader: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'leader_phone' })
  leaderPhone: string;

  @Column({ type: 'int', default: 0, name: 'member_count' })
  memberCount: number;

  @Column({ type: 'simple-json', nullable: true, name: 'members' })
  members: Record<string, any>[];

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'simple-json', nullable: true, name: 'capacity_config' })
  capacityConfig: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true, name: 'extra_fields' })
  extraFields: Record<string, any>;

  @OneToMany(() => ProductionProgress, progress => progress.team)
  productionProgress: ProductionProgress[];

  @OneToMany(() => TeamSchedule, schedule => schedule.team)
  schedules: TeamSchedule[];
}
