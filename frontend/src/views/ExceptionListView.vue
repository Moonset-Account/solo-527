<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">
          异常待办池
          <el-badge v-if="pendingCounts.total" :value="pendingCounts.total" class="head-badge" style="margin-left:10px" />
        </h2>
        <p style="margin:4px 0 0;font-size:13px;color:#909399">集中处理系统异常，处理完成后自动关闭</p>
      </div>
      <div style="display:flex;gap:10px">
        <el-radio-group v-model="filterStatus" size="default" @change="fetchList">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="pending">
            待处理 <el-badge v-if="pendingCounts.total" :value="pendingCounts.total" :hidden="false" class="inline-badge" />
          </el-radio-button>
          <el-radio-button value="processing">处理中</el-radio-button>
          <el-radio-button value="resolved">已处理</el-radio-button>
        </el-radio-group>
        <el-button type="primary" @click="showCreate = true">
          <el-icon><Plus /></el-icon> 手动创建
        </el-button>
      </div>
    </div>

    <div class="priority-summary grid-dashboard" style="grid-template-columns: repeat(4,1fr)">
      <div class="priority-card critical" @click="filterPriority = 'critical'; fetchList()">
        <div class="pc-label">紧急</div>
        <div class="pc-count">{{ pendingCounts.byPriority?.critical || 0 }}</div>
      </div>
      <div class="priority-card high" @click="filterPriority = 'high'; fetchList()">
        <div class="pc-label">高</div>
        <div class="pc-count">{{ pendingCounts.byPriority?.high || 0 }}</div>
      </div>
      <div class="priority-card medium" @click="filterPriority = 'medium'; fetchList()">
        <div class="pc-label">中</div>
        <div class="pc-count">{{ pendingCounts.byPriority?.medium || 0 }}</div>
      </div>
      <div class="priority-card low" @click="filterPriority = 'low'; fetchList()">
        <div class="pc-label">低</div>
        <div class="pc-count">{{ pendingCounts.byPriority?.low || 0 }}</div>
      </div>
    </div>

    <div class="section-card">
      <div class="card-body">
        <div class="search-bar">
          <el-select v-model="filterPriority" placeholder="全部优先级" clearable style="width:140px" @change="fetchList">
            <el-option label="紧急" value="critical" />
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
          <el-select v-model="filterType" placeholder="全部类型" clearable style="width:160px" @change="fetchList">
            <el-option label="爽约" value="no_show" />
            <el-option label="支付失败" value="payment_fail" />
            <el-option label="预约冲突" value="conflict" />
            <el-option label="客户投诉" value="complaint" />
            <el-option label="其他" value="other" />
          </el-select>
          <el-button type="primary" @click="filterPriority='';filterType='';fetchList()">重置</el-button>
        </div>

        <el-table :data="list" v-loading="loading" stripe size="default" style="width:100%">
          <el-table-column width="8" fixed="left">
            <template #default="{ row }">
              <div class="pri-mark" :class="row.priority"></div>
            </template>
          </el-table-column>
          <el-table-column label="标题" min-width="200">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;gap:8px">
                <span :class="['priority-tag', 'priority-' + row.priority]">{{ priorityText(row.priority) }}</span>
                <el-tag size="small" effect="plain">{{ typeText(row.type) }}</el-tag>
              </div>
              <div style="font-weight:500;margin-top:6px">{{ row.title }}</div>
            </template>
          </el-table-column>
          <el-table-column label="关联信息" min-width="200">
            <template #default="{ row }">
              <div v-if="row.customer" style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <el-icon><UserFilled /></el-icon>
                <span style="color:#606266">{{ row.customer.name }} · {{ row.customer.phone }}</span>
              </div>
              <div v-if="row.booking" style="display:flex;align-items:center;gap:8px">
                <el-icon><Document /></el-icon>
                <el-button link type="primary" size="small" @click="$router.push(`/bookings/${row.booking.id}`)">
                  {{ row.booking.booking_no }}
                </el-button>
                <span style="color:#909399;font-size:12px">
                  {{ row.booking.booking_date }} {{ row.booking.start_time }}
                </span>
              </div>
              <span v-if="!row.customer && !row.booking" style="color:#c0c4cc">-</span>
            </template>
          </el-table-column>
          <el-table-column label="描述" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.description || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.status === 'resolved'" type="success" size="small">已处理</el-tag>
              <el-tag v-else-if="row.status === 'processing'" type="warning" size="small">处理中</el-tag>
              <el-tag v-else type="danger" effect="dark" size="small">待处理</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="处理人" width="100">
            <template #default="{ row }">
              {{ row.handler?.real_name || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="170">
            <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
              <el-button
                v-if="row.status !== 'resolved'"
                link
                type="success"
                size="small"
                @click="handleTodo(row)"
              >
                处理完成
              </el-button>
              <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div style="display:flex;justify-content:flex-end;margin-top:20px">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.perPage"
            :page-sizes="[10, 20, 50]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchList"
            @current-change="fetchList"
          />
        </div>
      </div>
    </div>

    <el-dialog v-model="showDetail" title="待办详情" width="620px" destroy-on-close>
      <div v-if="currentItem">
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:16px">
          <span :class="['priority-tag', 'priority-' + currentItem.priority]">{{ priorityText(currentItem.priority) }}</span>
          <el-tag effect="plain">{{ typeText(currentItem.type) }}</el-tag>
          <el-tag v-if="currentItem.status === 'resolved'" type="success" size="small">已处理</el-tag>
          <el-tag v-else-if="currentItem.status === 'processing'" type="warning" size="small">处理中</el-tag>
          <el-tag v-else type="danger" effect="dark" size="small">待处理</el-tag>
        </div>
        <h4 style="margin:0 0 10px;color:#303133">{{ currentItem.title }}</h4>
        <p style="color:#606266;line-height:1.7">{{ currentItem.description || '(无描述)' }}</p>

        <el-descriptions :column="1" border size="small" style="margin-top:16px">
          <el-descriptions-item label="关联预约">
            <el-button
              v-if="currentItem.booking"
              link
              type="primary"
              size="small"
              @click="$router.push(`/bookings/${currentItem.booking.id}`)"
            >
              {{ currentItem.booking.booking_no }}
            </el-button>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="关联客户">
            {{ currentItem.customer ? (currentItem.customer.name + ' ' + currentItem.customer.phone) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="处理人">{{ currentItem.handler?.real_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="处理时间">{{ currentItem.handled_at ? formatTime(currentItem.handled_at) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="解决方案" v-if="currentItem.resolution">
            {{ currentItem.resolution }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="currentItem.status !== 'resolved'" style="margin-top:20px">
          <div style="font-weight:500;margin-bottom:10px;color:#303133">填写处理结果：</div>
          <el-input v-model="handleResolution" type="textarea" :rows="3" placeholder="请填写处理方案/说明..." maxlength="500" show-word-limit />
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <el-button
          v-if="currentItem && currentItem.status !== 'resolved'"
          type="primary"
          :loading="handling"
          @click="confirmHandle"
        >
          确认处理完成
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showCreate" title="手动创建异常待办" width="500px" destroy-on-close>
      <el-form :model="createForm" label-width="90px">
        <el-form-item label="类型">
          <el-select v-model="createForm.type" style="width:100%">
            <el-option label="爽约" value="no_show" />
            <el-option label="支付失败" value="payment_fail" />
            <el-option label="预约冲突" value="conflict" />
            <el-option label="客户投诉" value="complaint" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-radio-group v-model="createForm.priority">
            <el-radio value="critical">紧急</el-radio>
            <el-radio value="high">高</el-radio>
            <el-radio value="medium">中</el-radio>
            <el-radio value="low">低</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="createForm.title" placeholder="简述问题" maxlength="200" />
        </el-form-item>
        <el-form-item label="详细描述">
          <el-input v-model="createForm.description" type="textarea" :rows="3" maxlength="1000" />
        </el-form-item>
        <el-form-item label="关联预约">
          <el-input v-model.number="createForm.bookingId" placeholder="可选，预约ID" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="submitCreate">确认创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, UserFilled, Document } from '@element-plus/icons-vue'
import { getExceptionList, getExceptionPendingCount, handleException, deleteException, createException } from '@/api/exception'
import dayjs from 'dayjs'

const loading = ref(false)
const handling = ref(false)
const creating = ref(false)
const list = ref<any[]>([])
const pendingCounts = ref<any>({ total: 0, byPriority: { critical: 0, high: 0, medium: 0, low: 0 } })
const filterStatus = ref('pending')
const filterPriority = ref('')
const filterType = ref('')
const pagination = reactive({ page: 1, perPage: 20, total: 0 })

const showDetail = ref(false)
const showCreate = ref(false)
const currentItem = ref<any>(null)
const handleResolution = ref('')
const createForm = reactive({ type: 'other', priority: 'medium', title: '', description: '', bookingId: null as number | null })

const priorityMap: Record<string, string> = { critical: '紧急', high: '高', medium: '中', low: '低' }
const typeMap: Record<string, string> = { no_show: '爽约', payment_fail: '支付失败', conflict: '预约冲突', complaint: '客户投诉', other: '其他' }
const priorityText = (p: string) => priorityMap[p] || p
const typeText = (t: string) => typeMap[t] || t
const formatTime = (t: string) => t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'

const fetchCounts = async () => {
  try {
    const res = await getExceptionPendingCount()
    pendingCounts.value = res.data
  } catch (_) {}
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getExceptionList({
      page: pagination.page, perPage: pagination.perPage,
      status: filterStatus.value || undefined,
      priority: filterPriority.value || undefined,
      type: filterType.value || undefined,
    })
    list.value = res.data.data
    pagination.total = res.data.meta.total
  } finally {
    loading.value = false
  }
}

const openDetail = async (row: any) => {
  currentItem.value = { ...row }
  handleResolution.value = ''
  showDetail.value = true
}

const confirmHandle = async () => {
  if (!currentItem.value) return
  handling.value = true
  try {
    await handleException(currentItem.value.id, { resolution: handleResolution.value, status: 'resolved' })
    ElMessage.success('已处理完成')
    showDetail.value = false
    await fetchList()
    await fetchCounts()
  } finally {
    handling.value = false
  }
}

const handleTodo = async (row: any) => {
  currentItem.value = row
  const { value } = await ElMessageBox.prompt('请输入处理结果说明', '确认处理完成', {
    confirmButtonText: '确认', cancelButtonText: '取消',
    inputType: 'textarea', inputPlaceholder: '处理方案...'
  }).catch(() => ({ value: null }))
  if (value !== null) {
    handleResolution.value = value
    confirmHandle()
  }
}

const submitCreate = async () => {
  if (!createForm.title) { ElMessage.warning('请输入标题'); return }
  creating.value = true
  try {
    await createException({ ...createForm })
    ElMessage.success('创建成功')
    showCreate.value = false
    createForm.title = ''
    createForm.description = ''
    createForm.bookingId = null
    await fetchList()
    await fetchCounts()
  } finally {
    creating.value = false
  }
}

const remove = async (row: any) => {
  await ElMessageBox.confirm('确认删除这条待办吗？', '提示', { type: 'warning' })
  await deleteException(row.id)
  ElMessage.success('已删除')
  await fetchList()
  await fetchCounts()
}

onMounted(async () => {
  await fetchCounts()
  await fetchList()
})
</script>

<style scoped>
.head-badge :deep(.el-badge__content) { transform: translateX(100%) translateY(-30%); }
.inline-badge :deep(.el-badge__content) { transform: translateX(100%) translateY(-50%); margin-left: 6px; }

.priority-card {
  background: #fff;
  padding: 16px;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  cursor: pointer;
  border-left: 4px solid transparent;
  transition: all 0.2s;
}
.priority-card:hover { transform: translateY(-2px); }
.priority-card.critical { border-left-color: #f56c6c; }
.priority-card.critical .pc-count { color: #f56c6c; }
.priority-card.high { border-left-color: #e6a23c; }
.priority-card.high .pc-count { color: #e6a23c; }
.priority-card.medium { border-left-color: #409eff; }
.priority-card.medium .pc-count { color: #409eff; }
.priority-card.low { border-left-color: #67c23a; }
.priority-card.low .pc-count { color: #67c23a; }

.pc-label { font-size: 13px; color: #909399; margin-bottom: 6px; }
.pc-count { font-size: 28px; font-weight: 700; line-height: 1.2; }

.pri-mark {
  width: 4px;
  height: 100%;
  min-height: 50px;
  border-radius: 2px;
  position: absolute;
  left: 0; top: 0;
}
.pri-mark.critical { background: #f56c6c; }
.pri-mark.high { background: #e6a23c; }
.pri-mark.medium { background: #409eff; }
.pri-mark.low { background: #67c23a; }
:deep(.el-table__body td:first-child .cell) { padding-left: 0; padding-right: 0; width: 4px; position: relative; }
</style>
