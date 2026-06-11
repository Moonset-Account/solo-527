import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from '../project/project.entity.js';

@Entity('project_photos')
export class ProjectPhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ length: 200 })
  filename: string;

  @Column({ length: 500 })
  path: string;

  @Column({ length: 50, nullable: true })
  mimetype: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'taken_at', type: 'timestamp', nullable: true })
  takenAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
