<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { zoneApi } from '@/api'
import type { Zone, Meter, EnergyCurvePoint } from '@/types'

use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const route = useRoute()
const router = useRouter()

const zoneId = computed(() => Number(route.params.id))

const loading = ref(false)
const zone = ref<Zone | null>(null)
const meters = ref<Meter[]>([])
const curveData = ref<EnergyCurvePoint[]>([])

const statusTagType: Record<string, string> = {
  online: 'success',
  offline: 'info',
  fault: 'danger',
}

const statusLabel: Record<string, string> = {
  online: '在线',
  offline: '离线',
  fault: '故障',
}

function formatTime(time: string) {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const chartOption = computed(() => {
  const times = curveData.value.map((p) => p.time)
  const values = curveData.value.map((p) => p.value)
  const markAreas = curveData.value
    .reduce<Array<[number, number]>>((acc, p, i) => {
      if (p.isPeak) {
        const start = i
        let end = i
        while (end < curveData.value.length && curveData.value[end].isPeak) end++
        acc.push([start, end - 1])
      }
      return acc
    }, [])
    .filter((area, i, arr) => {
      return arr.findIndex((a) => a[0] === area[0]) === i
    })

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0]
        return `${p.axisValue}<br/>能耗: ${p.value} kWh`
      },
    },
    grid: { left: 60, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: times, boundaryGap: false },
    yAxis: { type: 'value', name: 'kWh' },
    series: [
      {
        type: 'line',
        data: values,
        smooth: true,
        areaStyle: { opacity: 0.15 },
        lineStyle: { color: '#0F4C5C', width: 2 },
        itemStyle: { color: '#0F4C5C' },
        markArea: {
          silent: true,
          itemStyle: { color: 'rgba(227, 100, 20, 0.08)' },
          data: markAreas.map(([start, end]) => [
            { xAxis: times[start] },
            { xAxis: times[end] },
          ]),
        },
      },
    ],
  }
})

async function fetchData() {
  loading.value = true
  try {
    const [zoneData, metersData, energyData] = await Promise.all([
      zoneApi.getById(zoneId.value),
      zoneApi.getMeters(zoneId.value),
      zoneApi.getEnergy(zoneId.value),
    ])
    zone.value = zoneData
    meters.value = metersData
    curveData.value = energyData.curve
  } catch {
    ElMessage.error('获取分区详情失败')
  } finally {
    loading.value = false
  }
}

function handleBack() {
  router.push('/zones')
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div v-loading="loading">
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 12px">
        <el-button @click="handleBack" :icon="'ArrowLeft'" circle />
        <h2>{{ zone?.name || '分区详情' }}</h2>
      </div>
    </div>

    <template v-if="zone">
      <el-card style="margin-bottom: 20px">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="分区名称">{{ zone.name }}</el-descriptions-item>
          <el-descriptions-item label="来源单据">{{ zone.sourceDocumentNo }}</el-descriptions-item>
          <el-descriptions-item label="补充说明">{{ zone.remark || '-' }}</el-descriptions-item>
          <el-descriptions-item label="表计数量">{{ zone.meterCount }}</el-descriptions-item>
          <el-descriptions-item label="总能耗">{{ zone.totalUsage.toLocaleString() }} kWh</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <div class="section-title">分区表计</div>
      <el-card style="margin-bottom: 20px">
        <el-table :data="meters" stripe style="width: 100%">
          <el-table-column prop="meterNo" label="电表编号" min-width="150" />
          <el-table-column prop="location" label="安装位置" min-width="180" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusTagType[row.status]" size="small" :class="`tag-${row.status}`">
                {{ statusLabel[row.status] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="最后同步时间" min-width="180">
            <template #default="{ row }">
              {{ formatTime(row.lastSyncTime) }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <div class="section-title">能耗曲线</div>
      <el-card>
        <v-chart :option="chartOption" style="height: 360px; width: 100%" autoresize />
      </el-card>
    </template>
  </div>
</template>
