<template>
  <div>
    <n-space justify="space-between" align="center" style="margin-bottom: 16px">
      <n-space>
        <n-input v-model:value="searchKeyword" placeholder="搜索合同/客户" clearable style="width: 200px" />
        <n-select v-model:value="levelFilter" placeholder="评价等级" clearable :options="levelOptions" style="width: 140px" />
        <n-button type="primary" @click="loadData">搜索</n-button>
        <n-button @click="handleReset">重置</n-button>
      </n-space>
    </n-space>

    <n-grid :cols="4" :x-gap="16" :y-gap="16">
      <n-gi>
        <n-card size="small" :title="`待评价 (${store.pending.length})`" :style="{ background: '#fff7e6', borderColor: '#ffd591' }">
          <div class="kanban-column">
            <n-card v-for="record in filteredPending" :key="record.id" size="small" hoverable class="kanban-card" @click="handleCardClick(record)">
              <template #header>
                <div style="display: flex; justify-content: space-between; align-items: center">
                  <n-text strong>{{ record.contract_name }}</n-text>
                  <n-tag size="small" type="warning">待评价</n-tag>
                </div>
              </template>
              <div class="card-content">
                <n-space vertical :size="4">
                  <div>客户：{{ record.customer_name }}</div>
                  <div>评价时间：{{ record.created_at?.slice(0, 10) || '-' }}</div>
                </n-space>
              </div>
              <template #footer>
                <n-space justify="end">
                  <n-button size="tiny" type="warning" @click.stop="handleRemind(record)">催提醒</n-button>
                </n-space>
              </template>
            </n-card>
            <n-empty v-if="filteredPending.length === 0" description="暂无数据" />
          </div>
        </n-card>
      </n-gi>

      <n-gi>
        <n-card size="small" :title="`满意 (${store.satisfied.length})`" :style="{ background: '#f6ffed', borderColor: '#b7eb8f' }">
          <div class="kanban-column">
            <n-card v-for="record in filteredSatisfied" :key="record.id" size="small" hoverable class="kanban-card" @click="handleCardClick(record)">
              <template #header>
                <div style="display: flex; justify-content: space-between; align-items: center">
                  <n-text strong>{{ record.contract_name }}</n-text>
                  <n-tag size="small" type="success">满意</n-tag>
                </div>
              </template>
              <div class="card-content">
                <n-space vertical :size="4">
                  <div>客户：{{ record.customer_name }}</div>
                  <div>评价时间：{{ record.created_at?.slice(0, 10) || '-' }}</div>
                </n-space>
              </div>
            </n-card>
            <n-empty v-if="filteredSatisfied.length === 0" description="暂无数据" />
          </div>
        </n-card>
      </n-gi>

      <n-gi>
        <n-card size="small" :title="`一般 (${store.neutral.length})`" :style="{ background: '#e6f7ff', borderColor: '#91d5ff' }">
          <div class="kanban-column">
            <n-card v-for="record in filteredNeutral" :key="record.id" size="small" hoverable class="kanban-card" @click="handleCardClick(record)">
              <template #header>
                <div style="display: flex; justify-content: space-between; align-items: center">
                  <n-text strong>{{ record.contract_name }}</n-text>
                  <n-tag size="small" type="info">一般</n-tag>
                </div>
              </template>
              <div class="card-content">
                <n-space vertical :size="4">
                  <div>客户：{{ record.customer_name }}</div>
                  <div>评价时间：{{ record.created_at?.slice(0, 10) || '-' }}</div>
                </n-space>
              </div>
            </n-card>
            <n-empty v-if="filteredNeutral.length === 0" description="暂无数据" />
          </div>
        </n-card>
      </n-gi>

      <n-gi>
        <n-card size="small" :title="`不满意 (${store.dissatisfied.length})`" :style="{ background: '#fff1f0', borderColor: '#ffa39e' }">
          <div class="kanban-column">
            <n-card v-for="record in filteredDissatisfied" :key="record.id" size="small" hoverable class="kanban-card" @click="handleCardClick(record)">
              <template #header>
                <div style="display: flex; justify-content: space-between; align-items: center">
                  <n-text strong>{{ record.contract_name }}</n-text>
                  <n-tag size="small" type="error">不满意</n-tag>
                </div>
              </template>
              <div class="card-content">
                <n-space vertical :size="4">
                  <div>客户：{{ record.customer_name }}</div>
                  <div>评价时间：{{ record.created_at?.slice(0, 10) || '-' }}</div>
                </n-space>
              </div>
            </n-card>
            <n-empty v-if="filteredDissatisfied.length === 0" description="暂无数据" />
          </div>
        </n-card>
      </n-gi>
    </n-grid>

    <n-modal v-model:show="showMoveModal" preset="dialog" title="调整评价等级" positive-text="确认" negative-text="取消" @positive-click="handleMoveConfirm">
      <n-space vertical style="width: 100%">
        <div>
          <n-text>合同：</n-text>
          <n-text strong>{{ currentRecord?.contract_name }}</n-text>
        </div>
        <div>
          <n-text>客户：</n-text>
          <n-text strong>{{ currentRecord?.customer_name }}</n-text>
        </div>
        <n-form-item label="调整为">
          <n-select v-model:value="targetLevel" :options="moveOptions" style="width: 100%" />
        </n-form-item>
      </n-space>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { useSatisfactionStore } from '~/stores/satisfaction'
