import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Pet } from './pet.entity';
import { User } from './user.entity';

export enum HealthRecordType {
  VACCINATION = 'vaccination',
  DEWORMING = 'deworming',
  CHECKUP = 'checkup',
  TREATMENT = 'treatment',
  SURGERY = 'surgery',
  WEIGHT = 'weight',
  OTHER = 'other',
}

@Entity('health_records')
export class HealthRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Pet)
  @JoinColumn({ name: 'petId' })
  pet: Pet;

  @Column()
  petId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'veterinarianId' })
  veterinarian: User;

  @Column({ nullable: true })
  veterinarianId: string;

  @Column({ type: 'date' })
  recordDate: Date;

  @Column({
    type: 'enum',
    enum: HealthRecordType,
  })
  type: HealthRecordType;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  symptoms: string;

  @Column({ type: 'text', nullable: true })
  diagnosis: string;

  @Column({ type: 'text', nullable: true })
  treatment: string;

  @Column({ type: 'text', nullable: true })
  medication: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  temperature: number;

  @Column({ type: 'date', nullable: true })
  nextVisitDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
