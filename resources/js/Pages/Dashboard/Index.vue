<template>
  <AppLayout title="看板">
    <div class="dashboard">
      <el-card shadow="never" class="filter-card" :body-style="{ padding: '16px 20px' }">
        <div class="filter-row">
          <div class="filter-title">
            <el-icon color="#2563eb"><Filter /></el-icon>
            <span>数据筛选</span>
          </div>
          <div class="filter-form">
            <el-date-picker
              v-model="filter.start_date"
              type="date"
              placeholder="开始日期"
              value-format="YYYY-MM-DD"
              :clearable="false"
              size="default"
              @change="applyFilter"
            />
            <span class="sep">至</span>
            <el-date-picker
              v-model="filter.end_date"
              type="date"
              placeholder="结束日期"
              value-format="YYYY-MM-DD"
              :clearable="false"
              size="default"
              @change="applyFilter"
            />
            <el-select
              v-model="filter.assignee_id"
              placeholder="全部责任人"
              clearable
              size="default"
              style="width: 160px"
              @change="applyFilter"
            >
              <el-option
                v-for="o in operators"
                :key="o.id"
                :label="o.name"
                :value="o.id"
              />
            </el-select>
            <el-button size="small" @click="resetFilter">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
            <div class="filter-actions">
              <el-button type="success" @click="exportLeads">
                <el-icon><Download /></el-icon>导出线索明细
              </el-button>
              <el-button type="warning" @click="exportQuality">
                <el-icon><Document /></el-icon>导出质量报表
              </el-button>
            </div>
          </div>
        </div>
      </el-card>

      <el-row :gutter="16" class="stats-row">
        <el-col :xs="12" :sm="8" :md="6" v-for="s in statCards" :key="s.key">
          <el-card shadow="hover" class="stat-card" :body-style="{ padding: '20px' }">
            <div class="stat-top">
              <div class="stat-icon" :style="{ background: s.bg, color: s.color }">
                <el-icon :size="20"><component :is="s.icon" /></el-icon>
              </div>
              <el-tag size="small" :type="s.tagType" effect="plain">
                {{ s.suffix }}
              </el-tag>
            </div>
            <div class="stat-value" :style="{ color: s.valueColor || '#111827' }">
              {{ s.formatFn ? s.formatFn(s.value) : s.value }}
            </div>
            <div class="stat-label">{{ s.label }}</div>
            <div class="stat-sub" v-if="s.subLabel">
              {{ s.subLabel }}
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="charts-row">
        <el-col :span="16">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <div class="card-header">
                <span class="title"><el-icon><TrendCharts /></el-icon>来源渠道转化率</span>
                <el-tag type="info" effect="plain">总线索按来源拆分</el-tag>
              </div>
            </template>
            <div v-if="sourceConversion.length" ref="sourceChartRef" class="chart-wrap"></div>
            <el-empty v-else description="暂无数据" />
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <div class="card-header">
                <span class="title"><el-icon><Medal /></el-icon>线索质量分布</span>
                <el-tag type="info" effect="plain">签约转化率</el-tag>
              </div>
            </template>
            <div ref="qualityChartRef" class="chart-wrap"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="report-row">
        <el-col :span="12">
          <el-card shadow="never" class="report-card">
            <template #header>
              <div class="card-header">
                <span class="title"><el-icon><Collection /></el-icon>线索质量报表详情</span>
              </div>
            </template>
            <el-alert
              class="quality-alert"
              :title="qualityReport.contractPendingExplanation.title"
              :description="qualityReport.contractPendingExplanation.description + ' ' + qualityReport.contractPendingExplanation.followUpTip"
              type="warning"
              show-icon
              :closable="false"
            />
            <el-table :data="qualityReport.qualityBreakdown" size="default" border stripe>
              <el-table-column prop="quality_label" label="质量级别" width="120">
                <template #default="{ row }">
                  <el-tag :type="qualityTagType(row.quality)" effect="light">
                    {{ row.quality_label }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="total" label="总数" width="90" align="right" />
              <el-table-column prop="signed" label="已签约" width="90" align="right" />
              <el-table-column label="签约转化率" width="120" align="right">
                <template #default="{ row }">
                  <el-progress :percentage="row.conversion_rate" :stroke-width="8" />
                </template>
              </el-table-column>
              <el-table-column label="平均客单价" align="right">
                <template #default="{ row }">
                  <span class="amount">¥ {{ row.avg_amount?.toLocaleString() ?? '0.00' }}</span>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never" class="report-card">
            <template #header>
              <div class="card-header">
                <span class="title"><el-icon><Clock /></el-icon>合同待确认清单（响应节点+责任人）</span>
                <el-tag type="warning" effect="plain" size="small">重点跟进</el-tag>
              </div>
            </template>
            <el-table :data="qualityReport.contractPendingDetails" size="small" border stripe max-height="420">
              <el-table-column label="客户" width="100">
                <template #default="{ row }">
                  <div class="client-cell">
                    <span class="name">{{ row.name }}</span>
                    <span class="phone">{{ row.phone }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="级别" width="64" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="qualityTagType(row.quality)">{{ row.quality }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="合同金额" width="100" align="right">
                <template #default="{ row }">
                  <span class="amount" v-if="row.contract_amount">¥ {{ row.contract_amount.toLocaleString() }}</span>
                  <span v-else class="muted">-</span>
                </template>
              </el-table-column>
              <el-table-column label="待确认说明" min-width="160">
                <template #default="{ row }">
                  <el-tooltip :content="row.contract_pending_explanation || '无说明'" placement="top">
                    <span class="explanation">{{ row.contract_pending_explanation || '无说明' }}</span>
                  </el-tooltip>
                </template>
              </el-table-column>
              <el-table-column label="责任人" width="90" align="center">
                <template #default="{ row }">
                  <el-tag type="primary" effect="plain" size="small">{{ row.assignee_name || '未分配' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="创建时间" width="140">
                <template #default="{ row }">{{ row.created_at?.slice(5, 16) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="60" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button
                    link
                    type="primary"
                    size="small"
                    @click="router.visit(`/leads/${row.id}`)"
                  >详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="pending-row">
        <el-col :span="24">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span class="title"><el-icon><Promotion /></el-icon>最新合同待跟进 Top 10（含最近响应节点）</span>
              </div>
            </template>
            <el-table :data="contractPendingList" size="small" border>
              <el-table-column prop="name" label="客户" width="90" />
              <el-table-column prop="phone" label="电话" width="130" />
              <el-table-column label="质量" width="64" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="qualityTagType(row.quality)">{{ row.quality_label }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="合同金额" width="100" align="right">
                <template #default="{ row }">
                  <span v-if="row.contract_amount" class="amount">¥ {{ row.contract_amount.toLocaleString() }}</span>
                  <span v-else class="muted">-</span>
                </template>
              </el-table-column>
              <el-table-column prop="contract_pending_explanation" label="待确认说明" min-width="180" show-overflow-tooltip />
              <el-table-column label="责任人" width="90">
                <template #default="{ row }">{{ row.assignee_name || '未分配' }}</template>
              </el-table-column>
              <el-table-column label="最近响应节点（保留节点类型+责任人）" min-width="360">
                <template #default="{ row }">
                  <div class="nodes">
                    <div v-for="(node, idx) in row.latest_nodes" :key="idx" class="node-item">
                      <el-tag size="small" :type="nodeTagType(node.node_type)">
                        {{ node.node_type_label }}
                      </el-tag>
                      <span class="node-content">{{ node.content }}</span>
                      <span class="node-op">@{{ node.operator_name }}</span>
                      <span class="node-time">{{ node.created_at?.slice(5, 16) }}</span>
                    </div>
                    <span v-if="!row.latest_nodes?.length" class="muted">暂无节点</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="60" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="router.visit(`/leads/${row.id}`)">详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch, reactive, nextTick } from 'vue';
import { usePage, router } from '@inertiajs/vue3';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import AppLayout from '@/Layouts/AppLayout.vue';

const page = usePage<any>();

const operators = computed(() => page.props.operators || []);
const stats = computed<any>(() => page.props.stats || {});
const sourceConversion = computed<any[]>(() => page.props.sourceConversion || []);
const qualityReport = computed<any>(() => page.props.qualityReport || { qualityBreakdown: [], contractPendingDetails: [], contractPendingExplanation: {} });
const statusTrend = computed<any[]>(() => page.props.statusTrend || []);
const contractPendingList = computed<any[]>(() => page.props.contractPendingList || []);

const defaultFilter = {
  start_date: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
  end_date: dayjs().format('YYYY-MM-DD'),
  assignee_id: null as any,
};
const filter = reactive({ ...(page.props.filters || defaultFilter) });
if (!filter.start_date) Object.assign(filter, defaultFilter);

const sourceChartRef = ref<HTMLElement | null>(null);
const qualityChartRef = ref<HTMLElement | null>(null);
let sourceChart: echarts.ECharts | null = null;
let qualityChart: echarts.ECharts | null = null;

const statCards = computed(() => [
  { key: 'total', label: '新增线索', value: stats.value.total ?? 0, icon: 'User', bg: '#eff6ff', color: '#2563eb', tagType: 'primary', suffix: '条', formatFn: (v: number) => v.toLocaleString() },
  { key: 'contactRate', label: '触达率', value: stats.value.contactRate ?? 0, icon: 'ChatLineRound', bg: '#ecfdf5', color: '#059669', tagType: 'success', suffix: '已联系/总', formatFn: (v: number) => v + '%' },
  { key: 'quoteRate', label: '报价率', value: stats.value.quoteRate ?? 0, icon: 'Document', bg: '#fef3c7', color: '#d97706', tagType: 'warning', suffix: '已报价/已联系', formatFn: (v: number) => v + '%' },
  { key: 'conversionRate', label: '签约转化率', value: stats.value.conversionRate ?? 0, icon: 'CircleCheck', bg: '#fce7f3', color: '#db2777', tagType: 'danger', suffix: '已签约/总', formatFn: (v: number) => v + '%' },
  { key: 'signed', label: '已签约数', value: stats.value.signed ?? 0, icon: 'Money', bg: '#f0fdf4', color: '#16a34a', tagType: 'success', suffix: '单', formatFn: (v: number) => v.toLocaleString() },
  { key: 'totalRevenue', label: '合同总金额', value: stats.value.totalRevenue ?? 0, icon: 'Wallet', bg: '#eff6ff', color: '#1d4ed8', tagType: 'primary', suffix: '元', valueColor: '#1d4ed8', formatFn: (v: number) => '¥ ' + v.toLocaleString() },
  { key: 'avgOrderValue', label: '平均客单价', value: stats.value.avgOrderValue ?? 0, icon: 'Histogram', bg: '#f5f3ff', color: '#7c3aed', tagType: 'info', suffix: '元/单', formatFn: (v: number) => '¥ ' + v.toLocaleString() },
  { key: 'ocean', label: '公海线索数', value: stats.value.ocean ?? 0, icon: 'Brush', bg: '#fef2f2', color: '#dc2626', tagType: 'danger', suffix: '条待回收', formatFn: (v: number) => v.toLocaleString() },
]);

const qualityTagType = (q: string) => {
  return ({ A: 'danger', B: 'warning', C: 'success', D: 'info' } as any)[q] || 'info';
};
const nodeTagType = (t: string) => {
  const map: Record<string, any> = {
    first_contact: 'success', consultation: 'primary', quote_sent: 'warning',
    follow_up: 'info', contract_sent: 'warning', contract_signed: 'danger',
    treatment_arranged: 'success', lost: 'danger',
  };
  return map[t] || 'info';
};

const applyFilter = () => {
  router.get('/dashboard', { ...filter }, { preserveState: true, replace: true });
};
const resetFilter = () => {
  Object.assign(filter, defaultFilter);
  applyFilter();
};
const exportLeads = () => {
  const params = new URLSearchParams({ ...(filter as any) }).toString();
  window.open(`/exports/leads?${params}`, '_blank');
};
const exportQuality = () => {
  const params = new URLSearchParams({ ...(filter as any) }).toString();
  window.open(`/exports/lead-quality?${params}`, '_blank');
};

const renderSourceChart = () => {
  if (!sourceChartRef.value) return;
  sourceChart?.dispose();
  sourceChart = echarts.init(sourceChartRef.value);
  const data = sourceConversion.value;
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['总数', '已签约', '转化率%'], top: 0 },
    grid: { left: 40, right: 50, top: 40, bottom: 60 },
    xAxis: { type: 'category', data: data.map(d => d.source_label), axisLabel: { rotate: 20 } },
    yAxis: [
      { type: 'value', name: '数量' },
      { type: 'value', name: '转化率', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
    ],
    series: [
      { name: '总数', type: 'bar', data: data.map(d => d.total), itemStyle: { color: '#3b82f6' }, barWidth: 18 },
      { name: '已签约', type: 'bar', data: data.map(d => d.signed), itemStyle: { color: '#10b981' }, barWidth: 18 },
      { name: '转化率%', type: 'line', yAxisIndex: 1, data: data.map(d => d.conversion_rate), itemStyle: { color: '#f59e0b' }, lineStyle: { width: 3 } },
    ],
  };
  sourceChart.setOption(option);
};

const renderQualityChart = () => {
  if (!qualityChartRef.value) return;
  qualityChart?.dispose();
  qualityChart = echarts.init(qualityChartRef.value);
  const data = qualityReport.value.qualityBreakdown || [];
  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} 条 ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      name: '质量分布',
      type: 'pie',
      radius: ['45%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%' },
      data: data.map((d: any, i: number) => ({
        name: d.quality_label,
        value: d.total,
        itemStyle: { color: ['#ef4444', '#f59e0b', '#10b981', '#6b7280'][i] },
      })),
    }],
  };
  qualityChart.setOption(option);
};

