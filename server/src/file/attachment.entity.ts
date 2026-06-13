import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from '../project/project.entity.js';
import { Contract } from '../contract/contract.entity.js';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_type', length: 20 })
  entityType: 'contract' | 'project';

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ name: 'file_name', length: 500 })
  fileName: string;

  @Column({ type: 'bigint', default: 0, name: 'file_size' })
  fileSize: number;

  @Column({ name: 'file_type', length: 50, nullable: true })
  fileType: string;

  @Column({ length: 1000 })
  url: string;

  @Column({ name: 'uploaded_by', nullable: true })
  uploadedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'entity_id' })
  project: Project;

  @ManyToOne(() => Contract)
  @JoinColumn({ name: 'entity_id' })
  contract: Contract;
}
