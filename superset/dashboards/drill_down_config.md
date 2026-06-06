# 仓库SKU周转与滞销分析 - 图表联动与下钻配置

## 一、下钻路径设计

### 1.1 主下钻路径（7级下钻）
```
整体趋势 → 分类分析 → SKU分析 → 仓位分布 → 供应商分析 → 批次明细 → 原始单据
  (Level 0)   (Level 1)   (Level 2)   (Level 3)   (Level 4)    (Level 5)   (Level 6)
```

### 1.2 各级别内容说明

| 级别 | 视图名称 | 维度 | 指标 | 支持筛选 |
|------|---------|------|------|---------|
| Level 0 | 整体趋势 | 时间（日/周/月） | 库存总量、入库总量、出库总量、库存金额、周转天数 | 时间范围、仓库 |
| Level 1 | 分类分析 | 一级分类、二级分类、三级分类 | 分类库存量、分类占比、分类周转天数、分类库龄分布 | 时间范围、仓库、分类 |
| Level 2 | SKU分析 | SKU编码、SKU名称、品牌 | SKU库存、SKU周转、SKU库龄、SKU补货状态 | 时间范围、仓库、分类、SKU搜索 |
| Level 3 | 仓位分布 | 仓库、库区、库位 | 各仓位库存量、库位利用率、异常库存仓位 | 仓库、SKU |
| Level 4 | 供应商分析 | 供应商编码、供应商名称 | 供货量、供货占比、准时率、品质合格率、平均提前期 | 时间范围、SKU、供应商 |
| Level 5 | 批次明细 | 批次号、生产日期、有效期 | 批次库存、批次库龄、距到期天数、批次入库来源 | SKU、仓库、批次状态 |
| Level 6 | 原始单据 | 入库单号、出库单号、退货单号 | 单据明细、操作人、操作时间、备注 | 单据类型、时间、SKU、批次 |

---

## 二、图表联动配置

### 2.1 全局筛选器
所有图表共享以下筛选器，修改后自动刷新所有关联图表：

| 筛选器 | 类型 | 作用范围 |
|--------|------|---------|
| 日期范围 | 时间选择器 | 所有库存、库龄、周转类图表 |
| 仓库 | 多选下拉 | 所有图表 |
| 商品分类（一级/二级） | 级联选择 | 所有图表 |
| SKU搜索 | 搜索下拉 | 所有图表 |
| 库存状态 | 单选（正常/缺货/超储/全部） | 补货建议、库存明细 |

### 2.2 交叉筛选（Cross-Filtering）
点击任一图表的数据点，自动过滤其他所有图表：

| 源图表 | 点击维度 | 目标图表过滤效果 |
|--------|---------|-----------------|
| 库龄分布图 | 库龄区间 | 周转排行、补货建议、滞销明细只显示该库龄区间的SKU |
| 周转排行榜 | SKU行 | 库存趋势、批次明细、仓位分布只显示该SKU |
| 补货建议表 | 库存状态 | 库存漏斗、库龄分布只显示该状态的SKU |
| 近效期预警 | 批次行 | 供应商分析、原始单据显示该批次相关信息 |

### 2.3 联动配置示例

```yaml
# 库龄分布图 → 周转排行榜 联动
cross_filter_config:
  source_chart_id: 2  # 库龄分布
  target_chart_ids: [3, 4, 7]  # 周转排行、补货建议、滞销明细
  source_column: age_bucket
  target_column: age_bucket
  behavior: highlight + filter

# 周转排行榜 → SKU详情 钻取
drill_config:
  source_chart_id: 3  # 周转排行
  drill_path:
    - from: sku_code
      to: /superset/explore/?form_data={"datasource":"5__table","viz_type":"table","filters":[{"col":"sku_code","op":"==","val":"{{ value }}"}]}
      target: new_tab
```

---

## 三、下钻操作说明

### 3.1 操作方式
1. **悬停查看**：鼠标悬停在图表数据点上，显示详细Tooltip
2. **点击筛选**：点击图表数据点（如某库龄区间、某SKU），全局过滤
3. **右键下钻**：在表格行上右键，选择"钻取到..."
4. **双击下钻**：在支持下钻的图表上双击数据点

### 3.2 Tooltip 内容配置

**库存漏斗Tooltip：**
```
阶段: {{ stage }}
数量: {{ qty }} 件
占比: {{ percentage }} %
环比变化: {{ mom_change }} %
```

**库龄分布Tooltip：**
```
库龄区间: {{ age_bucket }}
SKU数量: {{ sku_count }} 个
库存数量: {{ total_qty }} 件
库存金额: ¥ {{ total_amount }}
占比: {{ percentage }} %
```

