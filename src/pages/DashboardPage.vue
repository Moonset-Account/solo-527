<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { MapPin, User, Bell, Settings } from 'lucide-vue-next';
import { useFilterStore } from '@/stores/filter';
import { useHeatmapStore } from '@/stores/heatmap';
import { useQueueStore } from '@/stores/queue';
import { useTicketStore } from '@/stores/ticket';
import { useConversionStore } from '@/stores/conversion';
import { useKPIStore } from '@/stores/kpi';
import { useDataQualityStore } from '@/stores/dataQuality';
import KPICard from '@/components/KPICard.vue';
import FilterBar from '@/components/FilterBar.vue';
import ChartCard from '@/components/ChartCard.vue';
import HeatmapChart from '@/components/charts/HeatmapChart.vue';
import QueuePredictionChart from '@/components/charts/QueuePredictionChart.vue';
import TicketAnalysisChart from '@/components/charts/TicketAnalysisChart.vue';
import ConversionFunnelChart from '@/components/charts/ConversionFunnelChart.vue';
import RawRecordsModal from '@/components/RawRecordsModal.vue';
import ClosedAreaNotice from '@/components/ClosedAreaNotice.vue';
import DataQualityBar from '@/components/DataQualityBar.vue';
import type { QueuePrediction, TicketAnalysis, ConversionFunnel } from '@/types';
import { generateCSV, formatDateTime } from '@/data/cleaner';

const filterStore = useFilterStore();
const heatmapStore = useHeatmapStore();
const queueStore = useQueueStore();
const ticketStore = useTicketStore();
const conversionStore = useConversionStore();
const kpiStore = useKPIStore();
const dataQualityStore = useDataQualityStore();

const showRawModal = ref(false);
const rawModalTitle = ref('');
const rawModalAreaId = ref<string | undefined>();
const rawModalSource = ref<string | undefined>();

const closedAreas = [
  { areaId: 'area4', areaName: '水上乐园', reason: '设备维护', capacityReduced: 3000, startTime: '2024-01-01T08:00:00Z', endTime: '2024-12-31T20:00:00Z' }
];

async function loadAllData() {
  const filters = filterStore.filters;
  await Promise.all([
    heatmapStore.fetchData(filters),
    queueStore.fetchData(filters),
    ticketStore.fetchData(filters),
    conversionStore.fetchData(filters),
    kpiStore.fetchData(filters),
    dataQualityStore.fetchReport(filters)
  ]);
}

function onFilterChange() {
  loadAllData();
}

function onAreaClick(areaId: string) {
  heatmapStore.selectArea(areaId);
  queueStore.setSelectedArea(areaId);
  queueStore.fetchData(filterStore.filters, areaId);
  const area = heatmapStore.data.find(a => a.areaId === areaId);
  rawModalTitle.value = `${area?.areaName || areaId} 客流明细`;
  rawModalAreaId.value = areaId;
  rawModalSource.value = 'gate';
  showRawModal.value = true;
}

function onHeatmapExport() {
  const data = heatmapStore.data.map(d => ({
    区域ID: d.areaId,
    区域名称: d.areaName,
    当前客流: d.visitorCount,
    区域容量: d.capacity,
    拥挤度: (d.density * 100).toFixed(1) + '%',
    平均排队: d.avgQueueTime.toFixed(1) + '分钟',
    状态: d.isClosed ? '临时闭园' : '正常开放'
  }));
  generateCSV(data, '客流热力图');
}

function onQueueExport() {
  const data = queueStore.data.map(d => ({
    时间: formatDateTime(new Date(d.time)),
    实际客流: d.actualCount ?? '-',
    预测客流: d.predictedCount ?? '-',
    置信区间: d.confidenceLower !== null && d.confidenceUpper !== null
      ? `${d.confidenceLower.toFixed(0)}~${d.confidenceUpper.toFixed(0)}`
      : '-',
    平均排队: d.avgWaitTime.toFixed(1) + '分钟',
    是否异常: d.isAnomaly ? '是' : '否',
    类型: d.isHistory ? '历史' : '预测'
  }));
  generateCSV(data, '排队预测');
}

function onTicketExport() {
  const data = ticketStore.data.map(d => ({
    票种: d.ticketType,
    售票数: d.soldCount,
    入园数: d.enteredCount,
    入园率: d.entryRate.toFixed(1) + '%',
    平均票价: '¥' + d.avgPrice.toFixed(2),
    总营收: '¥' + d.totalRevenue.toFixed(2)
  }));
  generateCSV(data, '票种分析');
}

function onConversionExport() {
  const data = conversionStore.data.map(d => ({
    阶段: d.stage,
    人数: d.count,
    转化率: d.rate.toFixed(1) + '%'
  }));
  generateCSV(data, '消费转化');
}

