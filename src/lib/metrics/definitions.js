export const METRIC_DEFINITIONS = {
  watch_uv: {
    name: '观看人数',
    description: '进入直播间的独立用户数',
    calculation: 'COUNT(DISTINCT user_id)',
    unit: '人'
  },
  watch_pv: {
    name: '观看次数',
    description: '直播间总访问次数',
    calculation: 'COUNT(*)',
    unit: '次'
  },
  avg_watch_duration: {
    name: '平均观看时长',
    description: '用户平均停留时长',
    calculation: 'AVG(watch_duration_seconds)',
    unit: '秒'
  },
  interaction_uv: {
    name: '互动人数',
    description: '产生评论、点赞、分享等互动行为的独立用户数',
    calculation: 'COUNT(DISTINCT user_id) WHERE has_interaction = 1',
    unit: '人'
  },
  interaction_rate: {
    name: '互动率',
    description: '互动人数 / 观看人数',
    calculation: 'interaction_uv / watch_uv',
    unit: '%'
  },
  cart_add_uv: {
    name: '加购人数',
    description: '将商品加入购物车的独立用户数',
    calculation: 'COUNT(DISTINCT user_id) WHERE has_cart_add = 1',
    unit: '人'
  },
  cart_add_rate: {
    name: '加购率',
    description: '加购人数 / 观看人数',
    calculation: 'cart_add_uv / watch_uv',
    unit: '%'
  },
  order_uv: {
    name: '下单人数',
    description: '成功提交订单的独立用户数',
    calculation: 'COUNT(DISTINCT user_id) WHERE has_order = 1',
    unit: '人'
  },
  order_count: {
    name: '订单数',
    description: '总订单数量',
    calculation: 'COUNT(order_id)',
    unit: '单'
  },
  order_amount: {
    name: 'GMV',
    description: '总成交金额',
    calculation: 'SUM(order_amount)',
    unit: '元'
  },
  conversion_rate: {
    name: '转化率',
    description: '下单人数 / 观看人数',
    calculation: 'order_uv / watch_uv',
    unit: '%'
  },
  refund_count: {
    name: '退款订单数',
    description: '申请退款的订单数量',
    calculation: 'COUNT(order_id) WHERE has_refund = 1',
    unit: '单'
  },
  refund_amount: {
    name: '退款金额',
    description: '退款总金额',
    calculation: 'SUM(refund_amount)',
    unit: '元'
  },
  refund_rate: {
    name: '退款率',
    description: '退款订单数 / 总订单数',
    calculation: 'refund_count / order_count',
    unit: '%'
  },
  avg_order_value: {
    name: '客单价',
    description: '平均每单金额',
    calculation: 'order_amount / order_count',
    unit: '元'
  },
  fulfillment_rate_spot: {
    name: '现货履约率',
    description: '现货商品按时发货订单占比',
    calculation: 'COUNT(spot_fulfilled) / COUNT(spot_orders)',
    unit: '%'
  },
  fulfillment_rate_preorder: {
    name: '预售履约率',
    description: '预售商品按约定发货订单占比',
    calculation: 'COUNT(preorder_fulfilled) / COUNT(preorder_orders)',
    unit: '%'
  }
};

export const DIMENSIONS = {
  anchor: {
    name: '主播',
    field: 'anchor_id',
    label_field: 'anchor_name'
  },
  product: {
    name: '商品',
    field: 'product_id',
    label_field: 'product_name'
  },
  time_slot: {
    name: '时段',
    field: 'time_slot',
    values: ['00-02', '02-04', '04-06', '06-08', '08-10', '10-12', '12-14', '14-16', '16-18', '18-20', '20-22', '22-24']
  },
  activity: {
    name: '活动',
    field: 'activity_id',
    label_field: 'activity_name'
  },
  source: {
    name: '观众来源',
    field: 'source_channel',
    values: ['推荐页', '关注页', '搜索', '分享', '其他']
  },
  product_type: {
    name: '商品类型',
    field: 'product_type',
    values: ['spot', 'preorder'],
    labels: { spot: '现货', preorder: '预售' }
  }
};

export const REFUND_REASONS = [
  { id: 'quality', name: '商品质量问题' },
  { id: 'description', name: '与描述不符' },
  { id: 'size', name: '尺码/规格不合适' },
  { id: 'price', name: '价格不满意' },
  { id: 'delivery', name: '发货太慢' },
  { id: 'damage', name: '物流损坏' },
  { id: 'regret', name: '不想要了' },
  { id: 'other', name: '其他原因' }
];
