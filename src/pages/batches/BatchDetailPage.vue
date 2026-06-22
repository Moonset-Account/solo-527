<template>
  <div v-if="batchStore.current" class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button class="text-bark/50 hover:text-bark transition-colors" @click="router.back()">
          <ArrowLeft :size="20" />
        </button>
        <h2 class="text-lg font-bold text-bark">{{ batchStore.current.batchNo }}</h2>
        <StatusBadge :status="batchStore.current.status" />
      </div>
    </div>

    <div class="card">
      <div class="mb-3 flex gap-4 border-b border-brand/10 overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="[
            'whitespace-nowrap pb-2 text-sm font-medium transition-colors',
            activeTab === tab.key ? 'border-b-2 border-accent text-accent' : 'text-bark/50 hover:text-bark',
          ]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <div v-if="activeTab === 'info'" class="space-y-4 text-sm">
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <span class="text-bark/50">配方</span>
            <div class="mt-1 font-medium text-bark">{{ batchStore.current.recipeName }}</div>
          </div>
          <div>
            <span class="text-bark/50">计划/实际数量</span>
            <div class="mt-1 font-medium text-bark">{{ batchStore.current.plannedQty }} / {{ batchStore.current.actualQty }} {{ batchStore.current.unit }}</div>
          </div>
          <div>
            <span class="text-bark/50">班组</span>
            <div class="mt-1 font-medium text-bark">{{ batchStore.current.teamName }}</div>
          </div>
          <div>
            <span class="text-bark/50">标准成本</span>
            <div class="mt-1 font-medium text-bark">{{ formatCurrency(batchStore.current.standardCost) }}</div>
          </div>
          <div>
            <span class="text-bark/50">实际成本</span>
            <div class="mt-1 font-medium text-bark">{{ formatCurrency(batchStore.current.actualCost) }}</div>
          </div>
          <div>
            <span class="text-bark/50">成本偏差</span>
            <div class="mt-1 font-medium" :class="batchStore.current.costVariance > 0 ? 'text-red-600' : batchStore.current.costVariance < 0 ? 'text-green-600' : 'text-bark'">
              {{ batchStore.current.costVariance > 0 ? '+' : '' }}{{ formatCurrency(batchStore.current.costVariance) }}
            </div>
          </div>
          <div>
            <span class="text-bark/50">返工成本</span>
            <div class="mt-1 font-medium text-bark">{{ formatCurrency(batchStore.current.reworkCost) }}</div>
          </div>
          <div>
            <span class="text-bark/50">耗材成本</span>
            <div class="mt-1 font-medium text-bark">{{ formatCurrency(batchStore.current.consumableCost) }}</div>
          </div>
          <div>
            <span class="text-bark/50">报废数量</span>
            <div class="mt-1 font-medium text-bark">{{ batchStore.current.scrapQty }} {{ batchStore.current.unit }}</div>
          </div>
          <div>
            <span class="text-bark/50">返工数量</span>
            <div class="mt-1 font-medium text-bark">{{ batchStore.current.reworkQty }} {{ batchStore.current.unit }}</div>
          </div>
          <div>
            <span class="text-bark/50">开始时间</span>
            <div class="mt-1 font-medium text-bark">{{ batchStore.current.startTime ? formatDateTime(batchStore.current.startTime) : '-' }}</div>
          </div>
          <div>
            <span class="text-bark/50">结束时间</span>
            <div class="mt-1 font-medium text-bark">{{ batchStore.current.endTime ? formatDateTime(batchStore.current.endTime) : '-' }}</div>
          </div>
          <div>
            <span class="text-bark/50">状态</span>
            <div class="mt-1"><StatusBadge :status="batchStore.current.status" /></div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'waste'" class="space-y-4 text-sm">
        <div class="rounded-btn bg-cream/60 p-3">
          <span class="text-bark/50">当前报废数量：</span>
          <span class="font-medium text-bark">{{ batchStore.current.scrapQty }} {{ batchStore.current.unit }}</span>
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            v-model.number="scrapForm.quantity"
            type="number"
            min="1"
            placeholder="报废数量"
            class="rounded-btn border border-brand/20 px-3 py-2 text-sm"
          />
          <input
            v-model="scrapForm.reason"
            type="text"
            placeholder="报废原因"
            class="rounded-btn border border-brand/20 px-3 py-2 text-sm"
          />
        </div>
        <button
          class="btn-primary text-sm"
          :disabled="scrapSubmitting || !scrapForm.quantity || !scrapForm.reason"
          @click="handleScrap"
        >
          {{ scrapSubmitting ? '提交中...' : '提交报损' }}
        </button>
      </div>

      <div v-if="activeTab === 'rework'" class="space-y-4 text-sm">
        <div class="rounded-btn bg-cream/60 p-3">
          <span class="text-bark/50">当前返工数量：</span>
          <span class="font-medium text-bark">{{ batchStore.current.reworkQty }} {{ batchStore.current.unit }}</span>
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            v-model.number="reworkForm.reworkQty"
            type="number"
            min="1"
            placeholder="返工数量"
            class="rounded-btn border border-brand/20 px-3 py-2 text-sm"
          />
          <input
            v-model.number="reworkForm.reworkCost"
            type="number"
            min="0"
            step="0.01"
            placeholder="返工成本"
            class="rounded-btn border border-brand/20 px-3 py-2 text-sm"
          />
          <input
            v-model="reworkForm.reason"
            type="text"
            placeholder="返工原因"
            class="rounded-btn border border-brand/20 px-3 py-2 text-sm"
          />
        </div>
        <button
          class="btn-primary text-sm"
          :disabled="reworkSubmitting || !reworkForm.reworkQty || !reworkForm.reworkCost"
          @click="handleRework"
        >
          {{ reworkSubmitting ? '提交中...' : '提交返工' }}
        </button>
      </div>

      <div v-if="activeTab === 'pickup'" class="space-y-4 text-sm">
        <template v-if="batchStore.current.status === 'completed'">
          <div class="rounded-btn bg-cream/60 p-3">
            <span class="text-bark/50">该批次已完成生产，可确认取货。</span>
          </div>
          <button
            class="btn-primary text-sm"
            :disabled="pickupSubmitting"
            @click="handlePickUp"
          >
            {{ pickupSubmitting ? '确认中...' : '确认取货' }}
          </button>
        </template>
        <div v-else class="text-bark/60">
          <template v-if="batchStore.current.status === 'picked_up'">该批次已确认取货</template>
          <template v-else>仅已完成状态的批次可以确认取货</template>
        </div>
      </div>

      <div v-if="activeTab === 'attachments'" class="space-y-3">
        <div v-if="!batchStore.current.attachments?.length" class="text-sm text-bark/60">暂无附件</div>
        <div
          v-for="a in batchStore.current.attachments"
          :key="a.name + a.uploadedAt"
          class="flex items-center gap-2 rounded-btn bg-cream/60 p-3 text-sm"
        >
          <Paperclip :size="14" class="shrink-0 text-bark/50" />
          <a :href="a.url" target="_blank" class="text-accent hover:underline truncate">{{ a.name }}</a>
          <span class="ml-auto shrink-0 text-xs text-bark/40">{{ formatDate(a.uploadedAt) }}</span>
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            v-model="attachForm.name"
            type="text"
            placeholder="附件名称"
            class="rounded-btn border border-brand/20 px-3 py-2 text-sm"
          />
          <input
            v-model="attachForm.url"
            type="text"
            placeholder="附件链接"
            class="rounded-btn border border-brand/20 px-3 py-2 text-sm"
          />
        </div>
        <button
          class="btn-secondary text-xs"
          :disabled="attachSubmitting || !attachForm.name || !attachForm.url"
          @click="handleAddAttachment"
        >
          {{ attachSubmitting ? '添加中...' : '添加附件' }}
        </button>
      </div>

      <div v-if="activeTab === 'notes'" class="space-y-3">
        <div v-if="!batchStore.current.notes?.length" class="text-sm text-bark/60">暂无备注</div>
        <div
          v-for="note in batchStore.current.notes"
          :key="note.createdAt + note.author"
          class="rounded-btn bg-cream/60 p-3 text-sm"
        >
          <div class="text-bark">{{ note.content }}</div>
          <div class="mt-1 text-xs text-bark/50">{{ note.author }} · {{ formatDateTime(note.createdAt) }}</div>
        </div>
        <div class="flex gap-2">
          <input
            v-model="newNote"
            type="text"
            placeholder="添加备注..."
            class="flex-1 rounded-btn border border-brand/20 px-3 py-2 text-sm"
            @keyup.enter="handleAddNote"
          />
          <button
            class="btn-primary text-sm"
            :disabled="noteSubmitting || !newNote.trim()"
            @click="handleAddNote"
          >
            {{ noteSubmitting ? '添加中...' : '添加' }}
          </button>
        </div>
      </div>

      <div v-if="activeTab === 'history'">
        <Timeline :items="historyItems" />
        <div v-if="!historyItems.length" class="text-sm text-bark/60">暂无修改历史</div>
      </div>
    </div>
  </div>
  <EmptyState v-else message="批次不存在" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Paperclip } from 'lucide-vue-next'
