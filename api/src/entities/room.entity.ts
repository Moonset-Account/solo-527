import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Appointment } from './appointment.entity.js';
import { Contract } from './contract.entity.js';
import { WorkOrder } from './work-order.entity.js';
import { VacancyStats } from './vacancy-stats.entity.js';
import { User } from './user.entity.js';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'room_name', length: 200 })
  name: string;

  @Column({ name: 'address', length: 500 })
  address: string;

  @Column({ name: 'area', type: 'decimal', precision: 10, scale: 2 })
  area: number;

  @Column({ name: 'unit_type', length: 50 })
  unitType: string;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: 'vacant',
  })
  status: 'vacant' | 'rented' | 'maintenance' | 'reserved';

  @Column({ name: 'monthly_rent', type: 'decimal', precision: 10, scale: 2 })
  monthlyRent: number;

  @Column({ name: 'images', type: 'jsonb', default: '[]' })
  images: string[];

  @Column({ name: 'vacant_days', type: 'int', default: 0 })
  vacantDays: number;

  @Column({ name: 'owner_id', type: 'int' })
  ownerId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => Appointment, (appointment) => appointment.room)
  appointments: Appointment[];

  @OneToMany(() => Contract, (contract) => contract.room)
  contracts: Contract[];

  @OneToMany(() => WorkOrder, (workOrder) => workOrder.room)
  workOrders: WorkOrder[];

  @OneToMany(() => VacancyStats, (stats) => stats.room)
  vacancyStats: VacancyStats[];
}
