import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  APPROVE = 'approve',
  REJECT = 'reject',
  CANCEL = 'cancel',
  COMPLETE = 'complete',
  EXPORT = 'export',
  OTHER = 'other',
}

@Entity('operation_logs')
export class OperationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'operatorId' })
  operator: User;

  @Column({ nullable: true })
  operatorId: string;

  @Column()
  module: string;

  @Column({
    type: 'enum',
    enum: OperationType,
  })
  operationType: OperationType;

  @Column({ nullable: true })
  targetId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  beforeData: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  afterData: Record<string, any>;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}