import StatusBadge from '@/components/common/StatusBadge.vue'
import Timeline from '@/components/common/Timeline.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useBatchStore } from '@/stores/batch'
import { addBatchNote, scrapBatch, reworkBatch, pickUpBatch, addBatchAttachment } from '@/api/batch'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils'

const route = useRoute()
const router = useRouter()
const batchStore = useBatchStore()

const id = route.params.id as string
const activeTab = ref('info')
const newNote = ref('')
const noteSubmitting = ref(false)
const scrapSubmitting = ref(false)
const reworkSubmitting = ref(false)
const pickupSubmitting = ref(false)
const attachSubmitting = ref(false)

const scrapForm = ref({ quantity: undefined as number | undefined, reason: '' })
const reworkForm = ref({ reworkQty: undefined as number | undefined, reworkCost: undefined as number | undefined, reason: '' })
const attachForm = ref({ name: '', url: '' })

const tabs = [
  { key: 'info', label: '基本信息' },
  { key: 'waste', label: '报损记录' },
  { key: 'rework', label: '返工记录' },
  { key: 'pickup', label: '取货确认' },
  { key: 'attachments', label: '附件' },
  { key: 'notes', label: '备注' },
  { key: 'history', label: '修改历史' },
]

const historyItems = computed(() =>
  (batchStore.current?.history || []).map(h => ({
    action: `${h.field}: ${h.oldValue} → ${h.newValue}`,
    operator: h.changedBy,
    timestamp: h.changedAt,
  }))
)