function onQueuePointClick(point: QueuePrediction) {
  rawModalTitle.value = `排队数据明细`;
  rawModalSource.value = 'gate';
  showRawModal.value = true;
}

function onAnomalyClick(point: QueuePrediction) {
  rawModalTitle.value = `异常点明细`;
  rawModalSource.value = 'gate';
  showRawModal.value = true;
}

function onTicketClick(ticket: TicketAnalysis) {
  rawModalTitle.value = `${ticket.ticketType} 明细`;
  rawModalSource.value = 'ticket';
  showRawModal.value = true;
}

function onStageClick(stage: ConversionFunnel) {
  rawModalTitle.value = `${stage.stage} 明细`;
  rawModalSource.value = stage.stage.includes('消费') ? 'consumption' : 'gate';
  showRawModal.value = true;
}

function onRefresh() {
  loadAllData();
}

onMounted(() => {
  loadAllData();
});

watch(() => filterStore.filters, () => {
  loadAllData();
}, { deep: true });
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col">
    <header class="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center">
          <MapPin class="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 class="text-lg font-bold text-slate-800">景区客流与排队预测看板</h1>
          <p class="text-xs text-slate-500">运营数据智能分析平台</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors relative">
          <Bell class="w-5 h-5" />
          <span class="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
        </button>
        <button class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <Settings class="w-5 h-5" />
        </button>
        <div class="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div class="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
            <User class="w-4 h-4 text-teal-700" />
          </div>
          <span class="text-sm font-medium text-slate-700">运营管理员</span>
        </div>
      </div>
    </header>

    <main class="flex-1 p-6 overflow-auto">
      <div class="max-w-[1800px] mx-auto space-y-5">
        <ClosedAreaNotice :notices="closedAreas" />

        <FilterBar @change="onFilterChange" />

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            v-if="kpiStore.data"
            title="实时在园客流"
            :value="kpiStore.data.realtimeVisitor"
            :change="3.2"
            icon="users"
            suffix=" 人"
          />
          <KPICard
            v-if="kpiStore.data"
            title="平均排队时长"
            :value="kpiStore.data.avgWaitTime"
            :change="-2.1"
            icon="clock"
            suffix=" 分钟"
            :decimals="1"
          />
          <KPICard
            v-if="kpiStore.data"
            title="今日售票数"
            :value="kpiStore.data.ticketSales"
            :change="5.8"
            icon="ticket"
            suffix=" 张"
          />
          <KPICard
            v-if="kpiStore.data"
            title="总营收"
            :value="kpiStore.data.totalRevenue"
            :change="4.5"
            icon="dollar"
            suffix=" 元"
          />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 auto-rows-[minmax(380px,auto)]">
          <ChartCard
            title="客流热力分布"
            :sampleSize="heatmapStore.sampleSize"
            :loading="heatmapStore.loading"
            :error="heatmapStore.error"
            :showExport="true"
            large
            @export="onHeatmapExport"
          >
            <HeatmapChart
              :data="heatmapStore.data"
              :selectedAreaId="heatmapStore.selectedAreaId"
              @areaClick="onAreaClick"
            />
          </ChartCard>

          <ChartCard
            title="排队时长预测"
            :sampleSize="queueStore.sampleSize"
            :loading="queueStore.loading"
            :error="queueStore.error"
            :showExport="true"
            @export="onQueueExport"
          >
            <QueuePredictionChart
              :data="queueStore.data"
              @pointClick="onQueuePointClick"
              @anomalyClick="onAnomalyClick"
            />
          </ChartCard>

          <ChartCard
            title="票种销售分析"
            :sampleSize="ticketStore.sampleSize"
            :loading="ticketStore.loading"
            :error="ticketStore.error"
            :showExport="true"
            @export="onTicketExport"
          >
            <TicketAnalysisChart
              :data="ticketStore.data"
              @ticketClick="onTicketClick"
            />
          </ChartCard>

          <ChartCard
            title="消费转化漏斗"
            :sampleSize="conversionStore.sampleSize"
            :loading="conversionStore.loading"
            :error="conversionStore.error"
            :showExport="true"
            @export="onConversionExport"
          >
            <ConversionFunnelChart
              :data="conversionStore.data"
              @stageClick="onStageClick"
            />
          </ChartCard>
        </div>
      </div>
    </main>

    <DataQualityBar
      :report="dataQualityStore.report"
      :loading="dataQualityStore.loading"
      @refresh="onRefresh"
    />

    <RawRecordsModal
      :show="showRawModal"
      :title="rawModalTitle"
      :filters="filterStore.filters"
      :areaId="rawModalAreaId"
      :source="rawModalSource"
      @close="showRawModal = false"
    />
  </div>
</template>
