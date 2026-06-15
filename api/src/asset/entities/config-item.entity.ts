import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Environment } from '../../../../shared/types.js';
import { Asset } from './asset.entity.js';

@Entity('config_items')
export class ConfigItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Asset, (asset) => asset.configItems)
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @Column()
  name: string;

  @Column()
  key: string;

  @Column({ type: 'text', nullable: true })
  value: string;

  @Column({ type: 'enum', enum: Environment, default: Environment.production })
  environment: Environment;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
