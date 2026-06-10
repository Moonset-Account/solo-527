import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SystemConfig, ConfigCategory } from '../../entities';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class SystemConfigService extends BaseCrudService<SystemConfig> implements OnModuleInit {
  private configCache: Map<string, SystemConfig> = new Map();

  constructor(
    @InjectRepository(SystemConfig)
    protected readonly repository: Repository<SystemConfig>,
  ) {
    super(repository, '系统配置');
  }

  async onModuleInit() {
    await this.initDefaultConfigs();
    await this.refreshCache();
  }

  private async initDefaultConfigs() {
    const defaultConfigs: Partial<SystemConfig>[] = [
      {
        configKey: 'order.urgent_levels',
        configName: '紧急程度配置',
        category: 'order',
        fieldType: 'multiselect',
        configValue: JSON.stringify([
          { value: 0, label: '普通' },
          { value: 1, label: '紧急' },
          { value: 2, label: '特急' },
        ]),
        description: '订单紧急程度选项',
        isSystem: true,
      },
      {
        configKey: 'order.process_types',
        configName: '工艺类型配置',
        category: 'order',
        fieldType: 'multiselect',
        configValue: JSON.stringify([
          { value: 'offset', label: '胶印' },
          { value: 'flexo', label: '柔印' },
          { value: 'digital', label: '数码印刷' },
          { value: 'silk', label: '丝印' },
          { value: 'hot_stamping', label: '烫金' },
          { value: 'uv', label: 'UV' },
          { value: 'lamination', label: '覆膜' },
          { value: 'die_cutting', label: '模切' },
          { value: 'binding', label: '装订' },
        ]),
        description: '订单工艺类型选项',
        isSystem: true,
      },
      {
        configKey: 'quality.pass_rate_threshold',
        configName: '合格率阈值',
        category: 'quality',
        fieldType: 'number',
        configValue: '95',
        defaultValue: '95',
        thresholdConfig: { min: 0, max: 100, unit: '%' },
        description: '质检合格率预警阈值，低于此值触发预警',
        isSystem: true,
      },
      {
        configKey: 'delivery.reminder_days',
        configName: '交付提醒天数',
        category: 'delivery',
        fieldType: 'number',
        configValue: '3',
        defaultValue: '3',
        thresholdConfig: { min: 1, max: 30, unit: '天' },
        description: '距离交付日期多少天开始提醒',
        isSystem: true,
      },
      {
        configKey: 'production.default_nodes',
        configName: '默认生产节点',
        category: 'production',
        fieldType: 'multiselect',
        configValue: JSON.stringify([
          { code: 'CTP', name: 'CTP制版', type: 'process', estimatedHours: 2 },
          { code: 'PRINT', name: '印刷', type: 'process', estimatedHours: 8 },
          { code: 'CUT', name: '裁切', type: 'process', estimatedHours: 4 },
          { code: 'QC1', name: '质检', type: 'quality', estimatedHours: 2 },
          { code: 'BIND', name: '装订/后加工', type: 'process', estimatedHours: 6 },
          { code: 'QC2', name: '成品检验', type: 'quality', estimatedHours: 2 },
          { code: 'PACK', name: '包装', type: 'packaging', estimatedHours: 2 },
          { code: 'DELIVER', name: '待发货', type: 'delivery', estimatedHours: 1 },
        ]),
        description: '订单创建时默认生成的生产节点',
        isSystem: true,
      },
      {
        configKey: 'material.low_stock_warning',
        configName: '低库存预警阈值',
        category: 'material',
        fieldType: 'number',
        configValue: '50',
        defaultValue: '50',
        thresholdConfig: { min: 0, unit: '%' },
        description: '库存低于安全库存的百分比时触发预警',
        isSystem: true,
      },
      {
        configKey: 'export.fields.order',
        configName: '订单导出字段',
        category: 'export',
        fieldType: 'multiselect',
        configValue: JSON.stringify([
          { key: 'orderNo', label: '订单号', width: 20 },
          { key: 'customerName', label: '客户名称', width: 25 },
          { key: 'productName', label: '产品名称', width: 25 },
          { key: 'productSpec', label: '规格', width: 20 },
          { key: 'quantity', label: '数量', width: 10 },
          { key: 'unit', label: '单位', width: 8 },
          { key: 'unitPrice', label: '单价', width: 12 },
          { key: 'totalAmount', label: '金额', width: 15 },
          { key: 'orderDate', label: '下单日期', width: 15, format: 'date' },
          { key: 'deliveryDate', label: '交货日期', width: 15, format: 'date' },
          { key: 'status', label: '状态', width: 12 },
          { key: 'urgentLevel', label: '紧急程度', width: 10 },
          { key: 'salespersonName', label: '业务员', width: 12 },
          { key: 'remark', label: '备注', width: 30 },
        ]),
        description: '订单导出默认导出字段配置',
        isSystem: true,
      },
    ];

    for (const config of defaultConfigs) {
      const exists = await this.repository.findOne({
        where: { configKey: config.configKey },
      });
      if (!exists) {
        await this.repository.save(config as SystemConfig);
      }
    }
  }

  async refreshCache() {
    const configs = await this.repository.find({ where: { isActive: true } });
    this.configCache.clear();
    configs.forEach(c => this.configCache.set(c.configKey, c));
  }

  async findByCategory(category: ConfigCategory) {
    const configs = Array.from(this.configCache.values()).filter(c => c.category === category);
    return configs;
  }

  async findByKeys(keys: string[]) {
    return Array.from(this.configCache.values()).filter(c => keys.includes(c.configKey));
  }

  getConfigValue(key: string): string {
    const config = this.configCache.get(key);
    return config?.configValue || config?.defaultValue || '';
  }

  getConfigJson<T = any>(key: string): T {
    const value = this.getConfigValue(key);
    try {
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  protected override getKeywordField(): string {
    return 'configName';
  }
}