const renderCharts = () => {
  nextTick(() => {
    renderSourceChart();
    renderQualityChart();
  });
};

onMounted(() => {
  renderCharts();
  window.addEventListener('resize', () => {
    sourceChart?.resize();
    qualityChart?.resize();
  });
});

watch([sourceConversion, qualityReport], renderCharts, { deep: true });
</script>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 16px; }
.filter-card { margin-bottom: 0; }
.filter-row { display: flex; flex-direction: column; gap: 12px; }
.filter-title { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #1f2937; }
.filter-form { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
.sep { color: #9ca3af; }
.filter-actions { margin-left: auto; display: flex; gap: 8px; }
.stats-row { margin-top: 0 !important; }
.stat-card { height: 100%; }
.stat-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.stat-value { font-size: 26px; font-weight: 700; line-height: 1.2; }
.stat-label { font-size: 13px; color: #6b7280; margin-top: 6px; }
.stat-sub { font-size: 12px; color: #9ca3af; margin-top: 4px; }
.charts-row { margin-top: 0 !important; }
.chart-card .chart-wrap { width: 100%; height: 340px; }
.report-row { margin-top: 0 !important; }
.report-card .quality-alert { margin-bottom: 14px; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.card-header .title { display: flex; align-items: center; gap: 6px; font-weight: 600; color: #111827; }
.amount { color: #1d4ed8; font-weight: 600; }
.muted { color: #9ca3af; }
.client-cell { display: flex; flex-direction: column; gap: 2px; }
.client-cell .name { font-weight: 500; color: #111827; }
.client-cell .phone { font-size: 12px; color: #6b7280; }
.explanation { color: #4b5563; font-size: 13px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.pending-row { margin-top: 0 !important; }
.nodes { display: flex; flex-direction: column; gap: 6px; }
.node-item { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; font-size: 12px; padding: 4px 6px; background: #f9fafb; border-radius: 4px; }
.node-content { color: #374151; flex: 1; min-width: 120px; }
.node-op { color: #2563eb; }
.node-time { color: #9ca3af; }
:deep(.el-card__header) { padding: 14px 20px; }
:deep(.el-table th.el-table__cell) { background: #f9fafb; }
</style>
