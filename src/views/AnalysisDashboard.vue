<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useFilterStore } from '../stores/filterStore';
import { api, type OverviewResult, type HeatmapPoint, type RankItem, type ExceptionItem, type TrendPoint } from '../utils/api';
import { Download, ShieldAlert, Activity } from 'lucide-vue-next';

import KpiCard from '../components/dashboard/KpiCard.vue';
import FilterBar from '../components/dashboard/FilterBar.vue';
import ExceptionSummary from '../components/dashboard/ExceptionSummary.vue';
import HeatmapChart from '../components/charts/HeatmapChart.vue';
import TrendChart from '../components/charts/TrendChart.vue';
import RankBarChart from '../components/charts/RankBarChart.vue';
import ExceptionTable from '../components/tables/ExceptionTable.vue';

const store = useFilterStore();

const loading = ref(false);
const overview = ref<OverviewResult | null>(null);
const heatmapData = ref<HeatmapPoint[]>([]);
const rankData = ref<RankItem[]>([]);
const trendData = ref<TrendPoint[]>([]);
const exceptions = ref<ExceptionItem[]>([]);
const exceptionTotal = ref(0);
const exceptionPage = ref(1);
const pageSize = ref(10);
const sortBy = ref<'total' | 'abnormal'>('total');

const refreshKey = ref(0);

async function loadData() {
  loading.value = true;
  try {
    const params = store.filterParams;
    
    const [overviewRes, heatmapRes, rankRes, trendRes, exceptionRes] = await Promise.all([
      api.getOverview(params),
      api.getHeatmap(params),
      api.getRank(params, sortBy.value, 10),
      api.getTrend(params, 'hour'),
      api.getExceptions(params, exceptionPage.value, pageSize.value),
    ]);

    overview.value = overviewRes;
    heatmapData.value = heatmapRes;
    rankData.value = rankRes;
    trendData.value = trendRes;
    exceptions.value = exceptionRes.list;
    exceptionTotal.value = exceptionRes.total;
  } catch (e) {
    console.error('Failed to load data', e);
  } finally {
    loading.value = false;
  }
}

function handleRefresh() {
  refreshKey.value++;
}

async function handleExport() {
  try {
    const task = await api.createExport('xlsx', store.filterParams);
    alert(`导出任务已创建，任务ID: ${task.taskId.slice(0, 8)}...`);
  } catch (e) {
    console.error('Export failed', e);
  }
}

function handleSortChange(sort: 'total' | 'abnormal') {
  sortBy.value = sort;
  loadData();
}

function handlePageChange(page: number) {
  exceptionPage.value = page;
  loadData();
}

function handleGateClick(gateId: string) {
  store.setGateIds([gateId]);
}

function handleEnterpriseClick(enterpriseId: string) {
  store.setEnterpriseIds([enterpriseId]);
}

const filterParamsKey = computed(() => JSON.stringify(store.filterParams));

watch([filterParamsKey, refreshKey], () => {
  exceptionPage.value = 1;
  loadData();
});

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="min-h-screen p-6">
    <header class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-3">
            <ShieldAlert class="w-8 h-8 text-[var(--color-accent-light)]" />
            <div>
              <h1 class="text-2xl font-bold text-[var(--color-text-primary)]">工业园区访客流量分析</h1>
              <p class="text-sm text-[var(--color-text-muted)] mt-1">
                整合预约、闸机、车牌、被访企业等多源数据，揭示访客行为规律与异常模式
              </p>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Activity class="w-5 h-5 text-[var(--color-success)] pulse-dot" />
          <span class="text-sm text-[var(--color-text-secondary)]">系统运行正常</span>
        </div>
      </div>
    </header>

    <section class="mb-6">
      <FilterBar @refresh="handleRefresh" @export="handleExport" />
    </section>

    <section class="grid grid-cols-4 gap-4 mb-6">
      <KpiCard
        title="访客总量"
        :value="overview?.totalVisitors || 0"
        suffix="人次"
        :trend="8.2"
        trendLabel="较上周"
      />
      <KpiCard
        title="异常放行"
        :value="overview?.totalAbnormal || 0"
        suffix="次"
        :trend="-3.5"
        trendLabel="较上周"
        accent="warning"
      />
      <KpiCard
        title="异常率"
        :value="overview?.abnormalRate || 0"
        suffix="%"
        accent="danger"
      />
      <KpiCard
        title="高峰时段"
        :value="overview?.peakHour || '-' "
      />
    </section>

    <section class="grid grid-cols-12 gap-6 mb-6">
      <div class="col-span-8">
        <div class="grid grid-cols-2 gap-6 h-full">
          <HeatmapChart
            :data="heatmapData"
            :loading="loading"
            @gate-click="handleGateClick"
          />
          <TrendChart
            :data="trendData"
            :loading="loading"
          />
        </div>
      </div>
      <div class="col-span-4">
        <ExceptionSummary
          :events="overview?.abnormalEvents || []"
          :loading="loading"
        />
      </div>
    </section>

    <section class="grid grid-cols-12 gap-6 mb-6">
      <div class="col-span-5">
        <RankBarChart
          :data="rankData"
          :loading="loading"
          @sort-change="handleSortChange"
          @enterprise-click="handleEnterpriseClick"
        />
      </div>
      <div class="col-span-7">
        <ExceptionTable
          :data="exceptions"
          :total="exceptionTotal"
          :loading="loading"
          :page="exceptionPage"
          :page-size="pageSize"
          @page-change="handlePageChange"
        />
      </div>
    </section>

    <footer class="text-center text-xs text-[var(--color-text-muted)] py-4">
      <p>数据来源：闸机系统 · 车牌识别 · 访客预约系统 | 数据每5分钟自动更新</p>
      <p class="mt-1">车牌与证件号已按隐私保护要求脱敏处理</p>
    </footer>
  </div>
</template>
