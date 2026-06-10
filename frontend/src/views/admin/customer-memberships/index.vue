<template>
  <div class="customer-memberships-page">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="顾客">
          <el-input v-model="filterForm.keyword" placeholder="姓名/手机号" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="有效" value="active" />
            <el-option label="已用完" value="used_up" />
            <el-option label="已过期" value="expired" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadRecords">查询</el-button>
          <el-button @click="handleSell">售卡</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <template #header>
        <span>会员记录</span>
      </template>

      <el-table :data="records" v-loading="loading" stripe>
        <el-table-column prop="customerName" label="顾客姓名" width="120" />
        <el-table-column prop="membershipName" label="会员卡" width="150" />
        <el-table-column label="剩余" width="150">
          <template #default="{ row }">
            <span v-if="row.remainingTimes !== undefined">
              {{ row.remainingTimes }} 次
            </span>
            <span v-else-if="row.remainingAmount !== undefined">
              ¥{{ row.remainingAmount }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="purchasePrice" label="购买金额" width="120">
          <template #default="{ row }">
            ¥{{ row.purchasePrice }}
          </template>
        </el-table-column>
        <el-table-column prop="expireDate" label="到期日期" width="120">
          <template #default="{ row }">
            {{ row.expireDate ? formatDate(row.expireDate) : '长期有效' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="购买时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'active'"
              type="primary"
              size="small"
              text
              @click="handleUse(row)"
            >
              使用
            </el-button>
            <el-button type="info" size="small" text @click="handleView(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="sellDialogVisible" title="售卖会员卡" width="500px">
      <el-form :model="sellForm" label-width="100px">
        <el-form-item label="会员卡" required>
          <el-select v-model="sellForm.membershipId" placeholder="请选择会员卡" style="width: 100%">
            <el-option
              v-for="m in memberships"
              :key="m._id"
              :label="m.name + '（¥' + m.price + '）'"
              :value="m._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="顾客姓名" required>
          <el-input v-model="sellForm.customerName" placeholder="请输入顾客姓名" />
        </el-form-item>
        <el-form-item label="顾客ID">
          <el-input v-model="sellForm.customerId" placeholder="请输入顾客ID（可选）" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="sellForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sellDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmSell">
          确认售卖
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="useDialogVisible" title="使用会员卡" width="400px">
      <el-form :model="useForm" label-width="100px">
        <el-form-item label="使用次数">
          <el-input-number v-model="useForm.times" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="扣除金额">
          <el-input-number v-model="useForm.amount" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="useDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmUse">
          确认使用
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getAllCustomerMemberships,
  sellMembership,
  useCustomerMembership,
} from '@/api/memberships'
import { getActiveMemberships } from '@/api/memberships'
import dayjs from 'dayjs'

const loading = ref(false)
const records = ref([])
const memberships = ref([])

const filterForm = reactive({
  keyword: '',
  status: '',
})

const sellDialogVisible = ref(false)
const useDialogVisible = ref(false)
const submitting = ref(false)
const currentRecord = ref(null)

const sellForm = reactive({
  membershipId: '',
  customerId: '',
  customerName: '',
  remark: '',
})

const useForm = reactive({
  times: 1,
  amount: 0,
})

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD')
}

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

function statusText(status) {
  const map = {
    active: '有效',
    used_up: '已用完',
    expired: '已过期',
  }
  return map[status] || status
}

function statusType(status) {
  const map = {
    active: 'success',
    used_up: 'info',
    expired: 'danger',
  }
  return map[status] || 'info'
}

async function loadRecords() {
  loading.value = true
  try {
    const params = {}
    if (filterForm.status) params.status = filterForm.status
    const data = await getAllCustomerMemberships(params)
    records.value = data
  } catch (e) {
    // 错误已处理
  } finally {
    loading.value = false
  }
}

async function loadMemberships() {
  try {
    const data = await getActiveMemberships()
    memberships.value = data
  } catch (e) {}
}

function handleSell() {
  sellForm.membershipId = ''
  sellForm.customerId = ''
  sellForm.customerName = ''
  sellForm.remark = ''
  sellDialogVisible.value = true
}

async function confirmSell() {
  if (!sellForm.membershipId) {
    ElMessage.warning('请选择会员卡')
    return
  }
  if (!sellForm.customerName) {
    ElMessage.warning('请输入顾客姓名')
    return
  }

  submitting.value = true
  try {
    await sellMembership(sellForm)
    ElMessage.success('售卖成功')
    sellDialogVisible.value = false
    loadRecords()
  } catch (e) {
    // 错误已处理
  } finally {
    submitting.value = false
  }
}

function handleUse(row) {
  currentRecord.value = row
  useForm.times = 1
  useForm.amount = 0
  useDialogVisible.value = true
}

async function confirmUse() {
  submitting.value = true
  try {
    await useCustomerMembership(currentRecord.value._id, {
      times: useForm.times,
      amount: useForm.amount,
    })
    ElMessage.success('使用成功')
    useDialogVisible.value = false
    loadRecords()
  } catch (e) {
    // 错误已处理
  } finally {
    submitting.value = false
  }
}

function handleView(row) {
  // 查看详情
}

onMounted(() => {
  loadRecords()
  loadMemberships()
})
</script>

<style scoped lang="scss">
.customer-memberships-page {
  .filter-card {
    margin-bottom: 20px;
  }
}
</style>
