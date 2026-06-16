import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Appointment } from './appointment.entity.js';
import { Contract } from './contract.entity.js';
import { WorkOrder } from './work-order.entity.js';
import { VacancyStats } from './vacancy-stats.entity.js';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'room_number', length: 50 })
  roomNumber: string;

  @Column({ name: 'building', length: 50 })
  building: string;

  @Column({ name: 'floor', type: 'int' })
  floor: number;

  @Column({ name: 'unit', length: 20, nullable: true })
  unit: string;

  @Column({ name: 'area', type: 'decimal', precision: 8, scale: 2 })
  area: number;

  @Column({ name: 'rent_price', type: 'decimal', precision: 10, scale: 2 })
  rentPrice: number;

  @Column({ name: 'deposit', type: 'decimal', precision: 10, scale: 2 })
  deposit: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['vacant', 'rented', 'maintenance', 'reserved'],
    default: 'vacant',
  })
  status: 'vacant' | 'rented' | 'maintenance' | 'reserved';

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Appointment, (appointment) => appointment.room)
  appointments: Appointment[];

  @OneToMany(() => Contract, (contract) => contract.room)
  contracts: Contract[];

  @OneToMany(() => WorkOrder, (workOrder) => workOrder.room)
  workOrders: WorkOrder[];

  @OneToMany(() => VacancyStats, (stats) => stats.room)
  vacancyStats: VacancyStats[];
}
