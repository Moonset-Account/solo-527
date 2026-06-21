<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, Plus } from 'lucide-vue-next'
import { useFinanceStore } from '@/stores/finance'
import ChartWrapper from '@/components/ChartWrapper.vue'

const store = useFinanceStore()

function percent(spent: number, budget: number) {
  return Math.min(Math.round((spent / budget) * 100), 100)
}

function isOverspent(spent: number, budget: number) {
  return spent / budget > 0.85
}

const trendOption = computed(() => ({
  tooltip: { trigger: 'axis', backgroundColor: '#1E293B', borderColor: '#334E68', textStyle: { color: '#F0F4F8' } },
  grid: { left: 60, right: 20, top: 20, bottom: 30 },
  xAxis: { type: 'category', data: store.expenseTrend.map(d => d.month), axisLabel: { color: '#9FB3C8' }, axisLine: { lineStyle: { color: '#334E68' } } },
  yAxis: { type: 'value', axisLabel: { color: '#9FB3C8', formatter: '¥{0}' }, splitLine: { lineStyle: { color: 'rgba(51,78,104,0.3)' } } },
  series: [{ type: 'line', smooth: true, data: store.expenseTrend.map(d => d.amount), areaStyle: { color: 'rgba(13,148,136,0.15)' }, lineStyle: { color: '#0D9488' }, itemStyle: { color: '#0D9488' } }]
}))

const categoryOption = computed(() => ({
  tooltip: { trigger: 'item', backgroundColor: '#1E293B', borderColor: '#334E68', textStyle: { color: '#F0F4F8' } },
  legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { color: '#9FB3C8' } },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    center: ['40%', '50%'],
    itemStyle: { borderRadius: 6, borderColor: '#1E293B', borderWidth: 2 },
    label: { show: false },
    data: store.categorySpending.map((item, i) => ({
      ...item,
      itemStyle: { color: ['#0D9488', '#2DD4BF', '#334E68', '#486581', '#627D98', '#829AB1'][i] }
    }))
  }]
}))

function formatMoney(v: number) {
  return v.toLocaleString('zh-CN')
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">经费管理</h2>
      <button class="btn btn-primary" @click="store.showAllocationModal = true"><Plus :size="14" /> 预算拨付</button>
    </div>

    <div class="balance-grid">
      <div v-for="p in store.projectBalances" :key="p.id" class="card balance-card">
        <div class="balance-header">
          <span class="balance-name">{{ p.name }}</span>
          <AlertTriangle v-if="isOverspent(p.spent, p.budget)" :size="18" class="text-danger-400" />
        </div>
        <div class="balance-values">
          <span class="font-data" :class="isOverspent(p.spent, p.budget) ? 'text-danger-400' : 'text-accent-400'">¥{{ formatMoney(p.spent) }}</span>
          <span class="balance-divider">/</span>
          <span class="balance-budget font-data">¥{{ formatMoney(p.budget) }}</span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :class="isOverspent(p.spent, p.budget) ? 'overspent' : 'normal'"
            :style="{ width: percent(p.spent, p.budget) + '%' }"
          />
        </div>
        <div class="balance-percent font-data">{{ percent(p.spent, p.budget) }}%</div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="card">
        <h3 class="card-title">月度经费趋势</h3>
        <ChartWrapper :option="trendOption" height="280px" />
      </div>
      <div class="card">
        <h3 class="card-title">分类经费占比</h3>
        <ChartWrapper :option="categoryOption" height="280px" />
      </div>
    </div>

    <Teleport to="body">
      <div v-if="store.showAllocationModal" class="modal-overlay" @click.self="store.showAllocationModal = false">
        <div class="modal">
          <h3 class="modal-title">预算拨付</h3>
          <div class="form-group">
            <label class="form-label">选择课题</label>
            <select class="input" v-model="store.allocationForm.projectId">
              <option :value="null" disabled>请选择课题</option>
              <option v-for="p in store.projectBalances" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">拨付金额</label>
            <input type="number" class="input" v-model.number="store.allocationForm.amount" placeholder="输入金额" />
          </div>
          <div class="form-group">
            <label class="form-label">拨付说明</label>
            <textarea class="input" v-model="store.allocationForm.reason" placeholder="输入拨付说明..."></textarea>
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="store.showAllocationModal = false">取消</button>
            <button class="btn btn-primary" @click="store.showAllocationModal = false">确认拨付</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.page-container { padding: 24px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.page-title { font-size: 22px; font-weight: 600; color: var(--color-text-primary); }
.balance-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px; }
.balance-card { position: relative; }
.balance-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.balance-name { font-size: 14px; font-weight: 500; color: var(--color-text-primary); }
.balance-values { display: flex; align-items: baseline; gap: 6px; margin-bottom: 10px; font-size: 20px; font-weight: 700; }
.balance-divider { color: var(--color-text-muted); }
.balance-budget { font-size: 14px; font-weight: 400; color: var(--color-text-muted); }
.progress-bar { height: 6px; background: var(--color-bg); border-radius: 3px; overflow: hidden; margin-bottom: 6px; }
.progress-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
.progress-fill.normal { background: var(--color-accent); }
.progress-fill.overspent { background: var(--color-danger); }
.balance-percent { font-size: 12px; color: var(--color-text-muted); }
.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.card-title { font-size: 15px; font-weight: 500; color: var(--color-text-secondary); margin-bottom: 16px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 50; }
.modal { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 12px; padding: 24px; width: 440px; max-width: 90vw; }
.modal-title { font-size: 18px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 20px; }
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 13px; color: var(--color-text-muted); margin-bottom: 6px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
@media (max-width: 1024px) { .balance-grid { grid-template-columns: 1fr; } .charts-grid { grid-template-columns: 1fr; } }
</style>
