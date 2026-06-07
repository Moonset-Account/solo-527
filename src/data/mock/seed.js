export const STATION_NAMES = [
  '国贸中心充电站', '望京SOHO充电站', '中关村科技园站', '亦庄开发区站',
  '三里屯太古里站', '朝阳大悦城站', '西直门凯德站', '五道口清华站',
  '国贸地下站', '亚运村站', '通州万达站', '丰台科技园站',
  '大兴机场站', '顺义新国展站', '昌平回龙观站', '房山长阳站',
  '石景山万达站', '海淀黄庄站', '东直门外站', '北京南站'
]

export const CHARGER_MODELS = [
  { model: 'TESLA-V3', power: 250, brand: '特斯拉' },
  { model: 'BYD-DC120', power: 120, brand: '比亚迪' },
  { model: 'NIO-180', power: 180, brand: '蔚来' },
  { model: 'XPEL-90', power: 90, brand: '小鹏' },
  { model: 'STAR-60', power: 60, brand: '星星充电' },
  { model: 'TEGIC-150', power: 150, brand: '特来电' }
]

export const FAULT_CODES = [
  { code: 'E001', desc: '充电模块过温保护', severity: 'critical', avgRepairHours: 4.5 },
  { code: 'E002', desc: '直流输出过流', severity: 'critical', avgRepairHours: 3.2 },
  { code: 'E003', desc: '急停按钮触发', severity: 'warning', avgRepairHours: 0.5 },
  { code: 'E004', desc: '连接器温度过高', severity: 'high', avgRepairHours: 2.8 },
  { code: 'E005', desc: '绝缘检测失败', severity: 'critical', avgRepairHours: 5.5 },
  { code: 'E006', desc: '通讯中断', severity: 'high', avgRepairHours: 1.8 },
  { code: 'E007', desc: '电表计量异常', severity: 'medium', avgRepairHours: 2.2 },
  { code: 'E008', desc: '风扇故障', severity: 'low', avgRepairHours: 1.2 },
  { code: 'E009', desc: '显示屏故障', severity: 'low', avgRepairHours: 1.0 },
  { code: 'E010', desc: '门锁机构故障', severity: 'medium', avgRepairHours: 1.5 },
  { code: 'E011', desc: '电源模块损坏', severity: 'critical', avgRepairHours: 6.0 },
  { code: 'E012', desc: 'BMS通讯异常', severity: 'high', avgRepairHours: 2.5 }
]

export const REPAIR_PERSONS = [
  { id: 'P001', name: '张工', team: 'A组' },
  { id: 'P002', name: '李工', team: 'A组' },
  { id: 'P003', name: '王工', team: 'B组' },
  { id: 'P004', name: '赵工', team: 'B组' },
  { id: 'P005', name: '刘工', team: 'C组' },
  { id: 'P006', name: '陈工', team: 'C组' },
  { id: 'P007', name: '杨工', team: 'A组' },
  { id: 'P008', name: '黄工', team: 'B组' }
]

export const REGIONS = ['朝阳区', '海淀区', '丰台区', '东城区', '西城区', '通州区', '昌平区', '大兴区']
