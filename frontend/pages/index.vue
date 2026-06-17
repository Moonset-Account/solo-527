<template>
  <MainLayout>
    <div class="dashboard-page">
      <div class="stats-row">
        <n-grid :cols="4" :x-gap="16">
          <n-grid-item>
            <div class="stat-card">
              <div class="stat-icon lease-icon">
                <FileTrayOutline />
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.leaseCount }}</div>
                <div class="stat-label">租约总数</div>
              </div>
            </div>
          </n-grid-item>
          <n-grid-item>
            <div class="stat-card">
              <div class="stat-icon bill-icon">
                <ReceiptOutline />
              </div>
              <div class="stat-info">
                <div class="stat-value">¥{{ formatMoney(stats.totalAmount) }}</div>
                <div class="stat-label">账单总额</div>
              </div>
            </div>
          </n-grid-item>
          <n-grid-item>
            <div class="stat-card">
              <div class="stat-icon paid-icon">
                <CheckmarkCircleOutline />
              </div>
              <div class="stat-info">
                <div class="stat-value">¥{{ formatMoney(stats.paidAmount) }}</div>
                <div class="stat-label">已收金额</div>
              </div>
            </div>
          </n-grid-item>
          <n-grid-item>
            <div class="stat-card">
              <div class="stat-icon exception-icon">
                <AlertCircleOutline />
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.exceptionCount }}</div>
                <div class="stat-label">待处理异常</div>
              </div>
            </div>
          </n-grid-item>
        </n-grid>
      </div>

      <div class="content-row">
        <n-grid :cols="3" :x-gap="16">
          <n-grid-item :span="2">
            <n-card title="收租进度" :bordered="false">
              <template #header-extra>
                <n-button text size="small" @click="goToBills">查看更多</n-button>
              </template>
              <n-spin :show="loading">
                <div class="progress-list" v-if="progressData.items">
                  <div
                    v-for="item in progressData.items.slice(0, 6)"
                    :key="item.period"
                    class="progress-item"
                  >
                    <div class="progress-header">
                      <span class="period">{{ item.period }}</span>
                      <span class="rate">{{ item.collection_rate }}%</span>
                    </div>
                    <n-progress
                      type="line"
                      :percentage="item.collection_rate"
                      :color="item.collection_rate >= 90 ? '#18a058' : item.collection_rate >= 70 ? '#f0a020' : '#d03050'"
                      :height="8"
                    />
                    <div class="progress-detail">
                      <span>应收: ¥{{ formatMoney(item.total_amount) }}</span>
                      <span>已收: ¥{{ formatMoney(item.paid_amount) }}</span>
                    </div>
                  </div>
                </div>
              </n-spin>
            </n-card>
          </n-grid-item>
          <n-grid-item>
            <n-card title="待办事项" :bordered="false">
              <div class="todo-list">
                <div class="todo-item" v-for="item in todoList" :key="item.id">
                  <div class="todo-dot" :class="item.type"></div>
                  <div class="todo-content">
                    <div class="todo-title">{{ item.title }}</div>
                    <div class="todo-desc">{{ item.desc }}</div>
                  </div>
                </div>
                <div v-if="todoList.length === 0" class="empty-todo">
                  暂无待办事项
                </div>
              </div>
            </n-card>
          </n-grid-item>
        </n-grid>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  FileTrayOutline,
  ReceiptOutline,
  CheckmarkCircleOutline,
  AlertCircleOutline,
} from '@vicons/ionicons5'
import MainLayout from '~/components/layout/MainLayout.vue'
import { getCollectionProgress } from '~/api/bill'
import type { CollectionProgress } from '~/types'

const router = useRouter()
const loading = ref(false)

const stats = reactive({
  leaseCount: 0,
  totalAmount: 0,
  paidAmount: 0,
  exceptionCount: 0,
})

const progressData = ref<CollectionProgress>({
  items: [],
  total_amount: 0,
  total_paid: 0,
  total_unpaid: 0,
  overall_rate: 0,
})

const todoList = ref([
  { id: 1, type: 'warning', title: '逾期账单提醒', desc: '有 3 笔账单已逾期' },
  { id: 2, type: 'error', title: '待处理异常单', desc: '有 2 个异常单待处理' },
  { id: 3, type: 'info', title: '即将到期租约', desc: '有 5 个租约即将到期' },
])

function formatMoney(value: number): string {
  if (!value) return '0.00'
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function loadData() {
  loading.value = true
  try {
    const res = await getCollectionProgress()
    if (res.code === 200) {
      progressData.value = res.data
      stats.totalAmount = res.data.total_amount
      stats.paidAmount = res.data.total_paid
    }
  } catch (e) {
    console.error('加载数据失败', e)
  } finally {
    loading.value = false
  }
}

function goToBills() {
  router.push('/bills')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.dashboard-page {
  padding: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
}

.lease-icon {
  background: linear-gradient(135deg, #18a058, #36ad6a);
}

.bill-icon {
  background: linear-gradient(135deg, #2080f0, #4098fc);
}

.paid-icon {
  background: linear-gradient(135deg, #18a058, #36ad6a);
}

.exception-icon {
  background: linear-gradient(135deg, #d03050, #de576d);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #999;
}

.content-row {
  margin-bottom: 20px;
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.progress-item {
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.period {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.rate {
  font-size: 14px;
  font-weight: 600;
  color: #18a058;
}

.progress-detail {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.todo-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}

.todo-dot.warning {
  background: #f0a020;
}

.todo-dot.error {
  background: #d03050;
}

.todo-dot.info {
  background: #2080f0;
}

.todo-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.todo-desc {
  font-size: 12px;
  color: #999;
}

.empty-todo {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}
</style>
