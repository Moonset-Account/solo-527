import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ConstructionStage } from '../construction-stage/construction-stage.entity';
import { Project } from '../project/project.entity';

@Entity('stage_photos')
export class StagePhoto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  stageId: number;

  @ManyToOne(() => ConstructionStage)
  @JoinColumn({ name: 'stageId' })
  stage: ConstructionStage;

  @Column()
  projectId: number;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  photoUrl: string;

  @Column({ nullable: true })
  uploader: string;

  @Column({ type: 'timestamp', nullable: true })
  uploadTime: Date;

  @CreateDateColumn()
  createdAt: Date;
}
