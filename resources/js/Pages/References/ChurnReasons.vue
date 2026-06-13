<template>
  <AppLayout title="流失原因">
    <div class="churn-page">
      <el-card shadow="never" class="filter-card" :body-style="{ padding: '16px 20px' }">
        <div class="filter-row">
          <div class="left">
            <el-icon color="#2563eb"><CloseBold /></el-icon>
            <span class="title">流失原因统计</span>
            <el-tag type="danger" effect="plain" size="small">总计流失：{{ totalLost }} 条</el-tag>
          </div>
          <div class="right">
            <el-date-picker
              v-model="start_date"
              type="date"
              placeholder="开始日期"
              value-format="YYYY-MM-DD"
              clearable
              @change="reload"
            />
            <span class="sep">至</span>
            <el-date-picker
              v-model="end_date"
              type="date"
              placeholder="结束日期"
              value-format="YYYY-MM-DD"
              clearable
              @change="reload"
            />
            <el-switch
              v-model="activeOnly"
              active-text="仅启用"
              inactive-text="全部"
              @change="reload"
            />
          </div>
        </div>
      </el-card>

      <el-row :gutter="16">
        <el-col :xs="24" :sm="10">
          <el-card shadow="never">
            <template #header>
              <div class="card-title"><el-icon><PieChart /></el-icon>按分类汇总</div>
            </template>
            <div ref="chartRef" class="chart"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="14">
          <el-card shadow="never">
            <template #header>
              <div class="card-title"><el-icon><DataLine /></el-icon>流失原因明细表</div>
            </template>
            <el-table :data="reasons" size="default" border stripe>
              <el-table-column prop="category" label="分类" width="120">
                <template #default="{ row }">
                  <el-tag size="small" type="warning" effect="plain">{{ row.category }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="原因名称" min-width="160" show-overflow-tooltip />
              <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip>
                <template #default="{ row }">
                  <span v-if="row.description">{{ row.description }}</span>
                  <span v-else class="muted">-</span>
                </template>
              </el-table-column>
              <el-table-column prop="count" label="数量" width="90" align="right" sortable>
                <template #default="{ row }">
                  <b v-if="row.count" style="color:#b91c1c">{{ row.count }}</b>
                  <span v-else>0</span>
                </template>
              </el-table-column>
              <el-table-column label="占比" width="140">
                <template #default="{ row }">
                  <el-progress :percentage="row.percentage" :stroke-width="10" />
                </template>
              </el-table-column>
              <el-table-column label="状态" width="80" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.is_active ? 'success' : 'info'" effect="plain">
                    {{ row.is_active ? '启用' : '停用' }}
                  </el-tag>
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
import { computed, onMounted, ref, watch, nextTick } from 'vue';
import { usePage, router } from '@inertiajs/vue3';
import * as echarts from 'echarts';
import AppLayout from '@/Layouts/AppLayout.vue';

const page = usePage<any>();
const start_date = ref(page.props.filters?.start_date || null);
const end_date = ref(page.props.filters?.end_date || null);
const activeOnly = ref<boolean>(page.props.filters?.is_active === true ? true : false);
const reasons = computed<any[]>(() => page.props.reasons || []);
const categoryStats = computed<any[]>(() => page.props.categoryStats || []);
const totalLost = computed<number>(() => page.props.totalLost || 0);
const chartRef = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;

const render = () => {
  if (!chartRef.value) return;
  chart?.dispose();
  chart = echarts.init(chartRef.value);
  const data = categoryStats.value.map((c: any, i: number) => ({
    name: c.category,
    value: c.count,
    itemStyle: { color: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#6b7280'][i % 7] },
  }));
  chart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}<br/>数量：{c}<br/>占比：{d}%' },
    legend: { bottom: 0, type: 'scroll' },
    series: [{
      type: 'pie',
      radius: ['40%', '72%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%' },
      data,
    }],
  });
};

onMounted(() => nextTick(render));
watch(categoryStats, () => nextTick(render), { deep: true });

const reload = () => {
  router.get('/churn-reasons', {
    start_date: start_date.value || null,
    end_date: end_date.value || null,
    is_active: activeOnly.value ? 1 : null,
  }, { preserveState: true, replace: true });
};
</script>

<style scoped>
.churn-page { display: flex; flex-direction: column; gap: 16px; }
.filter-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.filter-row .left, .filter-row .right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.filter-row .left { font-weight: 600; color: #1f2937; }
.sep { color: #9ca3af; }
.chart { width: 100%; height: 360px; }
.card-title { display: flex; align-items: center; gap: 6px; font-weight: 600; }
.muted { color: #9ca3af; }
</style>
