<script setup lang="ts">
import { computed } from 'vue'
import { Check, AlertTriangle, Wrench, X } from 'lucide-vue-next'
import { useEquipmentStore } from '@/stores/equipment'
import ChartWrapper from '@/components/ChartWrapper.vue'

const store = useEquipmentStore()

const statusColor: Record<string, string> = {
  '运行中': 'bg-accent-500',
  '空闲': 'bg-primary-500',
  '待维修': 'bg-danger-500',
}

function gaugeOption(utilization: number) {
  return {
    series: [{
      type: 'gauge',
      startAngle: 200,
      endAngle: -20,
      radius: '90%',
      center: ['50%', '55%'],
      min: 0,
      max: 100,
      splitNumber: 5,
      axisLine: { lineStyle: { width: 12, color: [[0.6, '#334E68'], [0.85, '#0D9488'], [1, '#2DD4BF']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      pointer: { show: true, length: '60%', width: 4, itemStyle: { color: '#F0F4F8' } },
      detail: { valueAnimation: true, formatter: '{value}%', fontSize: 16, fontFamily: 'JetBrains Mono', color: '#F0F4F8', offsetCenter: [0, '30%'] },
      data: [{ value: utilization }],
    }]
  }
}

const usageOption = computed(() => ({
  tooltip: { trigger: 'axis', backgroundColor: '#1E293B', borderColor: '#334E68', textStyle: { color: '#F0F4F8' } },
  grid: { left: 50, right: 20, top: 20, bottom: 30 },
  xAxis: { type: 'category', data: store.monthlyUsage.map(d => d.month), axisLabel: { color: '#9FB3C8' }, axisLine: { lineStyle: { color: '#334E68' } } },
  yAxis: { type: 'value', axisLabel: { color: '#9FB3C8', formatter: '{0}h' }, splitLine: { lineStyle: { color: 'rgba(51,78,104,0.3)' } } },
  series: [{ type: 'bar', data: store.monthlyUsage.map(d => d.hours), barWidth: 28, itemStyle: { color: '#0D9488', borderRadius: [4, 4, 0, 0] } }]
}))

const confirmAlert = computed(() => {
  if (!store.confirmAlertId) return null
  return store.alerts.find(a => a.id === store.confirmAlertId) || null
})
</script>

<template>
  <div class="page-container">
    <h2 class="page-title">设备看板</h2>

    <div class="gauge-grid">
      <div v-for="eq in store.equipmentList" :key="eq.id" class="card gauge-card">
        <div class="gauge-header">
          <span class="eq-name">{{ eq.name }}</span>
          <span class="status-dot" :class="statusColor[eq.status]" />
        </div>
        <ChartWrapper :option="gaugeOption(eq.utilization)" height="160px" />
        <div class="eq-info">
          <span class="eq-status" :class="eq.status === '运行中' ? 'text-accent-400' : eq.status === '待维修' ? 'text-danger-400' : 'text-primary-400'">{{ eq.status }}</span>
          <span class="eq-location">{{ eq.location }}</span>
        </div>
      </div>
    </div>

    <div class="bottom-grid">
      <div class="card">
        <h3 class="card-title">设备告警</h3>
        <div class="alert-list">
          <div v-for="alert in store.alerts" :key="alert.id" class="alert-item" :class="{ confirmed: alert.confirmed }">
            <div class="alert-icon-wrap">
              <AlertTriangle v-if="alert.severity === 'danger'" :size="16" class="text-danger-400" />
              <Wrench v-else :size="16" class="text-warn-400" />
            </div>
            <div class="alert-content">
              <p class="alert-message">{{ alert.message }}</p>
              <span class="alert-time">{{ alert.time }}</span>
            </div>
            <button v-if="!alert.confirmed" class="btn btn-secondary btn-sm" @click="store.openConfirmModal(alert.id)">
              <Check :size="12" /> 确认
            </button>
            <span v-else class="confirmed-tag">已确认</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">月度使用时长</h3>
        <ChartWrapper :option="usageOption" height="260px" />
      </div>
    </div>

    <Teleport to="body">
      <div v-if="store.showConfirmModal && confirmAlert" class="modal-overlay" @click.self="store.showConfirmModal = false">
        <div class="modal">
          <div class="modal-header">
            <AlertTriangle :size="20" class="text-warn-400" />
            <h3 class="modal-title">确认告警</h3>
          </div>
          <p class="modal-desc">{{ confirmAlert.message }}</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="store.showConfirmModal = false">取消</button>
            <button class="btn btn-primary" @click="store.confirmAlert(confirmAlert!.id)">确认</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.page-container { padding: 24px; }
.page-title { font-size: 22px; font-weight: 600; margin-bottom: 20px; color: var(--color-text-primary); }
.gauge-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
.gauge-card { padding: 16px; }
.gauge-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.eq-name { font-size: 14px; font-weight: 500; color: var(--color-text-primary); }
.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.eq-info { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
.eq-status { font-size: 13px; font-weight: 500; }
.eq-location { font-size: 12px; color: var(--color-text-muted); }
.bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.card-title { font-size: 15px; font-weight: 500; color: var(--color-text-secondary); margin-bottom: 16px; }
.alert-list { display: flex; flex-direction: column; gap: 10px; }
.alert-item { display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid var(--color-border); border-radius: 6px; }
.alert-item.confirmed { opacity: 0.5; }
.alert-icon-wrap { width: 28px; height: 28px; border-radius: 6px; background: rgba(51,78,104,0.3); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.alert-content { flex: 1; }
.alert-message { font-size: 13px; color: var(--color-text-primary); margin-bottom: 2px; }
.alert-time { font-size: 11px; color: var(--color-text-muted); }
.btn-sm { padding: 4px 10px; font-size: 12px; }
.confirmed-tag { font-size: 12px; color: var(--color-accent); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 50; }
.modal { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 12px; padding: 24px; width: 400px; max-width: 90vw; }
.modal-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.modal-title { font-size: 16px; font-weight: 600; color: var(--color-text-primary); }
.modal-desc { font-size: 14px; color: var(--color-text-secondary); margin-bottom: 20px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
@media (max-width: 1024px) { .gauge-grid { grid-template-columns: repeat(2, 1fr); } .bottom-grid { grid-template-columns: 1fr; } }
</style>
