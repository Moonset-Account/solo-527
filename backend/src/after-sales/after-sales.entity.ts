import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Project } from '../project/project.entity';
import { AfterSalesType } from '../common/enums/after-sales-type.enum';
import { AfterSalesStatus } from '../common/enums/after-sales-status.enum';

@Entity('after_sales')
export class AfterSales {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp', nullable: true })
  reportTime: Date;

  @Column({ nullable: true })
  reporter: string;

  @Column({
    type: 'enum',
    enum: AfterSalesType,
  })
  type: AfterSalesType;

  @Column({ nullable: true })
  handler: string;

  @Column({ type: 'timestamp', nullable: true })
  handleTime: Date;

  @Column({ type: 'text', nullable: true })
  solution: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cost: number;

  @Column({
    type: 'enum',
    enum: AfterSalesStatus,
    default: AfterSalesStatus.PENDING,
  })
  status: AfterSalesStatus;

  @CreateDateColumn()
  createdAt: Date;
}
