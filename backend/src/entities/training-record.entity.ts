import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Pet } from './pet.entity';
import { User } from './user.entity';

@Entity('training_records')
export class TrainingRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Pet)
  @JoinColumn({ name: 'petId' })
  pet: Pet;

  @Column()
  petId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'trainerId' })
  trainer: User;

  @Column()
  trainerId: string;

  @Column({ type: 'date' })
  trainingDate: Date;

  @Column()
  trainingType: string;

  @Column({ type: 'int', nullable: true })
  duration: number;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'text', nullable: true })
  progress: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
