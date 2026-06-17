export const ORDER_STATUS_MAP: Record<string, { label: string; type: string }> = {
  pending: { label: '待确认', type: 'warning' },
  confirmed: { label: '已确认', type: 'info' },
  assigned: { label: '已派单', type: 'primary' },
  in_progress: { label: '服务中', type: 'success' },
  completed: { label: '已完成', type: 'success' },
  cancelled: { label: '已取消', type: 'info' }
}

export const DEVICE_TYPES = [
  { value: 'air_conditioner', label: '空调' },
  { value: 'refrigerator', label: '冰箱' },
  { value: 'washing_machine', label: '洗衣机' },
  { value: 'water_heater', label: '热水器' },
  { value: 'range_hood', label: '油烟机' },
  { value: 'gas_stove', label: '燃气灶' },
  { value: 'tv', label: '电视' },
  { value: 'microwave', label: '微波炉' },
  { value: 'other', label: '其他家电' }
]

export const BRANDS = [
  '美的', '格力', '海尔', '海信', 'TCL', '创维', '长虹', '康佳', '小米', '华为', '三星', 'LG', '索尼', '松下', '其他'
]
