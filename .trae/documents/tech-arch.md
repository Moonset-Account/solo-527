# 电动车充电桩故障可视化数据工作台 - 技术架构

## 1. 架构设计

```mermaid
graph TD
    subgraph "前端层 (Vue 3 + Vite)"
        A["视图层 - 仪表盘页面"]
        B["组件层 - D3 图表组件"]
        C["状态层 - Pinia 全局状态"]
        D["工具层 - 数据处理/导出"]
    end
    
    subgraph "数据层 (模拟 ClickHouse)"
        E["数据生成器 - Mock 数据"]
        F["数据处理器 - 清洗/合并/计算"]
        G["查询引擎 - 类 SQL 筛选"]
    end
    
    subgraph "外部服务"
        H["D3.js - 可视化引擎"]
        I["jsPDF - PDF 导出"]
        J["html2canvas - 截图渲染"]
    end
    
    C --> B
    B --> A
    D --> A
    F --> C
    E --> F
    G --> F
    B --> H
    D --> I
    D --> J
```

## 2. 技术选型

- **前端框架**: Vue 3.4 + Composition API + `<script setup>`
- **构建工具**: Vite 5
- **状态管理**: Pinia
- **样式方案**: TailwindCSS 3 + SCSS 变量
- **可视化引擎**: D3.js v7
- **UI 组件**: 自定义组件（非组件库）
- **数据导出**: 
  - CSV: 原生 Blob + FileSaver
  - PDF: jsPDF + html2canvas
- **数据层**: 前端模拟 ClickHouse 查询，生成真实感 Mock 数据

## 3. 目录结构

```
src/
├── components/
│   ├── charts/
│   │   ├── FaultMap.vue        # 故障地图
│   │   ├── PowerCurve.vue      # 功率曲线
│   │   ├── RepairTime.vue      # 维修耗时
│   │   └── StationRank.vue     # 站点排行
│   ├── common/
│   │   ├── KpiCard.vue         # KPI 卡片
│   │   ├── FilterBar.vue       # 全局筛选栏
│   │   ├── ChartHeader.vue     # 图表头（样本量/更新时间）
│   │   └── ChartContainer.vue  # 图表容器
│   └── dashboard/
│       ├── TopAnomalies.vue    # 今日异常三件事
│       └── DrillPanel.vue      # 下钻详情面板
├── stores/
│   └── dataStore.js            # 全局数据状态
├── data/
│   ├── mock/
│   │   ├── generator.js        # Mock 数据生成器
│   │   └── seed.js             # 种子数据
│   ├── processor/
│   │   ├── cleaner.js          # 缺失值处理
│   │   ├── merger.js           # 重复报修合并
│   │   └── calculator.js       # 指标计算（可用率等）
│   └── query/
│       └── engine.js           # 类 ClickHouse 查询引擎
├── utils/
│   ├── exportCSV.js            # CSV 导出
│   ├── exportPDF.js            # PDF 导出
│   └── d3Helpers.js            # D3 辅助函数
├── App.vue
└── main.js
```

## 4. 核心数据模型

### 4.1 ER 图

```mermaid
erDiagram
    STATION ||--o{ CHARGER : has
    CHARGER ||--o{ CHARGING_SESSION : produces
    CHARGER ||--o{ POWER_READING : produces
    CHARGER ||--o{ FAULT_LOG : has
    FAULT_LOG ||--o| REPAIR_ORDER : generates
    REPAIR_ORDER }o--|| REPAIR_PERSON : assigned_to
    STATION ||--o{ INSPECTION : has
    CHARGING_SESSION ||--o| PAYMENT : has
    
    STATION {
        string id PK
        string name
        float lat
        float lng
        string region
        datetime create_time
    }
    
    CHARGER {
        string id PK
        string station_id FK
        string model
        float rated_power
        string status
        boolean is_offline
    }
    
    CHARGING_SESSION {
        string id PK
        string charger_id FK
        datetime start_time
        datetime end_time
        float total_kwh
        float avg_power
    }
    
    POWER_READING {
        string id PK
        string session_id FK
        datetime timestamp
        float power
        float voltage
        float current
    }
    
    FAULT_LOG {
        string id PK
        string charger_id FK
        string fault_code
        string fault_desc
        datetime occur_time
        string severity
    }
    
    REPAIR_ORDER {
        string id PK
        string fault_id FK
        string person_id FK
        datetime create_time
        datetime complete_time
        float repair_hours
        string status
    }
    
    REPAIR_PERSON {
        string id PK
        string name
        string team
        int total_orders
    }
```

