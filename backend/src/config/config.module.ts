import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigItem, ConfigItemSchema, ConfigCategory } from './config.schema';
import { ConfigItemsService } from './config.service';
import { ConfigItemsController } from './config.controller';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigStatus } from '../common/decorators/config-status.enum';

@Module({
  imports: [MongooseModule.forFeature([{ name: ConfigItem.name, schema: ConfigItemSchema }])],
  controllers: [ConfigItemsController],
  providers: [ConfigItemsService],
})
export class ConfigItemsModule implements OnModuleInit {
  constructor(@InjectModel(ConfigItem.name) private model: Model<ConfigItem>) {}

  async onModuleInit() {
    const count = await this.model.countDocuments();
    if (count === 0) {
      const defaults = [
        { key: 'billing.due_days', name: '账单宽限天数', category: ConfigCategory.BILLING, value: 15, defaultValue: 15, status: ConfigStatus.ENABLED, description: '账单到期后多少天视为逾期' },
        { key: 'billing.late_fee_rate', name: '逾期费率(日%)', category: ConfigCategory.BILLING, value: 0.05, defaultValue: 0.05, status: ConfigStatus.ENABLED, description: '每日逾期费率' },
        { key: 'maintenance.sla_hours', name: '报修响应时长(小时)', category: ConfigCategory.MAINTENANCE, value: 2, defaultValue: 2, status: ConfigStatus.ENABLED },
        { key: 'inspection.frequency', name: '巡检频率', category: ConfigCategory.INSPECTION, value: '每周', defaultValue: '每周', status: ConfigStatus.ENABLED },
        { key: 'pricing.peak_season', name: '旺季月份', category: ConfigCategory.PRICING, value: [5, 6, 7, 8, 9, 10], defaultValue: [5, 6, 7, 8, 9, 10], status: ConfigStatus.DRAFT, description: '草稿状态,待确认后启用' },
        { key: 'access.after_hours_start', name: '夜间起始时间', category: ConfigCategory.ACCESS, value: '22:00', defaultValue: '22:00', status: ConfigStatus.ENABLED },
        { key: 'system.notification_enabled', name: '系统通知', category: ConfigCategory.SYSTEM, value: true, defaultValue: true, status: ConfigStatus.DISABLED, description: '已停用的配置项示例' },
      ];
      for (const item of defaults) {
        await this.model.create({ ...item, createdBy: new (require('mongoose').Types.ObjectId)() });
      }
      console.log('默认系统配置已初始化');
    }
  }
}
