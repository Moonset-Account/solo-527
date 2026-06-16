import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Room } from './room.entity.js';
import { User } from './user.entity.js';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'room_id', type: 'int' })
  roomId: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'appointment_time', type: 'timestamp' })
  appointmentTime: Date;

  @Column({ name: 'duration', type: 'int', default: 60 })
  duration: number;

  @Column({ name: 'purpose', length: 200, nullable: true })
  purpose: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
  })
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';

  @Column({ name: 'remark', type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Room, (room) => room.appointments)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
