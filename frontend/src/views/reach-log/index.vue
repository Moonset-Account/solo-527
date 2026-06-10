<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">触达日志</h2>
      <div class="header-actions">
        <el-tag v-if="envFilter" type="warning" effect="dark">
          环境: {{ envLabelText }}
        </el-tag>
      </div>
    </div>

    <el-row :gutter="16" class="stat-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">总触达次数</div>
          <div class="stat-value">{{ stats.total || 0 }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card success">
          <div class="stat-label">成功</div>
          <div class="stat-value">{{ successCount }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card danger">
          <div class="stat-label">失败</div>
          <div class="stat-value">{{ stats.failedCount || 0 }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card warning">
          <div class="stat-label">成功率</div>
          <div class="stat-value">{{ successRate }}%</div>
        </div>
      </el-col>
    </el-row>

    <div class="filter-bar mt-20">
      <el-form :inline="true" :model="filterForm" @submit.prevent>
        <el-form-item label="关键词">
          <el-input v-model="filterForm.keyword" placeholder="会员/模板/内容" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="触达方式">
          <el-select v-model="filterForm.type" placeholder="全部方式" clearable style="width: 130px">
            <el-option label="短信" value="sms" />
            <el-option label="微信" value="wechat" />
            <el-option label="APP推送" value="app_push" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 130px">
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
            <el-option label="待发送" value="pending" />
          </el-select>
        </el-form-item>
        <el-form-item label="发送日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="环境">
          <el-select v-model="filterForm.envLabel" placeholder="全部环境" clearable style="width: 130px">
            <el-option label="开发环境" value="dev" />
            <el-option label="测试环境" value="test" />
            <el-option label="预发布环境" value="staging" />
            <el-option label="生产环境" value="prod" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="filterForm.operatorName" placeholder="操作人" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadList">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card-wrapper">
      <el-table :data="list" stripe style="width: 100%" @row-click="showDetail">
        <el-table-column prop="logNo" label="日志编号" width="170" />
        <el-table-column label="触达方式" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="typeTag(row.type)">{{ typeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="templateName" label="模板名称" width="160" />
        <el-table-column label="会员信息" width="180">
          <template #default="{ row }">
            <div class="member-cell">
              <span class="name">{{ row.memberName }}</span>
              <span class="phone">{{ row.memberPhone }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容摘要" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="失败原因" prop="failReason" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.status === 'failed'" style="color: #f56c6c;">{{ row.failReason }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="环境" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="envTagType(row.envLabel)" effect="plain">{{ envText(row.envLabel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作人" prop="operatorName" width="100" />
        <el-table-column label="发送时间" width="170">
          <template #default="{ row }">{{ formatDate(row.sendTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click.stop="showDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="filterForm.page"
          v-model:page-size="filterForm.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </div>

    <el-dialog v-model="detailVisible" title="触达日志详情" width="680px">
      <el-descriptions :column="2" border v-if="currentDetail">
        <el-descriptions-item label="日志编号">{{ currentDetail.logNo }}</el-descriptions-item>
        <el-descriptions-item label="触达方式">
          <el-tag :type="typeTag(currentDetail.type)">{{ typeText(currentDetail.type) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="会员">{{ currentDetail.memberName }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentDetail.memberPhone }}</el-descriptions-item>
        <el-descriptions-item label="模板名称">{{ currentDetail.templateName }}</el-descriptions-item>
        <el-descriptions-item label="模板ID">{{ currentDetail.templateId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发送内容" :span="2">
          <div style="max-height: 100px; overflow-y: auto; padding: 8px; background: #f9fafb; border-radius: 4px;">
            {{ currentDetail.content }}
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(currentDetail.status)">{{ statusText(currentDetail.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="环境">
          <el-tag :type="envTagType(currentDetail.envLabel)">{{ envText(currentDetail.envLabel) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentDetail.status === 'failed'" label="失败代码" :span="2">
          {{ currentDetail.failCode || '-' }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentDetail.status === 'failed'" label="失败原因" :span="2">
          <span style="color: #f56c6c;">{{ currentDetail.failReason || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="服务商">{{ currentDetail.provider || '-' }}</el-descriptions-item>
        <el-descriptions-item label="服务商消息ID">{{ currentDetail.providerMsgId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="门店">{{ currentDetail.storeName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentDetail.operatorName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发送时间">{{ formatDate(currentDetail.sendTime) }}</el-descriptions-item>
        <el-descriptions-item label="接收时间">{{ formatDate(currentDetail.receiveTime) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'
import request from '@/utils/request'

const userStore = useUserStore()
const { envInfo } = storeToRefs(userStore)

const list = ref([])
const total = ref(0)
const stats = ref({})
const dateRange = ref([])
const detailVisible = ref(false)
const currentDetail = ref(null)

const filterForm = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
  type: '',
  status: '',
  startDate: '',
  endDate: '',
  envLabel: '',
  operatorName: '',
})

const envFilter = computed(() => filterForm.envLabel || envInfo.value?.envLabel)
const envLabelText = computed(() => envText(filterForm.envLabel || envInfo.value?.envLabel))

const successCount = computed(() => {
  const item = stats.value?.byStatus?.find?.(s => s._id === 'success')
  return item?.count || 0
})

const successRate = computed(() => {
  if (!stats.value?.total) return 0
  return ((successCount.value / stats.value.total) * 100).toFixed(1)
})

const typeMap = {
  sms: { text: '短信', type: 'primary' },
  wechat: { text: '微信', type: 'success' },
  app_push: { text: 'APP推送', type: 'warning' },
}

const statusMap = {
  success: { text: '成功', type: 'success' },
  failed: { text: '失败', type: 'danger' },
  pending: { text: '待发送', type: 'warning' },
}

const envTagMap = {
  dev: 'info', test: 'warning', staging: 'warning', prod: 'success'
}

function typeText(t) { return typeMap[t]?.text || t }
function typeTag(t) { return typeMap[t]?.type || 'info' }
function statusText(s) { return statusMap[s]?.text || s }
function statusType(s) { return statusMap[s]?.type || 'info' }
function envText(e) {
  const map = { dev: '开发', test: '测试', staging: '预发布', prod: '生产' }
  return map[e] || e
}
function envTagType(e) { return envTagMap[e] || 'info' }

function formatDate(d) {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD HH:mm:ss')
}

function showDetail(row) {
  currentDetail.value = row
  detailVisible.value = true
}

function resetFilter() {
  Object.assign(filterForm, {
    page: 1,
    keyword: '',
    type: '',
    status: '',
    startDate: '',
    endDate: '',
    envLabel: '',
    operatorName: '',
  })
  dateRange.value = []
  loadList()
}

async function loadList() {
  if (dateRange.value?.length === 2) {
    filterForm.startDate = dateRange.value[0]
    filterForm.endDate = dateRange.value[1]
  } else {
    filterForm.startDate = ''
    filterForm.endDate = ''
  }
  try {
    const res = await request.get('/reach-logs', { params: filterForm })
    list.value = res.list
    total.value = res.total
  } catch (e) {
    console.error(e)
  }
}

async function loadStats() {
  try {
    const res = await request.get('/reach-logs/stats')
    stats.value = res
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadList()
  loadStats()
})
</script>

<style lang="scss" scoped>
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-row {
  .stat-card {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .stat-label {
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 8px;
  }
  .stat-value {
    font-size: 28px;
    font-weight: bold;
    color: #1f2937;
  }
  .success .stat-value { color: #67c23a; }
  .danger .stat-value { color: #f56c6c; }
  .warning .stat-value { color: #e6a23c; }
}

.member-cell {
  display: flex;
  flex-direction: column;
  .name { font-size: 14px; color: #1f2937; }
  .phone { font-size: 12px; color: #9ca3af; margin-top: 2px; }
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.el-table {
  cursor: pointer;
}
</style>
