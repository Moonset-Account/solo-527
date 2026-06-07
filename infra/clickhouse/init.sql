CREATE DATABASE IF NOT EXISTS analytics;

CREATE TABLE IF NOT EXISTS analytics.return_rate_trend
(
  date Date,
  overseas_rate Float32,
  domestic_rate Float32,
  overall_rate Float32,
  warehouse_type LowCardinality(String)
)
ENGINE = MergeTree()
ORDER BY date;

CREATE TABLE IF NOT EXISTS analytics.kpi_summary
(
  id UInt32,
  total_return_rate Float32,
  total_refund_usd Float64,
  total_return_orders UInt32,
  avg_processing_days Float32,
  return_rate_trend Float32,
  refund_trend Float32,
  order_trend Float32,
  processing_trend Float32,
  warehouse_type LowCardinality(String),
  updated_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS analytics.sku_return_stats
(
  sku String,
  product_name String,
  total_orders UInt32,
  return_count UInt32,
  return_rate Float32,
  is_low_sample UInt8,
  top_return_reasons String,
  warehouse_type LowCardinality(String)
)
ENGINE = MergeTree()
ORDER BY (warehouse_type, return_rate);

CREATE TABLE IF NOT EXISTS analytics.logistics_node_stats
(
  node String,
  avg_delay_hours Float32,
  delay_rate Float32,
  return_rate Float32,
  order_count UInt32,
  is_low_sample UInt8,
  warehouse_type LowCardinality(String)
)
ENGINE = MergeTree()
ORDER BY (warehouse_type, node);

CREATE TABLE IF NOT EXISTS analytics.quality_conclusion_stats
(
  conclusion LowCardinality(String),
  conclusion_label String,
  count UInt32,
  percentage Float32,
  total_refund_usd Float64,
  is_low_sample UInt8,
  warehouse_type LowCardinality(String),
  category LowCardinality(String)
)
ENGINE = MergeTree()
ORDER BY (warehouse_type, conclusion);

CREATE TABLE IF NOT EXISTS analytics.refund_by_currency
(
  currency LowCardinality(String),
  original_amount Float64,
  converted_usd Float64,
  exchange_rate Float64,
  warehouse_type LowCardinality(String)
)
ENGINE = MergeTree()
ORDER BY (warehouse_type, currency);

INSERT INTO analytics.return_rate_trend (date, overseas_rate, domestic_rate, overall_rate, warehouse_type) VALUES
('2025-01-01',5.2,3.8,4.5,'all'),('2025-02-01',6.1,4.2,5.2,'all'),('2025-03-01',5.8,3.5,4.7,'all'),
('2025-04-01',7.2,4.8,6.0,'all'),('2025-05-01',6.5,3.9,5.2,'all'),('2025-06-01',7.8,5.1,6.5,'all'),
('2025-07-01',8.1,4.3,6.2,'all'),('2025-08-01',7.4,5.6,6.5,'all'),('2025-09-01',6.9,4.7,5.8,'all'),
('2025-10-01',5.3,3.2,4.3,'all'),('2025-11-01',6.7,4.1,5.4,'all'),('2025-12-01',7.5,5.0,6.3,'all'),
('2026-01-01',6.3,4.5,5.4,'all'),('2026-02-01',7.1,3.8,5.5,'all'),('2026-03-01',5.9,4.2,5.1,'all'),
('2026-04-01',8.2,5.3,6.8,'all'),('2026-05-01',6.8,4.6,5.7,'all'),('2026-06-01',7.3,5.2,6.3,'all');

INSERT INTO analytics.kpi_summary (id, total_return_rate, total_refund_usd, total_return_orders, avg_processing_days, return_rate_trend, refund_trend, order_trend, processing_trend, warehouse_type) VALUES
(1,9.8,168500,3200,7.2,2.1,-3.5,1.8,-0.4,'all'),
(2,11.5,128000,2100,10.3,3.2,-2.8,2.5,-0.8,'overseas'),
(3,7.2,40500,1100,4.8,0.5,-1.2,0.8,-0.2,'domestic');

INSERT INTO analytics.sku_return_stats (sku, product_name, total_orders, return_count, return_rate, is_low_sample, top_return_reasons, warehouse_type) VALUES
('SKU-001','无线蓝牙耳机 Pro',320,45,14.1,0,'[{"reason":"商品破损","count":18},{"reason":"与描述不符","count":15},{"reason":"功能异常","count":12}]','all'),
('SKU-002','USB-C 快充数据线 1.5m',280,22,7.9,0,'[{"reason":"与描述不符","count":10},{"reason":"功能异常","count":7},{"reason":"物流太慢","count":5}]','all'),
('SKU-003','手机钢化膜 高清防指纹',410,61,14.9,0,'[{"reason":"商品破损","count":28},{"reason":"尺寸不合","count":20},{"reason":"不喜欢","count":13}]','all'),
('SKU-004','硅胶手机壳 防摔气囊',350,28,8.0,0,'[{"reason":"尺码不合适","count":12},{"reason":"颜色差异","count":9},{"reason":"不喜欢","count":7}]','all'),
('SKU-005','便携式充电宝 20000mAh',190,15,7.9,0,'[{"reason":"功能异常","count":7},{"reason":"与描述不符","count":5},{"reason":"物流太慢","count":3}]','all'),
('SKU-006','蓝牙音箱 迷你防水',150,18,12.0,0,'[{"reason":"商品破损","count":8},{"reason":"功能异常","count":6},{"reason":"与描述不符","count":4}]','all'),
('SKU-007','智能手表替换表带',25,3,12.0,1,'[{"reason":"不喜欢","count":2},{"reason":"颜色差异","count":1}]','all'),
('SKU-008','Type-C 转接头套装',18,2,11.1,1,'[{"reason":"功能异常","count":1},{"reason":"与描述不符","count":1}]','all'),
('SKU-009','车载手机支架 磁吸式',12,1,8.3,1,'[{"reason":"不喜欢","count":1}]','all'),
('SKU-010','运动臂包 防水大屏',8,1,12.5,1,'[{"reason":"尺寸不合","count":1}]','all');

INSERT INTO analytics.logistics_node_stats (node, avg_delay_hours, delay_rate, return_rate, order_count, is_low_sample, warehouse_type) VALUES
('国内揽收',3.2,8.5,4.2,420,0,'all'),
('国内分拨',4.1,10.2,5.1,380,0,'all'),
('出口清关',18.5,25.3,12.8,310,0,'all'),
('国际干线运输',24.8,32.1,15.2,280,0,'all'),
('目的国清关',12.3,18.7,9.5,290,0,'all'),
('海外仓入库',5.6,12.4,6.8,350,0,'all'),
('尾程派送',8.2,15.6,8.3,340,0,'all'),
('退货揽收',2.8,6.3,3.5,45,1,'all'),
('退货质检',1.5,3.2,2.8,15,1,'all'),
('海外退货点',6.7,14.2,7.9,8,1,'all');

INSERT INTO analytics.quality_conclusion_stats (conclusion, conclusion_label, count, percentage, total_refund_usd, is_low_sample, warehouse_type, category) VALUES
('warehouse_damage','仓库破损',520,18.5,28600.00,0,'all','warehouse'),
('transport_damage','运输损坏',380,13.5,18240.00,0,'all','warehouse'),
('wrong_item','发错货',12,0.4,576.00,1,'all','warehouse'),
('consumer_dissatisfied','不满意',680,24.2,23800.00,0,'all','consumer'),
('consumer_wrong_size','尺码不符',520,18.5,15600.00,0,'all','consumer'),
('consumer_changed_mind','改变主意',380,13.5,7600.00,0,'all','consumer'),
('quality_defect','质量缺陷',18,0.6,900.00,1,'all','other'),
('other','其他',300,10.7,6000.00,0,'all','other');

INSERT INTO analytics.refund_by_currency (currency, original_amount, converted_usd, exchange_rate, warehouse_type) VALUES
('USD',85200.00,85200.00,1.0,'all'),
('EUR',42800.00,46224.00,1.08,'all'),
('GBP',28500.00,36195.00,1.27,'all'),
('JPY',8200000.00,52480.00,0.0064,'all'),
('AUD',22000.00,14300.00,0.65,'all');
