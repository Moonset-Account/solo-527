import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity.js';

@Entity('message_records')
export class MessageRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({
    name: 'type',
    type: 'enum',
    enum: ['sms', 'email', 'wechat', 'push'],
  })
  type: 'sms' | 'email' | 'wechat' | 'push';

  @Column({ name: 'title', length: 200 })
  title: string;

  @Column({ name: 'content', type: 'text' })
  content: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['pending', 'sent', 'failed'],
    default: 'pending',
  })
  status: 'pending' | 'sent' | 'failed';

  @Column({ name: 'provider', length: 50, nullable: true })
  provider: string;

  @Column({ name: 'provider_message_id', length: 100, nullable: true })
  providerMessageId: string;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
