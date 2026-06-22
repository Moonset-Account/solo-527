<template>
  <div v-if="anomalyStore.current" class="space-y-4">
    <div class="flex items-center gap-3">
      <button class="text-bark/50 hover:text-bark transition-colors" @click="router.back()">
        <ArrowLeft :size="20" />
      </button>
      <h2 class="text-lg font-bold text-bark">{{ anomalyStore.current.description }}</h2>
      <StatusBadge :status="anomalyStore.current.severity" />
      <span
        :class="[
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          statusColorMap[anomalyStore.current.status] || 'bg-gray-100 text-gray-700',
        ]"
      >
        {{ statusLabelMap[anomalyStore.current.status] || anomalyStore.current.status }}
      </span>
    </div>

    <div class="card space-y-4">
      <div class="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div><span class="text-bark/50">类型：</span>{{ typeLabelMap[anomalyStore.current.type] || anomalyStore.current.type }}</div>
        <div><span class="text-bark/50">原料：</span>{{ anomalyStore.current.ingredientName || '-' }}</div>
        <div><span class="text-bark/50">批次号：</span>{{ anomalyStore.current.batchNo }}</div>
        <div>
          <span class="text-bark/50">成本：</span>
          <span>¥{{ anomalyStore.current.expectedCost }}</span>
          <span class="mx-1 text-bark/30">→</span>
          <span :class="costDiff > 0 ? 'text-red-500' : 'text-green-600'">¥{{ anomalyStore.current.actualCost }}</span>
          <span v-if="costDiff !== 0" :class="['ml-1 text-xs', costDiff > 0 ? 'text-red-500' : 'text-green-600']">
            ({{ costDiff > 0 ? '+' : '' }}¥{{ costDiff.toFixed(2) }})
          </span>
        </div>
        <div><span class="text-bark/50">创建时间：</span>{{ formatDateTime(anomalyStore.current.createdAt) }}</div>
      </div>
    </div>

    <div class="card">
      <h3 class="mb-2 font-medium text-bark">影响范围</h3>
      <textarea
        v-model="impactScopeInput"
        rows="3"
        class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm"
        placeholder="请填写影响范围..."
      />
      <div class="mt-2 flex justify-end">
        <button class="btn-primary text-sm" @click="saveImpactScope">保存</button>
      </div>
    </div>

    <div class="card">
      <h3 class="mb-2 font-medium text-bark">负责人</h3>
      <p class="text-sm text-bark/70">{{ anomalyStore.current.responsiblePerson || '未指定' }}</p>
      <div class="mt-2 flex gap-2">
        <input
          v-model="personInput"
          class="flex-1 rounded-btn border border-brand/20 px-3 py-1.5 text-sm"
          placeholder="输入负责人姓名..."
          @keyup.enter="assignPerson"
        />
        <button class="btn-primary text-sm" @click="assignPerson">指派</button>
      </div>
    </div>

    <div class="card">
      <h3 class="mb-2 font-medium text-bark">处理方案</h3>
      <textarea
        v-model="handlingPlanInput"
        rows="4"
        class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm"
        placeholder="请填写处理方案..."
      />
      <div class="mt-2 flex justify-end">
        <button class="btn-primary text-sm" @click="savePlan">保存方案</button>
      </div>
    </div>

    <div class="card">
      <h3 class="mb-3 font-medium text-bark">状态流转</h3>
      <div class="flex gap-2">
        <button
          v-for="t in statusTransitions"
          :key="t.status"
          :class="[
            'rounded-btn px-4 py-2 text-sm font-medium transition-all',
            anomalyStore.current.status === t.status
              ? 'bg-brand text-white'
              : 'border border-brand/20 text-bark/60 hover:bg-brand/10',
          ]"
          :disabled="anomalyStore.current.status === t.status"
          @click="transitionStatus(t.status)"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <div v-if="anomalyStore.current.relatedRecords?.length" class="card">
      <h3 class="mb-2 font-medium text-bark">关联记录</h3>
      <div class="space-y-1">
        <router-link
          v-for="id in anomalyStore.current.relatedRecords"
          :key="id"
          :to="`/batches/${id}`"
          class="block text-sm text-accent hover:underline"
        >
          {{ id }}
        </router-link>
      </div>
    </div>
  </div>
  <EmptyState v-else message="异常不存在" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import StatusBadge from '@/components/common/StatusBadge.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useAnomalyStore } from '@/stores/anomaly'
import { formatDateTime } from '@/lib/utils'

const route = useRoute()
const router = useRouter()
const anomalyStore = useAnomalyStore()

const typeLabelMap: Record<string, string> = {
  cost_spike: '成本飙升',
  low_stock: '低库存',
  high_scrap: '高报损',
  over_cost: '成本超支',
  frequent_rework: '频繁返工',
  budget_exceeded: '超预算',
}

const statusLabelMap: Record<string, string> = {
  open: '打开',
  handling: '处理中',
  resolved: '已解决',
}

const statusColorMap: Record<string, string> = {
  open: 'bg-red-50 text-red-600',
  handling: 'bg-accent/10 text-accent',
  resolved: 'bg-green-50 text-green-700',
}

const statusTransitions = [
  { status: 'open', label: '打开' },
  { status: 'handling', label: '处理中' },
  { status: 'resolved', label: '已解决' },
]

const handlingPlanInput = ref('')
const personInput = ref('')
const impactScopeInput = ref('')

const costDiff = computed(() => {
  if (!anomalyStore.current) return 0
  return (anomalyStore.current.actualCost ?? 0) - (anomalyStore.current.expectedCost ?? 0)
})

const saveImpactScope = async () => {
  const id = route.params.id as string
  await anomalyStore.edit(id, { impactScope: impactScopeInput.value })
}

const assignPerson = async () => {
  if (!personInput.value.trim()) return
  const id = route.params.id as string
  await anomalyStore.assign(id, personInput.value.trim())
  personInput.value = ''
}

const savePlan = async () => {
  const id = route.params.id as string
  await anomalyStore.plan(id, handlingPlanInput.value)
}

const transitionStatus = async (status: string) => {
  const id = route.params.id as string
  await anomalyStore.changeStatus(id, status)
}

onMounted(() => {
  anomalyStore.loadDetail(route.params.id as string).then(() => {
    if (anomalyStore.current) {
      handlingPlanInput.value = anomalyStore.current.handlingPlan || ''
      impactScopeInput.value = anomalyStore.current.impactScope || ''
    }
  })
})
</script>
