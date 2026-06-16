import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Room } from './room.entity.js';
import { User } from './user.entity.js';

@Entity('work_orders')
export class WorkOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'room_id', type: 'int' })
  roomId: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'title', length: 200 })
  title: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: ['repair', 'clean', 'inspect', 'other'],
    default: 'repair',
  })
  type: 'repair' | 'clean' | 'inspect' | 'other';

  @Column({
    name: 'priority',
    type: 'enum',
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  })
  priority: 'low' | 'medium' | 'high' | 'urgent';

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['pending', 'in_progress', 'completed', 'closed'],
    default: 'pending',
  })
  status: 'pending' | 'in_progress' | 'completed' | 'closed';

  @Column({ name: 'assigned_to', type: 'int', nullable: true })
  assignedTo: number;

  @Column({ name: 'follow_up_count', type: 'int', default: 0 })
  followUpCount: number;

  @Column({ name: 'last_follow_up_at', type: 'timestamp', nullable: true })
  lastFollowUpAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Room, (room) => room.workOrders)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to' })
  assignedUser: User;
}
