import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AssetType, AssetStatus } from '../../../../shared/types.js';
import { ConfigItem } from './config-item.entity.js';
import { TicketAsset } from '../../ticket/entities/ticket-asset.entity.js';

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ name: 'asset_code', unique: true })
  assetCode: string;

  @Column({ type: 'enum', enum: AssetType })
  type: AssetType;

  @Column({ type: 'enum', enum: AssetStatus, default: AssetStatus.active })
  status: AssetStatus;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => ConfigItem, (ci) => ci.asset)
  configItems: ConfigItem[];

  @OneToMany(() => TicketAsset, (ta) => ta.asset)
  ticketAssets: TicketAsset[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
