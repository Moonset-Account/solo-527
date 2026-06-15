import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from './entities/asset.entity.js';
import { ConfigItem } from './entities/config-item.entity.js';
import { AssetService } from './asset.service.js';
import { ConfigItemService } from './config-item.service.js';
import { AssetController } from './asset.controller.js';
import { ConfigItemController } from './config-item.controller.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Asset, ConfigItem]), AuditModule],
  providers: [AssetService, ConfigItemService],
  controllers: [AssetController, ConfigItemController],
  exports: [AssetService, ConfigItemService],
})
export class AssetModule {}