const reload = () => batchStore.loadDetail(id)

const handleScrap = async () => {
  if (!scrapForm.value.quantity || !scrapForm.value.reason) return
  scrapSubmitting.value = true
  try {
    await scrapBatch(id, { quantity: scrapForm.value.quantity, reason: scrapForm.value.reason })
    scrapForm.value = { quantity: undefined, reason: '' }
    await reload()
  } finally {
    scrapSubmitting.value = false
  }
}

const handleRework = async () => {
  if (!reworkForm.value.reworkQty || reworkForm.value.reworkCost === undefined) return
  reworkSubmitting.value = true
  try {
    await reworkBatch(id, { reworkQty: reworkForm.value.reworkQty, reworkCost: reworkForm.value.reworkCost, reason: reworkForm.value.reason })
    reworkForm.value = { reworkQty: undefined, reworkCost: undefined, reason: '' }
    await reload()
  } finally {
    reworkSubmitting.value = false
  }
}

const handlePickUp = async () => {
  pickupSubmitting.value = true
  try {
    await pickUpBatch(id)
    await reload()
  } finally {
    pickupSubmitting.value = false
  }
}

const handleAddAttachment = async () => {
  if (!attachForm.value.name || !attachForm.value.url) return
  attachSubmitting.value = true
  try {
    await addBatchAttachment(id, { name: attachForm.value.name, url: attachForm.value.url })
    attachForm.value = { name: '', url: '' }
    await reload()
  } finally {
    attachSubmitting.value = false
  }
}

const handleAddNote = async () => {
  if (!newNote.value.trim()) return
  noteSubmitting.value = true
  try {
    await addBatchNote(id, { content: newNote.value.trim() })
    newNote.value = ''
    await reload()
  } finally {
    noteSubmitting.value = false
  }
}

onMounted(() => {
  batchStore.loadDetail(id)
})
</script>
