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

  @Column({ length: 100, nullable: true })
  area: string;

  @Column({ length: 1000 })
  url: string;

  @Column({ name: 'thumbnail_url', length: 1000, nullable: true })
  thumbnailUrl: string;

  @Column({ name: 'uploaded_by', nullable: true })
  uploadedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Project, (project) => project.photos)
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
