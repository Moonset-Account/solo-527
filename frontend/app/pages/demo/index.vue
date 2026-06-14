<template>
  <div>
    <n-grid :cols="2" :x-gap="24" :y-gap="24">
      <n-gi>
        <n-card hoverable class="demo-card seed-card" @click="handleSeed">
          <div class="card-content">
            <div class="card-icon">
              <n-icon :size="48" color="#36B37E"><AddCircleOutline /></n-icon>
            </div>
            <n-text strong style="font-size: 20px">生成演示数据</n-text>
            <n-text depth="3" style="text-align: center; margin-top: 8px">
              一键生成合同、客户、巡检任务等演示数据，方便您快速体验系统功能
            </n-text>
            <n-button 
              type="success" 
              size="large" 
              :loading="store.loading"
              style="margin-top: 16px"
              @click.stop="handleSeed"
            >
              生成数据
            </n-button>
          </div>
        </n-card>
      </n-gi>

      <n-gi>
        <n-card hoverable class="demo-card clear-card" @click="handleClear">
          <div class="card-content">
            <div class="card-icon">
              <n-icon :size="48" color="#FF4D4F"><TrashBinOutline /></n-icon>
            </div>
            <n-text strong style="font-size: 20px">一键清理演示数据</n-text>
            <n-text depth="3" style="text-align: center; margin-top: 8px">
              清理所有标记为演示的数据，恢复系统到干净状态
            </n-text>
            <n-button 
              type="error" 
              size="large" 
              :loading="store.loading"
              style="margin-top: 16px"
              @click.stop="handleClear"
            >
              清理数据
            </n-button>
          </div>
        </n-card>
      </n-gi>
    </n-grid>

    <n-card title="操作历史记录" size="small" style="margin-top: 24px">
      <n-timeline>
        <n-timeline-item 
          v-for="(record, index) in operationHistory" 
          :key="index" 
          :title="record.title" 
          :time="record.time"
          :type="record.type"
        >
          <n-text depth="3">{{ record.detail }}</n-text>
        </n-timeline-item>
      </n-timeline>
      <n-empty v-if="operationHistory.length === 0" description="暂无操作记录" />
    </n-card>

    <n-modal v-model:show="showClearResult" preset="card" :mask-closable="false" style="width: 500px">
      <template #header>
        <n-space align="center">
          <n-icon :size="20" color="#36B37E"><CheckmarkCircleOutline /></n-icon>
          <n-text strong>清理完成</n-text>
        </n-space>
      </template>
      <div v-if="lastDeleted" class="clear-result">
        <n-text style="margin-bottom: 16px; display: block">已成功清理以下演示数据：</n-text>
        <n-grid :cols="2" :x-gap="12" :y-gap="12">
          <n-gi>
            <n-statistic label="合同" :value="lastDeleted.contracts" />
          </n-gi>
          <n-gi>
            <n-statistic label="巡检任务" :value="lastDeleted.inspections" />
          </n-gi>
          <n-gi>
            <n-statistic label="巡检记录" :value="lastDeleted.records" />
          </n-gi>
          <n-gi>
            <n-statistic label="通知" :value="lastDeleted.notifications" />
          </n-gi>
          <n-gi>
            <n-statistic label="满意度记录" :value="lastDeleted.satisfaction" />
          </n-gi>
          <n-gi>
            <n-statistic label="方案" :value="lastDeleted.plans" />
          </n-gi>
          <n-gi>
            <n-statistic label="客户" :value="lastDeleted.customers" />
          </n-gi>
          <n-gi>
            <n-statistic label="用户" :value="lastDeleted.users" />
          </n-gi>
          <n-gi>
            <n-statistic label="预算版本" :value="lastDeleted.budget_versions" />
          </n-gi>
          <n-gi>
            <n-statistic label="验收模板" :value="lastDeleted.acceptance_templates" />
          </n-gi>
          <n-gi>
            <n-statistic label="巡检模板" :value="lastDeleted.inspection_templates" />
          </n-gi>
          <n-gi>
            <n-statistic label="配置日志" :value="lastDeleted.config_logs" />
          </n-gi>
        </n-grid>
        <n-space justify="end" style="margin-top: 24px">
          <n-button type="primary" @click="showClearResult = false">确定</n-button>
        </n-space>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import {
  AddCircleOutline,
  TrashBinOutline,
  CheckmarkCircleOutline,
} from '@vicons/ionicons5'
import { useDemoStore } from '~/stores/demo'

definePageMeta({
  layout: 'default',
})

const message = useMessage()
const dialog = useDialog()
const store = useDemoStore()
const showClearResult = ref(false)
const lastDeleted = ref<any>(null)

interface HistoryRecord {
  title: string
  time: string
  type: string
  detail: string
}

const operationHistory = ref<HistoryRecord[]>([
  {
    title: '生成演示数据',
    time: '2026-06-10 14:30',
    type: 'success',
    detail: '成功生成 50 条演示数据',
  },
])

function formatTime() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

async function handleSeed() {
  dialog.warning({
    title: '确认生成',
    content: '确定要生成演示数据吗？这将创建一批模拟的合同、客户和任务数据。',
    positiveText: '确认生成',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const res = await store.seed()
        message.success(`成功生成 ${res.count} 条演示数据`)
        operationHistory.value.unshift({
          title: '生成演示数据',
          time: formatTime(),
          type: 'success',
          detail: `成功生成 ${res.count} 条演示数据`,
        })
      } catch (e: any) {
        message.error(e?.data?.detail || '生成失败')
      }
    },
  })
}

async function handleClear() {
  dialog.warning({
    title: '确认清理',
    content: '确定要清理所有演示数据吗？此操作将删除所有标记为演示的数据，且不可恢复。',
    positiveText: '确认清理',
    negativeText: '取消',
    positiveButtonProps: {
      type: 'error',
    },
    onPositiveClick: async () => {
      try {
        const res = await store.clear()
        lastDeleted.value = res.deleted
        showClearResult.value = true
        const total = Object.values(res.deleted).reduce((sum: number, count: any) => sum + count, 0)
        operationHistory.value.unshift({
          title: '清理演示数据',
          time: formatTime(),
          type: 'error',
          detail: `成功清理 ${total} 条演示数据`,
        })
      } catch (e: any) {
        message.error(e?.data?.detail || '清理失败')
      }
    },
  })
}
</script>

<style scoped>
.demo-card {
  min-height: 320px;
  cursor: pointer;
  transition: all 0.3s;
}

.demo-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.seed-card {
  border: 2px solid #36B37E;
  background: linear-gradient(135deg, #f6ffed 0%, #ffffff 100%);
}

.clear-card {
  border: 2px solid #FF4D4F;
  background: linear-gradient(135deg, #fff1f0 0%, #ffffff 100%);
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
}

.card-icon {
  margin-bottom: 16px;
}

.clear-result {
  padding: 8px 0;
}
</style>
