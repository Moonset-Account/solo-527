<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useApi } from '@/composables/useApi'

const { get } = useApi()

const entityType = ref('dataset')

interface Snapshot {
  id: number
  entityType: string
  entityId: number
  version: number
  snapshot: Record<string, any>
  changedByName: string
  changedAt: string
  changeDescription: string
}

interface DiffField {
  field: string
  oldValue: any
  newValue: any
  changed: boolean
  changeType: 'added' | 'removed' | 'modified' | 'unchanged'
}

const snapshots = ref<Snapshot[]>([])
const baselineId = ref<number | null>(null)
const comparisonId = ref<number | null>(null)
const differences = ref<DiffField[]>([])
const baselineInfo = ref<any>(null)
const comparisonInfo = ref<any>(null)

const entityOptions = [
  { label: '脱敏范围', value: 'dataset' },
  { label: '指标口径', value: 'caliber' },
  { label: '日报订阅', value: 'subscription' },
]

const entitySnapshots = computed(() => snapshots.value.filter(s => s.entityType === entityType.value))

const baselineOptions = computed(() => entitySnapshots.value.map(s => ({
  label: `v${s.version} - ${s.changeDescription} (${s.changedByName})`,
  value: s.id,
})))

const comparisonOptions = computed(() => entitySnapshots.value.map(s => ({
  label: `v${s.version} - ${s.changeDescription} (${s.changedByName})`,
  value: s.id,
})))

onMounted(() => { fetchSnapshots() })
watch(entityType, () => {
  baselineId.value = null
  comparisonId.value = null
  differences.value = []
})

async function fetchSnapshots() {
  const data = await get<any[]>('/api/history/snapshots')
  if (data) snapshots.value = data
}

async function handleCompare() {
  if (!baselineId.value || !comparisonId.value) return
  const data = await get<any>(`/api/history/compare?baselineId=${baselineId.value}&comparisonId=${comparisonId.value}`)
  if (data) {
    baselineInfo.value = data.baseline
    comparisonInfo.value = data.comparison
    differences.value = data.differences.map((d: any) => {
      const oldExists = d.oldValue !== undefined && d.oldValue !== null
      const newExists = d.newValue !== undefined && d.newValue !== null
      let changeType: DiffField['changeType'] = 'unchanged'
      if (d.changed) {
        if (!oldExists && newExists) changeType = 'added'
        else if (oldExists && !newExists) changeType = 'removed'
        else changeType = 'modified'
      }
      return { ...d, changeType }
    })
  }
}

function changeTypeLabel(t: string) {
  return t === 'added' ? '新增' : t === 'removed' ? '删除' : t === 'modified' ? '修改' : '未变'
}

function changeTypeColor(t: string) {
  return t === 'added' ? '#10B981' : t === 'removed' ? '#F43F5E' : t === 'modified' ? '#F59E0B' : 'var(--color-text-muted)'
}

function formatValue(v: any) {
  if (v === null || v === undefined) return '-'
  if (typeof v === 'object') return JSON.stringify(v, null, 2)
  return String(v)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <span class="text-sm font-medium" style="color: var(--color-text-secondary)">类型筛选:</span>
      <el-radio-group v-model="entityType" @change="fetchSnapshots">
        <el-radio-button v-for="opt in entityOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <div class="grid grid-cols-5 gap-6">
      <div class="col-span-2 p-5 rounded-lg" style="background: var(--color-bg-card); border: 1px solid var(--color-border)">
        <h3 class="text-base font-semibold mb-4" style="color: var(--color-text)">版本快照</h3>
        <el-timeline v-if="entitySnapshots.length">
          <el-timeline-item v-for="s in entitySnapshots" :key="s.id" :timestamp="s.changedAt" placement="top">
            <div class="text-sm font-medium" style="color: var(--color-text)">
              版本 <span class="font-mono">v{{ s.version }}</span> - {{ s.changeDescription }}
            </div>
            <div class="text-xs" style="color: var(--color-text-secondary)">操作人: {{ s.changedByName }}</div>
          </el-timeline-item>
        </el-timeline>
        <div v-else class="text-sm" style="color: var(--color-text-muted)">暂无版本记录</div>
      </div>

      <div class="col-span-3 p-5 rounded-lg" style="background: var(--color-bg-card); border: 1px solid var(--color-border)">
        <h3 class="text-base font-semibold mb-4" style="color: var(--color-text)">版本对比</h3>
        <div class="flex items-center gap-4 mb-4">
          <div class="flex-1">
            <span class="text-sm" style="color: var(--color-text-secondary)">基线版本</span>
            <el-select v-model="baselineId" placeholder="选择基线版本" style="width: 100%" class="mt-1">
              <el-option v-for="opt in baselineOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </div>
          <div class="flex-1">
            <span class="text-sm" style="color: var(--color-text-secondary)">对比版本</span>
            <el-select v-model="comparisonId" placeholder="选择对比版本" style="width: 100%" class="mt-1">
              <el-option v-for="opt in comparisonOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </div>
          <el-button type="primary" @click="handleCompare" :disabled="!baselineId || !comparisonId">对比</el-button>
        </div>

        <div v-if="differences.length" class="space-y-3">
          <div class="grid grid-cols-3 gap-4 text-sm font-medium pb-2" style="border-bottom: 1px solid var(--color-border); color: var(--color-text-secondary)">
            <span>字段</span>
            <span>旧值</span>
            <span>新值</span>
          </div>
          <div
            v-for="diff in differences"
            :key="diff.field"
            class="grid grid-cols-3 gap-4 py-2 px-3 rounded"
            :style="{ background: diff.changed ? (diff.changeType === 'added' ? '#ECFDF5' : diff.changeType === 'removed' ? '#FFF1F2' : '#FFFBEB') : 'transparent' }"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium" style="color: var(--color-text)">{{ diff.field }}</span>
              <el-tag v-if="diff.changed" size="small" :color="changeTypeColor(diff.changeType)" style="color: #fff; border: none">
                {{ changeTypeLabel(diff.changeType) }}
              </el-tag>
            </div>
            <div class="text-sm font-mono" style="color: var(--color-text-secondary)">{{ formatValue(diff.oldValue) }}</div>
            <div class="text-sm font-mono" style="color: var(--color-text-secondary)">{{ formatValue(diff.newValue) }}</div>
          </div>
        </div>

        <div v-if="baselineInfo && comparisonInfo" class="mt-4 pt-4 text-xs space-y-1" style="border-top: 1px solid var(--color-border); color: var(--color-text-muted)">
          <div>基线: v{{ baselineInfo.version }} - {{ baselineInfo.changeDescription }} ({{ baselineInfo.changedAt }})</div>
          <div>对比: v{{ comparisonInfo.version }} - {{ comparisonInfo.changeDescription }} ({{ comparisonInfo.changedAt }})</div>
        </div>

        <div v-if="!differences.length && baselineId && comparisonId" class="text-sm py-8 text-center" style="color: var(--color-text-muted)">
          请点击"对比"按钮查看差异
        </div>
      </div>
    </div>
  </div>
</template>
