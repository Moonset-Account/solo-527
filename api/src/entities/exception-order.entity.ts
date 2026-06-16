import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Room } from './room.entity.js';
import { User } from './user.entity.js';

@Entity('exception_orders')
export class ExceptionOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'source_type', length: 50, nullable: true })
  sourceType: string;

  @Column({ name: 'source_id', type: 'int', nullable: true })
  sourceId: number;

  @Column({ name: 'room_id', type: 'int', nullable: true })
  roomId: number;

  @Column({ name: 'title', length: 200 })
  title: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({
    name: 'severity',
    type: 'enum',
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  })
  severity: 'low' | 'medium' | 'high' | 'critical';

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
  })
  status: 'open' | 'in_progress' | 'resolved' | 'closed';

  @Column({ name: 'resolved_by', type: 'int', nullable: true })
  resolvedBy: number;

  @Column({ name: 'resolution_note', type: 'text', nullable: true })
  resolutionNote: string;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'resolved_by' })
  resolver: User;
}
