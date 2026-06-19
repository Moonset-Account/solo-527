<template>
  <div>
    <PageHeader title="线索列表" subtitle="管理所有销售线索" />
    <a-card>
      <a-form layout="inline" class="mb-4">
        <a-form-item label="状态">
          <a-select v-model:value="filterStatus" placeholder="全部状态" allow-clear style="width: 120px">
            <a-select-option value="pending">待分配</a-select-option>
            <a-select-option value="assigned">已分配</a-select-option>
            <a-select-option value="following">跟进中</a-select-option>
            <a-select-option value="converted">已转化</a-select-option>
            <a-select-option value="lost">已流失</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="来源">
          <a-select v-model:value="filterSource" placeholder="全部来源" allow-clear style="width: 120px">
            <a-select-option value="online">线上推广</a-select-option>
            <a-select-option value="offline">线下活动</a-select-option>
            <a-select-option value="referral">客户推荐</a-select-option>
            <a-select-option value="walkin">到店咨询</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="搜索">
          <a-input-search v-model:value="keyword" placeholder="客户姓名/手机号" style="width: 200px" @search="fetchList" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="fetchList">查询</a-button>
          <a-button style="margin-left: 8px" @click="resetFilter">重置</a-button>
        </a-form-item>
      </a-form>

      <div class="mb-4">
        <a-button type="primary" :disabled="selectedRowKeys.length === 0" @click="showBatchAssignModal">
          批量分配 ({{ selectedRowKeys.length }})
        </a-button>
      </div>

      <a-table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="pagination"
        :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <StatusTag :status="record.status" type="lead" />
          </template>
          <template v-else-if="column.key === 'createdAt'">
            {{ formatDate(record.createdAt) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="viewDetail(record)">查看</a-button>
            <a-button type="link" size="small" @click="showAssignModal(record)">分配</a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="assignModalOpen" title="分配线索" @ok="handleAssign">
      <a-form layout="vertical">
        <a-form-item label="选择顾问">
          <a-select v-model:value="selectedAdvisor" placeholder="请选择顾问" style="width: 100%">
            <a-select-option v-for="advisor in advisorList" :key="advisor.id" :value="advisor">
              {{ advisor.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="detailModalOpen" title="线索详情" :footer="null">
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="客户姓名">{{ currentLead?.customerName }}</a-descriptions-item>
        <a-descriptions-item label="手机号">{{ currentLead?.customerPhone }}</a-descriptions-item>
        <a-descriptions-item label="来源">{{ currentLead?.source }}</a-descriptions-item>
        <a-descriptions-item label="意向">{{ currentLead?.intention }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <StatusTag :status="currentLead?.status || ''" type="lead" />
        </a-descriptions-item>
        <a-descriptions-item label="负责人">{{ currentLead?.assigneeName || '-' }}</a-descriptions-item>
        <a-descriptions-item label="预算">{{ currentLead?.budget || '-' }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ formatDate(currentLead?.createdAt) }}</a-descriptions-item>
        <a-descriptions-item label="备注" :span="2">{{ currentLead?.remark || '-' }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import { getLeadList, assignLead, batchAssignLeads } from '@/api/leads'
import { getAdvisorList } from '@/api/auth'
import type { Lead, User, PaginationParams } from '@/types'

const loading = ref(false)
const list = ref<Lead[]>([])
const keyword = ref('')
const filterStatus = ref<string | undefined>()
const filterSource = ref<string | undefined>()
const selectedRowKeys = ref<number[]>([])
const advisorList = ref<User[]>([])
const assignModalOpen = ref(false)
const detailModalOpen = ref(false)
const currentLead = ref<Lead | null>(null)
const selectedAdvisor = ref<User | null>(null)
const isBatchAssign = ref(false)

const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`
})

const columns = [
  { title: '客户姓名', dataIndex: 'customerName', key: 'customerName' },
  { title: '手机号', dataIndex: 'customerPhone', key: 'customerPhone' },
  { title: '来源', dataIndex: 'source', key: 'source' },
  { title: '意向', dataIndex: 'intention', key: 'intention' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '负责人', dataIndex: 'assigneeName', key: 'assigneeName' },
  { title: '创建时间', key: 'createdAt' },
  { title: '操作', key: 'action', width: 120 }
]

const formatDate = (date?: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const fetchList = async () => {
  loading.value = true
  try {
    const params: PaginationParams = {
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
      keyword: keyword.value
    }
    if (filterStatus.value) params.status = filterStatus.value
    if (filterSource.value) params.source = filterSource.value
    const res = await getLeadList(params)
    list.value = res.list
    pagination.value.total = res.total
  } finally {
    loading.value = false
  }
}

const fetchAdvisors = async () => {
  advisorList.value = await getAdvisorList()
}

const resetFilter = () => {
  keyword.value = ''
  filterStatus.value = undefined
  filterSource.value = undefined
  pagination.value.current = 1
  fetchList()
}

const handleTableChange = (pag: any) => {
  pagination.value.current = pag.current
  pagination.value.pageSize = pag.pageSize
  fetchList()
}

const onSelectChange = (keys: number[]) => {
  selectedRowKeys.value = keys
}

const viewDetail = (record: Lead) => {
  currentLead.value = record
  detailModalOpen.value = true
}

const showAssignModal = (record: Lead) => {
  currentLead.value = record
  selectedAdvisor.value = null
  isBatchAssign.value = false
  assignModalOpen.value = true
}

const showBatchAssignModal = () => {
  selectedAdvisor.value = null
  isBatchAssign.value = true
  assignModalOpen.value = true
}

const handleAssign = async () => {
  if (!selectedAdvisor.value) {
    message.warning('请选择顾问')
    return
  }
  try {
    if (isBatchAssign.value) {
      await batchAssignLeads({
        leadIds: selectedRowKeys.value,
        assigneeId: selectedAdvisor.value.id,
        assigneeName: selectedAdvisor.value.name
      })
      message.success('批量分配成功')
    } else {
      await assignLead(currentLead.value!.id, {
        assigneeId: selectedAdvisor.value.id,
        assigneeName: selectedAdvisor.value.name
      })
      message.success('分配成功')
    }
    assignModalOpen.value = false
    selectedRowKeys.value = []
    fetchList()
  } catch (e) {
    message.error('分配失败')
  }
}

onMounted(() => {
  fetchList()
  fetchAdvisors()
})
</script>
