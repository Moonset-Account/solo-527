export interface MetricDefinition {
  name: string;
  code: string;
  formula: string;
  description: string;
  dataSources: string[];
  unit: string;
}

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    name: '损耗率',
    code: 'loss_rate',
    formula: 'SUM(loss_qty) / SUM(received_qty) * 100',
    description: '统计期内总损耗数量占总入库数量的比例',
    dataSources: ['fact_loss', 'fact_inventory'],
    unit: '%',
  },
  {
    name: '临期率',
    code: 'near_expiry_rate',
    formula: 'COUNT(near_expiry_batches) / COUNT(total_batches) * 100',
    description: '距离保质期不足30%的批次占总批次的比例',
    dataSources: ['fact_inventory'],
    unit: '%',
  },
  {
    name: '促销消化率',
    code: 'promotion_digestion_rate',
    formula: 'SUM(promotion_sold_qty) / SUM(pre_promotion_stock_qty) * 100',
    description: '促销期间销量占促销前库存数量的比例',
    dataSources: ['fact_promotion', 'fact_inventory'],
    unit: '%',
  },
  {
    name: '批次周转天数',
    code: 'batch_turnover_days',
    formula: 'AVG(current_date - receive_date) / (received_qty - current_stock_qty)',
    description: '批次从入库到销售完成的平均天数',
    dataSources: ['fact_inventory'],
    unit: '天',
  },
  {
    name: '供应商损耗率',
    code: 'supplier_loss_rate',
    formula: 'SUM(supplier_loss_qty) / SUM(supplier_received_qty) * 100',
    description: '该供应商所有批次的总损耗占总入库的比例',
    dataSources: ['fact_loss', 'fact_inventory'],
    unit: '%',
  },
  {
    name: '准时交付率',
    code: 'on_time_delivery_rate',
    formula: 'COUNT(on_time_deliveries) / COUNT(total_deliveries) * 100',
    description: '供应商按时交付的批次比例',
    dataSources: ['fact_inventory'],
    unit: '%',
  },
  {
    name: '品质异常率',
    code: 'quality_issue_rate',
    formula: 'COUNT(quality_issue_batches) / COUNT(total_batches) * 100',
    description: '因品质问题导致报损的批次比例',
    dataSources: ['fact_loss', 'fact_inventory'],
    unit: '%',
  },
  {
    name: '客流转化率',
    code: 'traffic_conversion_rate',
    formula: 'AVG(conversion_rate) * 100',
    description: '门店客流转化为实际购买的比例',
    dataSources: ['fact_daily_traffic'],
    unit: '%',
  },
];

export const STAGE_DEFINITIONS = {
  received: { name: '入库', color: '#3B82F6' },
  sellable: { name: '可售', color: '#10B981' },
  near_expiry: { name: '临期', color: '#F59E0B' },
  promotion: { name: '促销', color: '#8B5CF6' },
  written_off: { name: '报损', color: '#EF4444' },
  returned: { name: '退货', color: '#EC4899' },
};

export const ANOMALY_THRESHOLDS = {
  high_loss: { warning: 0.05, critical: 0.1 },
  near_expiry: { warning: 0.15, critical: 0.25 },
  poor_promotion: { warning: 0.3, critical: 0.5 },
  low_traffic: { warning: -0.1, critical: -0.2 },
};
