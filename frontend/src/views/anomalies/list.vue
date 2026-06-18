<template>
  <div class="anomaly-list page-container">
    <div class="card-wrapper">
      <div class="card-header" style="margin-bottom: 20px;">
        <span class="title">
          <el-icon><Warning /></el-icon> 异常监控列表
        </span>
        <div>
          <el-button
            v-if="userStore.isManager"
            type="primary"
            :icon="Plus"
            @click="showCreate = true"
          >
            新建异常
          </el-button>
          <el-button
            v-if="selectedIds.length && userStore.isManager"
            :icon="UserFilled"
            @click="showBatchAssign = true"
          >
            批量分配 ({{ selectedIds.length }})
          </el-button>
        </div>
      </div>

      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索标题/指标/摘要..."
            clearable
            style="width: 220px"
            @change="loadData(1)"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="filters.category" placeholder="全部" clearable style="width: 140px" @change="loadData(1)">
            <el-option label="用户增长" value="user_growth" />
            <el-option label="留存分析" value="retention" />
            <el-option label="转化漏斗" value="conversion" />
            <el-option label="用户激活" value="activation" />
            <el-option label="营收数据" value="revenue" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重程度">
          <el-select v-model="filters.severity" placeholder="全部" clearable style="width: 120px" @change="loadData(1)">
            <el-option label="严重" value="critical" />
            <el-option label="警告" value="warning" />
            <el-option label="提示" value="info" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 120px" @change="loadData(1)">
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已解决" value="resolved" />
            <el-option label="已忽略" value="ignored" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="~"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 260px"
            @change="onDateChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-loading="loading"
        :data="list"
        row-key="_id"
        @selection-change="val => selectedIds = val.map(i => i._id)"
        stripe
      >
        <el-table-column type="selection" width="50" />
        <el-table-column label="严重程度" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :class="`tag-${row.severity}`"
              effect="dark"
              size="small"
              style="border: none"
            >
              {{ getSeverityInfo(row.severity).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="异常标题" min-width="260">
          <template #default="{ row }">
            <a @click="router.push(`/anomalies/${row._id}`)" class="table-link">
              {{ row.title }}
            </a>
            <div class="row-meta">
              <span>{{ getCategoryInfo(row.category).label }}</span>
              <span>· {{ row.metricName }}</span>
              <span v-if="row.tags?.length" class="row-tags">
                <el-tag v-for="t in row.tags.slice(0,3)" :key="t" size="small" effect="plain">{{ t }}</el-tag>
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="数据异常" width="180" align="right">
          <template #default="{ row }">
            <div class="value-cell">
              <span class="current-val">{{ formatNumber(row.currentValue) }}</span>
              <span
                class="deviation"
                :class="row.deviationPercent > 0 ? 'up' : 'down'"
              >
                {{ formatPercent(row.deviationPercent) }}
              </span>
            </div>
            <div class="expected" v-if="row.expectedValue">
              预期: {{ formatNumber(row.expectedValue) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusInfo(row.status).type" size="small" effect="plain">
              {{ getStatusInfo(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="处理人" width="120">
          <template #default="{ row }">
            <span v-if="row.assigneeName">{{ row.assigneeName }}</span>
            <el-tag v-else type="info" size="small" effect="plain">未分配</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="检测时间" width="170">
          <template #default="{ row }">
            <div>{{ formatDate(row.detectedAt) }}</div>
            <div class="time-ago">{{ fromNow(row.detectedAt) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="router.push(`/anomalies/${row._id}`)">
              详情
            </el-button>
            <el-button
              v-if="userStore.isManager"
              link
              type="danger"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="loadData(1)"
          @current-change="loadData()"
        />
      </div>
    </div>

    <el-dialog v-model="showCreate" title="新建异常记录" width="520px">
      <el-form :model="createForm" label-width="90px">
        <el-form-item label="标题" required>
          <el-input v-model="createForm.title" placeholder="请输入异常标题" />
        </el-form-item>
        <el-form-item label="分类" required>
          <el-select v-model="createForm.category" style="width: 100%">
            <el-option label="用户增长" value="user_growth" />
            <el-option label="留存分析" value="retention" />
            <el-option label="转化漏斗" value="conversion" />
            <el-option label="用户激活" value="activation" />
            <el-option label="营收数据" value="revenue" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="指标名" required>
          <el-input v-model="createForm.metricName" placeholder="如：daily_new_users" />
        </el-form-item>
        <el-form-item label="严重程度">
          <el-select v-model="createForm.severity" style="width: 100%">
            <el-option label="严重" value="critical" />
            <el-option label="警告" value="warning" />
            <el-option label="提示" value="info" />
          </el-select>
        </el-form-item>
        <el-form-item label="当前值">
          <el-input-number v-model="createForm.currentValue" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="预期值">
          <el-input-number v-model="createForm.expectedValue" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="摘要">
          <el-input v-model="createForm.summary" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">
          确认创建
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showBatchAssign" title="批量分配处理人" width="420px">
      <el-form label-width="80px">
        <el-form-item label="处理人" required>
          <el-select v-model="assignUserId" filterable placeholder="请选择处理人" style="width: 100%">
            <el-option
              v-for="u in operators"
              :key="u._id"
              :label="u.name + '（' + u.department + '）'"
              :value="u._id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBatchAssign = false">取消</el-button>
        <el-button type="primary" :loading="assigning" @click="handleBatchAssign">
          确认分配
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getAnomalies, createAnomaly, deleteAnomaly, batchAssignAnomalies
} from '@/api/anomalies'
import { getUsers } from '@/api/users'
import { useUserStore } from '@/stores/user'
import {
  formatNumber, formatPercent, formatDate, fromNow,
  getSeverityInfo, getStatusInfo, getCategoryInfo
} from '@/utils'
import { Plus, Warning, UserFilled } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const selectedIds = ref<string[]>([])
const dateRange = ref<any>(null)

const filters = reactive({
  keyword: '',
  category: '',
  severity: '',
  status: ''
})

const showCreate = ref(false)
const creating = ref(false)
const createForm = reactive({
  title: '',
  category: 'user_growth',
  metricName: '',
  severity: 'warning',
  currentValue: 0,
  expectedValue: 0,
  summary: ''
})

const showBatchAssign = ref(false)
const assigning = ref(false)
const assignUserId = ref('')
const operators = ref<any[]>([])

async function loadData(p?: number) {
  if (p) page.value = p
  loading.value = true
  try {
    const params: any = {
      ...filters,
      page: page.value,
      pageSize: pageSize.value
    }
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await getAnomalies(params)
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function onDateChange(val: any) {
  if (val && val.length === 2) {
    filters.startDate = val[0]
    filters.endDate = val[1]
  } else {
    delete filters.startDate
    delete filters.endDate
  }
  loadData(1)
}

function resetFilters() {
  filters.keyword = ''
  filters.category = ''
  filters.severity = ''
  filters.status = ''
  dateRange.value = null
  loadData(1)
}

async function handleCreate() {
  if (!createForm.title || !createForm.category || !createForm.metricName) {
    ElMessage.warning('请填写必填项')
    return
  }
  creating.value = true
  try {
    await createAnomaly(createForm)
    ElMessage.success('创建成功')
    showCreate.value = false
    loadData(1)
  } finally {
    creating.value = false
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除异常【${row.title}】？`, '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    await deleteAnomaly(row._id)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) { /* cancelled */ }
}

async function loadOperators() {
  try {
    const res = await getUsers({ pageSize: 200 })
    operators.value = res.list
  } catch (e) {}
}

async function handleBatchAssign() {
  if (!assignUserId.value) {
    ElMessage.warning('请选择处理人')
    return
  }
  assigning.value = true
  try {
    await batchAssignAnomalies({ ids: selectedIds.value, assigneeId: assignUserId.value })
    ElMessage.success(`已分配 ${selectedIds.value.length} 条记录`)
    showBatchAssign.value = false
    selectedIds.value = []
    loadData()
  } finally {
    assigning.value = false
  }
}

watch(
  () => route.query,
  (q) => {
    if (q.status) filters.status = q.status as string
    if (q.keyword) filters.keyword = q.keyword as string
    loadData(1)
  },
  { immediate: true }
)

onMounted(() => {
  loadOperators()
})
</script>

<style lang="scss" scoped>
.filter-form {
  margin-bottom: 16px;
  padding: 16px;
  background: #fafbfc;
  border-radius: 6px;

  :deep(.el-form-item) {
    margin-bottom: 10px;
    margin-right: 12px;
  }
}

.table-link {
  color: $primary-color;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
}

.row-meta {
  margin-top: 4px;
  font-size: 12px;
  color: $text-secondary;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;

  .row-tags {
    .el-tag {
      margin-left: 4px;
    }
  }
}

.value-cell {
  display: flex;
  justify-content: flex-end;
  align-items: baseline;
  gap: 8px;

  .current-val {
    font-weight: 600;
    color: $text-primary;
    font-size: 15px;
  }

  .deviation {
    font-size: 12px;
    font-weight: 500;

    &.up { color: $success-color; }
    &.down { color: $danger-color; }
  }
}

.expected {
  text-align: right;
  font-size: 12px;
  color: $text-secondary;
  margin-top: 2px;
}

.time-ago {
  font-size: 12px;
  color: $text-secondary;
  margin-top: 2px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
