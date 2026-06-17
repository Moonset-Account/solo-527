<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">审核预约</h2>
    </div>

    <div class="card-shadow">
      <el-tabs v-model="statusTab" @tab-change="loadData">
        <el-tab-pane label="待审核" name="pending" />
        <el-tab-pane label="已通过" name="approved" />
        <el-tab-pane label="已驳回" name="rejected" />
        <el-tab-pane label="已领取" name="picked" />
        <el-tab-pane label="全部" name="" />
      </el-tabs>

      <div class="filter-bar">
        <el-input v-model="filter.keyword" placeholder="搜索单号/申请人/用途" clearable style="width: 240px" />
        <el-select v-model="filter.applicantId" placeholder="申请人" clearable filterable style="width: 160px">
          <el-option v-for="u in users" :key="u._id" :label="u.realName" :value="u._id" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始"
          end-placeholder="结束"
          value-format="YYYY-MM-DD"
        />
        <el-button type="primary" @click="loadData">查询</el-button>
      </div>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="applicationNo" label="申请单号" width="180" />
        <el-table-column prop="applicantName" label="申请人" width="100" />
        <el-table-column prop="applicantDepartment" label="部门" width="120" />
        <el-table-column prop="purpose" label="用途" show-overflow-tooltip />
        <el-table-column label="试剂项" width="100">
          <template #default="{ row }">{{ row.items?.length || 0 }} 项</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="ApplicationStatusType[row.status] as any">
              {{ ApplicationStatusLabel[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="提交时间" width="180">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/portal/applications/${row._id}`)">详情</el-button>
            <el-button
              v-if="row.status === 'pending'"
              link
              type="success"
              @click="handleApprove(row)"
            >通过</el-button>
            <el-button
              v-if="row.status === 'pending'"
              link
              type="danger"
              @click="handleReject(row)"
            >驳回</el-button>
            <el-button
              v-if="row.status === 'approved'"
              link
              type="primary"
              @click="handlePick(row)"
            >确认发放</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 16px"
        background
        @size-change="loadData"
        @current-change="loadData"
      />
    </div>

    <el-dialog v-model="showRejectDialog" title="驳回申请" width="500px">
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="驳回原因">
          <el-input v-model="rejectForm.reason" type="textarea" :rows="4" placeholder="请输入驳回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="danger" :loading="submitting" @click="submitReject">确认驳回</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPickDialog" title="确认发放试剂" width="600px">
      <el-alert type="info" show-icon style="margin-bottom: 16px">请核对每项试剂的实际发放数量</el-alert>
      <el-table :data="pickForm.items" border>
        <el-table-column prop="reagentName" label="试剂" />
        <el-table-column prop="specification" label="规格" />
        <el-table-column label="申请数量">
          <template #default="{ row }">{{ row.quantity }} {{ row.unit }}</template>
        </el-table-column>
        <el-table-column label="实发数量" width="200">
          <template #default="{ row }">
            <el-input-number v-model="row.actualQuantity" :min="0" :precision="3" />
            <span style="margin-left: 4px">{{ row.unit }}</span>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="showPickDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitPick">确认发放</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { applicationApi, userApi } from '@/api'
import { ApplicationStatusLabel, ApplicationStatusType, type Application, type User } from '@/types'
import dayjs from 'dayjs'

const loading = ref(false)
const submitting = ref(false)
const list = ref<Application[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const statusTab = ref('pending')
const users = ref<User[]>([])
const dateRange = ref<string[]>([])

const filter = reactive({
  keyword: '',
  applicantId: '',
})

const showRejectDialog = ref(false)
const showPickDialog = ref(false)
const currentRow = ref<Application | null>(null)

const rejectForm = reactive({ reason: '' })
const pickForm = reactive({ items: [] as any[] })

function formatDate(d: string) {
  return d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-'
}

async function loadData() {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
      status: statusTab.value || undefined,
    }
    if (filter.keyword) params.keyword = filter.keyword
    if (filter.applicantId) params.applicantId = filter.applicantId
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await applicationApi.list(params)
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function handleApprove(row: Application) {
  try {
    await ElMessageBox.confirm(`确定通过申请 ${row.applicationNo}？`, '提示', { type: 'success' })
    await applicationApi.approve(row._id, { remark: '' })
    ElMessage.success('已通过')
    loadData()
  } catch {}
}

function handleReject(row: Application) {
  currentRow.value = row
  rejectForm.reason = ''
  showRejectDialog.value = true
}

async function submitReject() {
  if (!currentRow.value || !rejectForm.reason) {
    ElMessage.warning('请输入驳回原因')
    return
  }
  submitting.value = true
  try {
    await applicationApi.reject(currentRow.value._id, { reason: rejectForm.reason })
    ElMessage.success('已驳回')
    showRejectDialog.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

function handlePick(row: Application) {
  currentRow.value = row
  pickForm.items = row.items.map((i) => ({
    reagentId: i.reagentId,
    reagentName: i.reagentName,
    specification: i.specification,
    quantity: i.quantity,
    unit: i.unit,
    actualQuantity: i.quantity,
  }))
  showPickDialog.value = true
}

async function submitPick() {
  if (!currentRow.value) return
  submitting.value = true
  try {
    await applicationApi.pick(currentRow.value._id, {
      items: pickForm.items.map((i) => ({ reagentId: i.reagentId, actualQuantity: i.actualQuantity })),
    })
    ElMessage.success('发放完成，库存已扣减')
    showPickDialog.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  loadData()
  try {
    const res = await userApi.list({ pageSize: 1000, page: 1 })
    users.value = res.list
  } catch {}
})
</script>
