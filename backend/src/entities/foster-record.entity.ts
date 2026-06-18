import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Pet } from './pet.entity';
import { User } from './user.entity';

export enum FosterStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  EXTENDED = 'extended',
  CANCELLED = 'cancelled',
}

@Entity('foster_records')
export class FosterRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Pet)
  @JoinColumn({ name: 'petId' })
  pet: Pet;

  @Column()
  petId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'volunteerId' })
  volunteer: User;

  @Column()
  volunteerId: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'date', nullable: true })
  originalEndDate: Date;

  @Column({
    type: 'enum',
    enum: FosterStatus,
    default: FosterStatus.ACTIVE,
  })
  status: FosterStatus;

  @Column({ type: 'text', nullable: true })
  volunteerHome: string;

  @Column({ type: 'text', nullable: true })
  dailyChecklist: string;

  @Column({ type: 'text', nullable: true })
  emergencyContact: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
