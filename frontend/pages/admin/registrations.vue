<template>
  <div class="page-container">
    <div class="card-wrapper">
      <h2 class="page-title">报名管理</h2>
      
      <div class="table-toolbar">
        <div class="search-bar">
          <n-select
            v-model:value="selectedEvent"
            :options="eventOptions"
            placeholder="选择活动"
            style="width: 200px"
            @update:value="handleEventChange"
          />
          <n-select
            v-model:value="filterStatus"
            :options="statusOptions"
            placeholder="状态"
            style="width: 120px"
            clearable
          />
          <n-select
            v-model:value="filterQuality"
            :options="qualityOptions"
            placeholder="质量"
            style="width: 120px"
            clearable
          />
          <n-input
            v-model:value="keyword"
            placeholder="搜索姓名/手机/编号"
            style="width: 200px"
            clearable
          />
          <n-button type="primary" @click="fetchRegistrations">查询</n-button>
        </div>
        <div class="action-bar">
          <n-button @click="handleExport">导出报表</n-button>
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
        <template #quality="{ row }">
          <n-tag :type="qualityTagType(row.quality)">
            {{ qualityLabel(row.quality) }}
          </n-tag>
        </template>
        <template #actions="{ row }">
          <n-space>
            <n-button size="small" @click="handleView(row)">详情</n-button>
            <n-button size="small" @click="handleQualityChange(row)">质量调整</n-button>
          </n-space>
        </template>
      </n-data-table>
    </div>
    
    <n-modal v-model:show="showDetail" preset="card" :title="`报名详情 - ${currentItem?.registration_no}`" style="width: 700px">
      <div v-if="currentItem" class="detail-section">
        <h4>基本信息</h4>
        <div class="detail-item">
          <span class="detail-label">报名编号</span>
          <span class="detail-value">{{ currentItem.registration_no }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">真实姓名</span>
          <span class="detail-value">{{ currentItem.real_name }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">手机号码</span>
          <span class="detail-value">{{ currentItem.phone }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">身份证号</span>
          <span class="detail-value">{{ currentItem.id_card_no || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">电子邮箱</span>
          <span class="detail-value">{{ currentItem.email || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">公司</span>
          <span class="detail-value">{{ currentItem.company || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">职位</span>
          <span class="detail-value">{{ currentItem.position || '-' }}</span>
        </div>
        
        <h4>票务信息</h4>
        <div class="detail-item">
          <span class="detail-label">票种</span>
          <span class="detail-value">{{ currentItem.ticket_type || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">票价</span>
          <span class="detail-value">{{ currentItem.ticket_price }} 元</span>
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
          <span class="detail-label">质量等级</span>
          <span class="detail-value">
            <n-tag :type="qualityTagType(currentItem.quality)">
              {{ qualityLabel(currentItem.quality) }}
            </n-tag>
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">签到次数</span>
          <span class="detail-value">{{ currentItem.checkin_count || 0 }} 次</span>
        </div>
        
        <h4>质量变更历史</h4>
        <n-timeline v-if="currentItem.quality_histories?.length" :items="qualityHistoryItems" />
        <p v-else class="empty-hint">暂无变更记录</p>
        
        <h4>备注</h4>
        <p class="remark-text">{{ currentItem.remark || '无' }}</p>
      </div>
    </n-modal>
    
    <n-modal v-model:show="showQualityDialog" preset="card" title="调整报名质量" style="width: 400px">
      <n-form label-placement="top">
        <n-form-item label="质量等级">
          <n-select v-model:value="newQuality" :options="qualityOptions" />
        </n-form-item>
        <n-form-item label="调整原因">
          <n-input v-model:value="qualityReason" type="textarea" :rows="3" placeholder="请输入调整原因" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showQualityDialog = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="submitQualityChange">确认</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  NCard, NInput, NSelect, NButton, NSpace, NDataTable,
  NModal, NTag, NTimeline, NForm, NFormItem, useMessage
} from 'naive-ui'
import { useApi } from '~/composables/useApi'
import { useAuth } from '~/composables/useAuth'

const route = useRoute()
const message = useMessage()
const api = useApi()
const { isOperator } = useAuth()

const loading = ref(false)
const submitting = ref(false)
const data = ref<any[]>([])
const events = ref<any[]>([])
const selectedEvent = ref<number | null>(null)
const filterStatus = ref<string | null>(null)
const filterQuality = ref<string | null>(null)
const keyword = ref('')
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const showDetail = ref(false)
const currentItem = ref<any>(null)
const showQualityDialog = ref(false)
const newQuality = ref('medium')
const qualityReason = ref('')

const eventOptions = computed(() => 
  events.value.map(e => ({ label: e.name, value: e.id }))
)

const statusOptions = [
  { label: '待确认', value: 'pending' },
  { label: '已确认', value: 'confirmed' },
  { label: '已取消', value: 'cancelled' },
  { label: '已退款', value: 'refunded' },
  { label: '退票异常', value: 'refund_exception' },
]

const qualityOptions = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
]

const columns = [
  { title: '报名编号', key: 'registration_no', width: 140 },
  { title: '姓名', key: 'real_name', width: 100 },
  { title: '手机', key: 'phone', width: 120 },
  { title: '公司', key: 'company' },
  { title: '票种', key: 'ticket_type', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '质量', key: 'quality', width: 100 },
  { title: '报名时间', key: 'created_at', width: 160 },
  { title: '操作', key: 'actions', width: 160, fixed: 'right' },
]

const pagination = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  itemCount: total.value,
  showSizePicker: false,
}))

const qualityHistoryItems = computed(() => {
  if (!currentItem.value?.quality_histories) return []
  return currentItem.value.quality_histories.map((h: any) => ({
    title: `${qualityLabel(h.new_quality)}`,
    content: `${h.changed_by || '系统'} · ${h.reason || '调整质量'}`,
    time: h.created_at,
  }))
})

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    cancelled: '已取消',
    refunded: '已退款',
    refund_exception: '退票异常',
  }
  return map[status] || status
}

const statusTagType = (status: string) => {
  const map: Record<string, any> = {
    pending: 'warning',
    confirmed: 'success',
    cancelled: 'default',
    refunded: 'info',
    refund_exception: 'error',
  }
  return map[status] || 'default'
}

const qualityLabel = (quality: string) => {
  const map: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低',
  }
  return map[quality] || quality
}

const qualityTagType = (quality: string) => {
  const map: Record<string, any> = {
    high: 'success',
    medium: 'warning',
    low: 'error',
  }
  return map[quality] || 'default'
}

const fetchEvents = async () => {
  try {
    const data: any = await api.get('/events', { is_active: true, page_size: 100 })
    events.value = data.items || []
    if (events.value.length > 0 && !selectedEvent.value) {
      const routeEventId = route.query.event_id
      if (routeEventId) {
        selectedEvent.value = Number(routeEventId)
      } else {
        selectedEvent.value = events.value[0].id
      }
      fetchRegistrations()
    }
  } catch (e) {
    console.error('获取活动列表失败', e)
  }
}

const fetchRegistrations = async () => {
  if (!selectedEvent.value) return
  
  loading.value = true
  try {
    const params: any = {
      event_id: selectedEvent.value,
      page: page.value,
      page_size: pageSize.value,
    }
    if (filterStatus.value) params.status = filterStatus.value
    if (filterQuality.value) params.quality = filterQuality.value
    if (keyword.value) params.keyword = keyword.value
    
    const data: any = await api.get('/registrations', params)
    data.value = data.items || []
    total.value = data.total || 0
  } catch (e: any) {
    message.error(e.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleEventChange = () => {
  page.value = 1
  fetchRegistrations()
}

const handlePageChange = (p: number) => {
  page.value = p
  fetchRegistrations()
}

const handleView = async (row: any) => {
  try {
    const detail: any = await api.get(`/registrations/${row.id}`)
    currentItem.value = detail
    showDetail.value = true
  } catch (e: any) {
    message.error(e.message || '获取详情失败')
  }
}

const handleQualityChange = (row: any) => {
  if (!isOperator.value) {
    message.warning('没有权限')
    return
  }
  currentItem.value = row
  newQuality.value = row.quality
  qualityReason.value = ''
  showQualityDialog.value = true
}

const submitQualityChange = async () => {
  if (!currentItem.value) return
  
  submitting.value = true
  try {
    await api.post(`/registrations/${currentItem.value.id}/quality`, {
      quality: newQuality.value,
      reason: qualityReason.value,
    })
    message.success('质量调整成功')
    showQualityDialog.value = false
    fetchRegistrations()
  } catch (e: any) {
    message.error(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const handleExport = async () => {
  if (!selectedEvent.value) {
    message.warning('请先选择活动')
    return
  }
  
  try {
    await api.download(
      `/exports/registrations/${selectedEvent.value}`,
      `报名数据_${Date.now()}.xlsx`
    )
    message.success('导出成功')
  } catch (e: any) {
    message.error(e.message || '导出失败')
  }
}

onMounted(() => {
  fetchEvents()
})
</script>

<style scoped lang="scss">
.action-bar {
  display: flex;
  gap: 12px;
}

.detail-section {
  h4 {
    margin: 20px 0 12px;
    font-size: 15px;
    font-weight: 600;
    color: #333;
    
    &:first-child {
      margin-top: 0;
    }
  }
}

.empty-hint {
  color: #999;
  font-size: 13px;
  padding: 12px 0;
}

.remark-text {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}
</style>
