import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Pet } from './pet.entity';
import { User } from './user.entity';

export enum AdoptionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  RETURNED = 'returned',
}

@Entity('adoption_records')
export class AdoptionRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Pet)
  @JoinColumn({ name: 'petId' })
  pet: Pet;

  @Column()
  petId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'adopterId' })
  adopter: User;

  @Column()
  adopterId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approverId' })
  approver: User;

  @Column({ nullable: true })
  approverId: string;

  @Column({ type: 'date' })
  applicationDate: Date;

  @Column({ type: 'date', nullable: true })
  approvalDate: Date;

  @Column({ type: 'date', nullable: true })
  adoptionDate: Date;

  @Column({
    type: 'enum',
    enum: AdoptionStatus,
    default: AdoptionStatus.PENDING,
  })
  status: AdoptionStatus;

  @Column({ type: 'text', nullable: true })
  adopterAddress: string;

  @Column({ type: 'text', nullable: true })
  adopterExperience: string;

  @Column({ type: 'text', nullable: true })
  homeEnvironment: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