### 4.2 核心计算逻辑

**可用率计算**（离线桩排除）：
```javascript
function calcAvailability(stations, chargers, faults) {
  const onlineChargers = chargers.filter(c => !c.is_offline);
  const faultyChargerIds = new Set(
    faults.filter(f => 
      f.occur_time > todayStart && 
      chargers.find(c => c.id === f.charger_id && !c.is_offline)
    ).map(f => f.charger_id)
  );
  const normalCount = onlineChargers.filter(c => !faultyChargerIds.has(c.id)).length;
  return normalCount / onlineChargers.length;
}
```

**重复报修合并**（72小时内同桩同故障码）：
```javascript
function mergeDuplicateRepairs(faults) {
  const sorted = [...faults].sort((a, b) => a.occur_time - b.occur_time);
  const merged = [];
  const windowMs = 72 * 60 * 60 * 1000;
  
  for (const fault of sorted) {
    const last = merged.find(m => 
      m.charger_id === fault.charger_id &&
      m.fault_code === fault.fault_code &&
      fault.occur_time - m.occur_time <= windowMs
    );
    if (last) {
      last.duplicate_count = (last.duplicate_count || 1) + 1;
      last.last_occur_time = fault.occur_time;
    } else {
      merged.push({ ...fault, duplicate_count: 1 });
    }
  }
  return merged;
}
```

## 5. 状态管理（Pinia）

```javascript
// dataStore.js
export const useDataStore = defineStore('data', {
  state: () => ({
    // 原始数据
    stations: [],
    chargers: [],
    sessions: [],
    powerReadings: [],
    faultLogs: [],
    repairOrders: [],
    repairPersons: [],
    
    // 筛选条件
    filters: {
      stationIds: [],
      chargerModels: [],
      faultCodes: [],
      timeRange: [todayStart, now],
      repairPersonIds: []
    },
    
    // 下钻状态
    drillDown: {
      level: 'overview', // overview -> station -> charger -> fault
      selectedStationId: null,
      selectedChargerId: null,
      selectedFaultCode: null
    },
    
    // 元信息
    lastUpdateTime: null,
    isLoading: false
  }),
  
  getters: {
    filteredFaults: (state) => applyFilters(state.faultLogs, state.filters),
    filteredRepairs: (state) => applyFilters(state.repairOrders, state.filters),
    topAnomalies: (state) => calcTopAnomalies(state),
    availabilityRate: (state) => calcAvailability(state),
    sampleSizeByChart: (state) => calcSampleSizes(state)
  },
  
  actions: {
    async loadAllData() { ... },
    setFilter(key, value) { ... },
    drillTo(level, id) { ... },
    exportData(format) { ... }
  }
});
```

## 6. D3 图表组件规范

每个图表组件统一结构：
```vue
<template>
  <ChartContainer :sample-size="sampleSize" :update-time="lastUpdate" :filters="activeFilters">
    <svg ref="svgRef"></svg>
  </ChartContainer>
</template>

<script setup>
// 统一接收 props: data, width, height, onSelect
// 使用 onMounted + watch 响应数据变化
// 使用 D3 enter/update/exit 模式绑定数据
</script>
```

## 7. 缺失值处理策略

| 字段 | 缺失处理方式 |
|------|-------------|
| 功率读数 | 线性插值填充，连续缺失 > 5min 标记为断连区段 |
| 故障描述 | 用故障码映射表填充默认描述 |
| 维修完成时间 | 未完工单不计入平均耗时统计，单独标记 |
| 站点坐标 | 用区域中心坐标兜底，地图上半透明显示 |
| 支付数据 | 缺失则不影响故障分析，仅在相关图表标注"数据缺失" |
