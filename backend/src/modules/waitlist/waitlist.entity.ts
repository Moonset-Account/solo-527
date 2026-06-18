import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Counselor } from '../counselors/counselor.entity';
import { WaitlistStatus } from '../../common/enums/waitlist-status.enum';

@Entity('waitlist')
export class Waitlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  counselorId: string;

  @ManyToOne(() => Counselor)
  @JoinColumn({ name: 'counselorId' })
  counselor: Counselor;

  @Column()
  clientName: string;

  @Column()
  clientPhone: string;

  @Column({ type: 'timestamp', nullable: true })
  preferredTime: Date;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({
    type: 'enum',
    enum: WaitlistStatus,
    default: WaitlistStatus.WAITING,
  })
  status: WaitlistStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  lastOperatorId: string;

  @Column({ nullable: true })
  lastOperatorName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