import type { SatisfactionRecord } from '~/types'

definePageMeta({
  layout: 'default',
})

const message = useMessage()
const dialog = useDialog()
const store = useSatisfactionStore()
const searchKeyword = ref('')
const levelFilter = ref('')
const showMoveModal = ref(false)
const currentRecord = ref<SatisfactionRecord | null>(null)
const targetLevel = ref('')

const levelOptions = [
  { label: '待评价', value: 'pending' },
  { label: '满意', value: 'satisfied' },
  { label: '一般', value: 'neutral' },
  { label: '不满意', value: 'dissatisfied' },
]

const moveOptions = [
  { label: '待评价', value: 'pending' },
  { label: '满意', value: 'satisfied' },
  { label: '一般', value: 'neutral' },
  { label: '不满意', value: 'dissatisfied' },
]

function filterRecords(records: SatisfactionRecord[]) {
  return records.filter(r => {
    const matchKeyword = !searchKeyword.value || 
      r.contract_name?.includes(searchKeyword.value) || 
      r.customer_name?.includes(searchKeyword.value)
    return matchKeyword
  })
}

const filteredPending = computed(() => filterRecords(store.pending))
const filteredSatisfied = computed(() => filterRecords(store.satisfied))
const filteredNeutral = computed(() => filterRecords(store.neutral))
const filteredDissatisfied = computed(() => filterRecords(store.dissatisfied))

async function loadData() {
  const params: any = { page: 1, page_size: 100 }
  if (levelFilter.value) {
    params.level = levelFilter.value
  }
  await store.fetchList(params)
}

function handleReset() {
  searchKeyword.value = ''
  levelFilter.value = ''
  loadData()
}

function handleCardClick(record: SatisfactionRecord) {
  currentRecord.value = record
  targetLevel.value = record.level
  showMoveModal.value = true
}

async function handleMoveConfirm() {
  if (!currentRecord.value || !targetLevel.value) return
  try {
    await store.updateLevel(currentRecord.value.id, targetLevel.value)
    message.success('评价等级已更新')
    showMoveModal.value = false
    loadData()
  } catch (e: any) {
    message.error(e?.data?.detail || '更新失败')
  }
}

function handleRemind(record: SatisfactionRecord) {
  dialog.warning({
    title: '确认催提醒',
    content: `确定要向客户 ${record.customer_name} 发送满意度评价提醒吗？`,
    positiveText: '确认发送',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await store.remind(record.id)
        message.success('提醒已发送')
      } catch (e: any) {
        message.error(e?.data?.detail || '发送失败')
      }
    },
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.kanban-column {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kanban-card {
  cursor: pointer;
  transition: all 0.2s;
}

.kanban-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-content {
  padding: 8px 0;
  font-size: 13px;
  color: #595959;
}
</style>
