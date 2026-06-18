import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ServiceType {
  GROOMING = 'grooming',
  BATHING = 'bathing',
  NAIL_TRIMMING = 'nail_trimming',
  EAR_CLEANING = 'ear_cleaning',
  DENTAL = 'dental',
  FULL_PACKAGE = 'full_package',
  VIP_PACKAGE = 'vip_package',
  OTHER = 'other',
}

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ServiceType,
  })
  type: ServiceType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  duration: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalPrice: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ type: 'simple-array', nullable: true })
  applicableSpecies: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
