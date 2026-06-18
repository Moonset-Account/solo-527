import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';

export enum PetStatus {
  ACTIVE = 'active',
  ADOPTED = 'adopted',
  FOSTER = 'foster',
  TREATMENT = 'treatment',
  DECEASED = 'deceased',
}

export enum PetSource {
  RESCUE = 'rescue',
  DONATION = 'donation',
  PURCHASE = 'purchase',
  BORN = 'born',
  OTHER = 'other',
}

@Entity('pets')
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  species: string;

  @Column()
  breed: string;

  @Column({ type: 'int', nullable: true })
  age: number;

  @Column({ nullable: true })
  gender: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number;

  @Column({ nullable: true })
  color: string;

  @Column({
    type: 'enum',
    enum: PetStatus,
    default: PetStatus.ACTIVE,
  })
  status: PetStatus;

  @Column({
    type: 'enum',
    enum: PetSource,
    default: PetSource.RESCUE,
  })
  source: PetSource;

  @Column({ nullable: true })
  microchipId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ nullable: true })
  ownerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'volunteerId' })
  volunteer: User;

  @Column({ nullable: true })
  volunteerId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date', nullable: true })
  rescueDate: Date;

  @Column({ type: 'date', nullable: true })
  adoptionDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