**周转排行Tooltip：**
```
SKU: {{ sku_code }} - {{ sku_name }}
近30天出库: {{ last_30d_outbound_qty }} 件
平均库存: {{ avg_inventory_qty }} 件
周转率: {{ turnover_rate }} 次/月
周转天数: {{ turnover_days }} 天
等级: {{ turnover_grade }}
```

---

## 四、异常点交互配置

### 4.1 异常高亮规则
在表格和图表中，对异常数据自动应用样式：

| 异常类型 | 判定条件 | 样式 |
|---------|---------|------|
| 临期（7天内） | days_to_expiry <= 7 | 红色背景 + 红色文字 |
| 近效期（30天内） | days_to_expiry <= 30 | 橙色背景 |
| 滞销 | inventory_age_days > 180 | 紫色背景 |
| 严重缺货 | current_stock < min_stock | 红色文字 + 感叹号图标 |
| 超储 | current_stock > max_stock | 黄色背景 |

### 4.2 异常点点击弹窗
点击异常数据点时，弹出详情面板包含：
```
┌─────────────────────────────────────────┐
│  🔴 临期预警  SKU001 - 牛奶原味250ml    │
├─────────────────────────────────────────┤
│  批次号: B20240101                      │
│  生产日期: 2024-01-01                   │
│  有效期至: 2024-06-29                   │
│  距到期: 3 天                           │
│  当前库存: 150 件                       │
│  仓库: 上海总仓 / A区01-01-01           │
│  供应商: 杭州食品有限公司                │
├─────────────────────────────────────────┤
│  📝 历史注释:                           │
│  [张三 2024-06-25] 已联系运营促销       │
│  [李四 2024-06-26] 已设置买一送一        │
├─────────────────────────────────────────┤
│  [添加注释]  [查看原始单据]  [导出CSV]   │
└─────────────────────────────────────────┘
```

### 4.3 注释功能配置
- 注释存储在 PostgreSQL `fact_anomaly_comment` 表
- 支持 @提及用户
- 支持设置处理人和截止日期
- 注释状态：待处理 → 处理中 → 已解决 → 已关闭

---

## 五、钻取到原始记录

### 5.1 钻取入口
1. 表格行操作列 → "查看原始单据"
2. 异常弹窗 → "查看原始单据"按钮
3. 批次明细 → "关联单据"Tab

### 5.2 原始记录显示字段

**入库单原始记录：**
| 字段 | 说明 |
|------|------|
| 入库单号 | 可点击跳转单据详情 |
| 入库类型 | 采购/退货/调拨 |
| 入库日期 | |
| 批次号 | |
| 数量 | |
| 单价 | |
| 金额 | |
| 供应商 | |
| 仓库/库位 | |
| 收货人 | |
| 备注 | |

**出库单原始记录：**
| 字段 | 说明 |
|------|------|
| 出库单号 | 可点击跳转单据详情 |
| 出库类型 | 销售/调拨/报损 |
| 出库日期 | |
| 批次号 | |
| 数量 | |
| 单价 | |
| 金额 | |
| 客户名称 | |
| 仓库/库位 | |
| 发货人 | |
| 备注 | |

---

## 六、Superset 钻取配置SQL示例

### 6.1 库存明细钻取查询
```sql
-- Level 2: SKU级 → Level 3: 仓位级
SELECT
    warehouse_code,
    warehouse_name,
    location_code,
    location_name,
    sum(closing_qty) AS stock_qty,
    count(DISTINCT batch_no) AS batch_count,
    round(avg(inventory_age_days), 1) AS avg_age_days
FROM ods_inventory_detail
WHERE snapshot_date = '{{ snapshot_date }}'
  AND sku_code = '{{ sku_code }}'
  {% if warehouse_code %} AND warehouse_code = '{{ warehouse_code }}' {% endif %}
GROUP BY warehouse_code, warehouse_name, location_code, location_name
ORDER BY stock_qty DESC
```

### 6.2 批次明细钻取查询
```sql
-- Level 4: SKU级 → Level 5: 批次级
SELECT
    batch_no,
    production_date,
    expiry_date,
    closing_qty,
    inventory_age_days,
    days_to_expiry,
    CASE
        WHEN days_to_expiry <= 7 THEN '🔴 临期'
        WHEN days_to_expiry <= 30 THEN '🟠 近效期'
        ELSE '✅ 正常'
    END AS expiry_status,
    supplier_name,
    warehouse_code,
    location_code
FROM ods_inventory_detail
WHERE snapshot_date = today() - 1
  AND sku_code = '{{ sku_code }}'
  AND closing_qty > 0
ORDER BY days_to_expiry ASC
```
