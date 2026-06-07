const metricsConfig = {
  downtimeTypes: {
    PLANNED: 'planned',
    UNPLANNED: 'unplanned'
  },
  
  downtimeCategories: [
    { id: 'mechanical', name: '机械故障', color: '#e74c3c' },
    { id: 'electrical', name: '电气故障', color: '#f39c12' },
    { id: 'control', name: '控制系统', color: '#9b59b6' },
    { id: 'hydraulic', name: '液压系统', color: '#3498db' },
    { id: 'pneumatic', name: '气动系统', color: '#1abc9c' },
    { id: 'lubrication', name: '润滑问题', color: '#e67e22' },
    { id: 'wear', name: '正常磨损', color: '#95a5a6' },
    { id: 'operation', name: '操作失误', color: '#34495e' }
  ],
  
  plannedMaintenanceTypes: [
    { id: 'preventive', name: '预防性维护' },
    { id: 'predictive', name: '预测性维护' },
    { id: 'overhaul', name: '大修' },
    { id: 'inspection', name: '定期检查' }
  ],
  
  shifts: [
    { id: 'morning', name: '早班', hours: '06:00-14:00' },
    { id: 'afternoon', name: '中班', hours: '14:00-22:00' },
    { id: 'night', name: '夜班', hours: '22:00-06:00' }
  ],
  
  productionLines: [
    { id: 'line-a', name: 'A线 - 机加工' },
    { id: 'line-b', name: 'B线 - 装配' },
    { id: 'line-c', name: 'C线 - 焊接' },
    { id: 'line-d', name: 'D线 - 喷涂' }
  ],
  
  equipment: [
    { id: 'cnc-001', name: 'CNC加工中心 #1', line: 'line-a' },
    { id: 'cnc-002', name: 'CNC加工中心 #2', line: 'line-a' },
    { id: 'lathe-001', name: '车床 #1', line: 'line-a' },
    { id: 'miller-001', name: '铣床 #1', line: 'line-a' },
    { id: 'press-001', name: '冲压机 #1', line: 'line-b' },
    { id: 'press-002', name: '冲压机 #2', line: 'line-b' },
    { id: 'robot-001', name: '装配机器人 #1', line: 'line-b' },
    { id: 'conveyor-001', name: '输送线 #1', line: 'line-b' },
    { id: 'welder-001', name: '焊接机器人 #1', line: 'line-c' },
    { id: 'welder-002', name: '焊接机器人 #2', line: 'line-c' },
    { id: 'welder-003', name: '点焊机 #1', line: 'line-c' },
    { id: 'spray-001', name: '喷涂机器人 #1', line: 'line-d' },
    { id: 'spray-002', name: '喷涂机器人 #2', line: 'line-d' },
    { id: 'oven-001', name: '烘干炉 #1', line: 'line-d' }
  ],
  
  maintenanceTeams: [
    { id: 'team-mech', name: '机械维修组', members: ['张工', '李工', '王工'] },
    { id: 'team-elec', name: '电气维修组', members: ['刘工', '陈工', '赵工'] },
    { id: 'team-control', name: '控制维修组', members: ['周工', '吴工', '郑工'] }
  ],
  
  spareParts: [
    { id: 'bearing-001', name: '轴承6205', category: '机械件', cost: 150 },
    { id: 'bearing-002', name: '轴承6308', category: '机械件', cost: 280 },
    { id: 'seal-001', name: '密封圈套件', category: '密封件', cost: 80 },
    { id: 'sensor-001', name: '接近开关', category: '电气件', cost: 220 },
    { id: 'motor-001', name: '伺服电机1.5kW', category: '电气件', cost: 3500 },
    { id: 'hydraulic-001', name: '液压泵', category: '液压件', cost: 2800 },
    { id: 'filter-001', name: '油过滤器', category: '耗材', cost: 120 },
    { id: 'belt-001', name: '传动皮带', category: '传动件', cost: 95 },
    { id: 'contact-001', name: '接触器', category: '电气件', cost: 180 },
    { id: 'valve-001', name: '电磁阀', category: '气动件', cost: 320 }
  ],
  
  aggregationRules: {
    downtimeDuration: {
      minMinutes: 5,
      roundTo: 15
    },
    mttr: {
      excludePlanned: true,
      rollingDays: 30
    },
    oee: {
      plannedDowntimeExcluded: true,
      availabilityWeight: 0.6,
      performanceWeight: 0.3,
      qualityWeight: 0.1
    }
  },
  
  pareto: {
    threshold: 0.8,
    maxItems: 10
  }
}

module.exports = metricsConfig
