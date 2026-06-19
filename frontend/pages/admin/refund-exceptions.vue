<template>
  <div class="page-container">
    <div class="card-wrapper">
      <h2 class="page-title">退票异常</h2>
      
      <div class="table-toolbar">
        <div class="search-bar">
          <n-select
            v-model:value="filterStatus"
            :options="statusOptions"
            placeholder="状态"
            style="width: 120px"
            clearable
          />
          <n-switch v-model:value="onlyAuto" checked-value>
            仅自动生成
          </n-switch>
        </div>
      </div>
      
      <n-data-table
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        :bordered="false"
        @update:page="handlePageChange"
      >
        <template #status="{ row }">
          <n-tag :type="statusTagType(row.status)">
            {{ statusLabel(row.status) }}
          </n-tag>
        </template>
        <template #auto="{ row }">
          <n-tag v-if="row.auto_generated" type="info">自动</n-tag>
          <span v-else>-</span>
        </template>
        <template #actions="{ row }">
          <n-space>
            <n-button size="small" @click="handleView(row)">查看</n-button>
            <n-button size="small" type="primary" v-if="row.status !== 'resolved'" @click="handleResolve(row)">
              处理
            </n-button>
          </n-space>
        </template>
      </n-data-table>
    </div>
    
    <n-modal v-model:show="showDetail" preset="card" title="退票异常详情" style="width: 600px">
      <div v-if="currentItem" class="detail-content">
        <div class="detail-item">
          <span class="detail-label">报名编号</span>
          <span class="detail-value">{{ currentItem.registration?.registration_no || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">姓名</span>
          <span class="detail-value">{{ currentItem.registration?.real_name || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">异常类型</span>
          <span class="detail-value">{{ currentItem.exception_type || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">状态</span>
          <span class="detail-value">
            <n-tag :type="statusTagType(currentItem.status)">
              {{ statusLabel(currentItem.status) }}
            </n-tag>
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">申请退款金额</span>
          <span class="detail-value">{{ currentItem.refund_amount }} 元</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">实际退款金额</span>
          <span class="detail-value">{{ currentItem.actual_refund_amount || 0 }} 元</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">描述</span>
          <span class="detail-value">{{ currentItem.description || '-' }}</span>
        </div>
        <div class="detail-item" v-if="currentItem.handled_by">
          <span class="detail-label">处理人</span>
          <span class="detail-value">{{ currentItem.handled_by }}</span>
        </div>
        <div class="detail-item" v-if="currentItem.handle_result">
          <span class="detail-label">处理结果</span>
          <span class="detail-value">{{ currentItem.handle_result }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">创建时间</span>
          <span class="detail-value">{{ currentItem.created_at }}</span>
        </div>
        <div class="detail-item" v-if="currentItem.resolved_at">
          <span class="detail-label">解决时间</span>
          <span class="detail-value">{{ currentItem.resolved_at }}</span>
        </div>
      </div>
      <template #footer v-if="currentItem?.status !== 'resolved'">
        <n-space justify="end">
          <n-button @click="showDetail = false">关闭</n-button>
          <n-button type="primary" @click="handleResolve(currentItem)">处理</n-button>
        </n-space>
      </template>
    </n-modal>
    
    <n-modal v-model:show="showResolveDialog" preset="card" title="处理退票异常" style="width: 500px">
      <n-form label-placement="top">
        <n-form-item label="实际退款金额（元）">
          <n-input-number v-model:value="actualRefundAmount" :min="0" style="width: 100%" />
        </n-form-item>
        <n-form-item label="处理结果">
          <n-input v-model:value="handleResult" type="textarea" :rows="4" placeholder="请输入处理结果说明" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showResolveDialog = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="submitResolve">确认处理</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NCard, NSelect, NButton, NSpace, NDataTable,
  NModal, NTag, NForm, NFormItem, NInput, NInputNumber,
  NSwitch, useMessage
} from 'naive-ui'
import { useApi } from '~/composables/useApi'
import { useAuth } from '~/composables/useAuth'

const message = useMessage()
const api = useApi()

const loading = ref(false)
const submitting = ref(false)
const data = ref<any[]>([])
const filterStatus = ref<string | null>(null)
const onlyAuto = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const showDetail = ref(false)
const showResolveDialog = ref(false)
const currentItem = ref<any>(null)
const actualRefundAmount = ref(0)
const handleResult = ref('')

const statusOptions = [
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已解决', value: 'resolved' },
  { label: '已升级', value: 'escalated' },
]

const columns = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '报名ID', key: 'registration_id', width: 100 },
  { title: '异常类型', key: 'exception_type', width: 120 },
  { title: '退款金额', key: 'refund_amount', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '自动生成', key: 'auto', width: 100 },
  { title: '创建时间', key: 'created_at', width: 160 },
  { title: '操作', key: 'actions', width: 160, fixed: 'right' },
]

const pagination = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  itemCount: total.value,
}))

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    escalated: '已升级',
  }
  return map[status] || status
}

const statusTagType = (status: string) => {
  const map: Record<string, any> = {
    pending: 'warning',
    processing: 'info',
    resolved: 'success',
    escalated: 'error',
  }
  return map[status] || 'default'
}

const fetchExceptions = async () => {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      page_size: pageSize.value,
    }
    if (filterStatus.value) params.status = filterStatus.value
    if (onlyAuto.value) params.auto_generated = true
    
    const data: any = await api.get('/refund-exceptions', params)
    data.value = data.items || []
    total.value = data.total || 0
  } catch (e: any) {
    message.error(e.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (p: number) => {
  page.value = p
  fetchExceptions()
}

const handleView = (row: any) => {
  currentItem.value = row
  showDetail.value = true
}

const handleResolve = (row: any) => {
  currentItem.value = row
  actualRefundAmount.value = row.refund_amount || 0
  handleResult.value = ''
  showResolveDialog.value = true
  showDetail.value = false
}

const submitResolve = async () => {
  if (!currentItem.value) return
  
  submitting.value = true
  try {
    await api.post(`/refund-exceptions/${currentItem.value.id}/resolve`, null, {
      params: {
        handle_result: handleResult.value,
        actual_refund_amount: actualRefundAmount.value,
      },
    })
    message.success('处理成功')
    showResolveDialog.value = false
    fetchExceptions()
  } catch (e: any) {
    message.error(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchExceptions()
})
</script>

<style scoped lang="scss">
.detail-content {
  padding: 8px 0;
}
</style>
