<template>
  <div class="memberships-page">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="类型">
          <el-select v-model="filterForm.type" placeholder="全部" clearable style="width: 120px">
            <el-option label="次卡" value="times" />
            <el-option label="储值卡" value="amount" />
            <el-option label="时长卡" value="duration" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="上架" value="active" />
            <el-option label="下架" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadMemberships">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>会员卡列表</span>
          <el-button type="primary" @click="handleAdd">新增会员卡</el-button>
        </div>
      </template>

      <el-table :data="memberships" v-loading="loading" stripe>
        <el-table-column prop="name" label="卡名称" min-width="150" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ typeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="售价" width="100">
          <template #default="{ row }">
            <span class="price">¥{{ row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column label="价值" width="120">
          <template #default="{ row }">
            <span v-if="row.type === 'times'">{{ row.totalTimes }}次</span>
            <span v-else-if="row.type === 'amount'">¥{{ row.totalAmount }}</span>
            <span v-else-if="row.type === 'duration'">{{ row.durationDays }}天</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" text @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="membershipForm" label-width="100px">
        <el-form-item label="卡名称" required>
          <el-input v-model="membershipForm.name" placeholder="请输入卡名称" />
        </el-form-item>
        <el-form-item label="类型" required>
          <el-select v-model="membershipForm.type" style="width: 100%" @change="handleTypeChange">
            <el-option label="次卡" value="times" />
            <el-option label="储值卡" value="amount" />
            <el-option label="时长卡" value="duration" />
          </el-select>
        </el-form-item>
        <el-form-item label="售价" required>
          <el-input-number v-model="membershipForm.price" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="原价">
          <el-input-number v-model="membershipForm.originalPrice" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="membershipForm.type === 'times'" label="总次数" required>
          <el-input-number v-model="membershipForm.totalTimes" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="membershipForm.type === 'amount'" label="储值金额" required>
          <el-input-number v-model="membershipForm.totalAmount" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="membershipForm.type === 'duration'" label="有效天数" required>
          <el-input-number v-model="membershipForm.durationDays" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="适用服务">
          <el-select
            v-model="membershipForm.serviceIds"
            multiple
            placeholder="选择适用服务（不选表示全部）"
            style="width: 100%"
          >
            <el-option
              v-for="service in services"
              :key="service._id"
              :label="service.name"
              :value="service._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="membershipForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="membershipForm.status">
            <el-radio value="active">上架</el-radio>
            <el-radio value="inactive">下架</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="membershipForm.sort" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getMemberships,
  createMembership,
  updateMembership,
  deleteMembership,
} from '@/api/memberships'
import { getActiveServices } from '@/api/services'

const loading = ref(false)
const memberships = ref([])
const services = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增会员卡')
const submitting = ref(false)
const editingId = ref('')

const filterForm = reactive({
  type: '',
  status: '',
})

const membershipForm = reactive({
  name: '',
  type: 'times',
  price: 0,
  originalPrice: 0,
  totalTimes: 0,
  totalAmount: 0,
  durationDays: 30,
  serviceIds: [],
  description: '',
  status: 'active',
  sort: 0,
})

function typeText(type) {
  const map = {
    times: '次卡',
    amount: '储值卡',
    duration: '时长卡',
  }
  return map[type] || type
}

async function loadMemberships() {
  loading.value = true
  try {
    const params = {}
    if (filterForm.type) params.type = filterForm.type
    if (filterForm.status) params.status = filterForm.status
    const data = await getMemberships(params)
    memberships.value = data
  } catch (e) {
    // 错误已处理
  } finally {
    loading.value = false
  }
}

async function loadServices() {
  try {
    const data = await getActiveServices()
    services.value = data
  } catch (e) {}
}

function resetFilter() {
  filterForm.type = ''
  filterForm.status = ''
  loadMemberships()
}

function handleTypeChange() {
  if (membershipForm.type === 'times') {
    membershipForm.totalTimes = 10
    membershipForm.totalAmount = 0
    membershipForm.durationDays = 0
  } else if (membershipForm.type === 'amount') {
    membershipForm.totalTimes = 0
    membershipForm.totalAmount = 1000
    membershipForm.durationDays = 0
  } else if (membershipForm.type === 'duration') {
    membershipForm.totalTimes = 0
    membershipForm.totalAmount = 0
    membershipForm.durationDays = 30
  }
}

function handleAdd() {
  dialogTitle.value = '新增会员卡'
  editingId.value = ''
  membershipForm.name = ''
  membershipForm.type = 'times'
  membershipForm.price = 0
  membershipForm.originalPrice = 0
  membershipForm.totalTimes = 10
  membershipForm.totalAmount = 0
  membershipForm.durationDays = 30
  membershipForm.serviceIds = []
  membershipForm.description = ''
  membershipForm.status = 'active'
  membershipForm.sort = 0
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = '编辑会员卡'
  editingId.value = row._id
  membershipForm.name = row.name
  membershipForm.type = row.type
  membershipForm.price = row.price
  membershipForm.originalPrice = row.originalPrice || 0
  membershipForm.totalTimes = row.totalTimes || 0
  membershipForm.totalAmount = row.totalAmount || 0
  membershipForm.durationDays = row.durationDays || 0
  membershipForm.serviceIds = row.serviceIds || []
  membershipForm.description = row.description || ''
  membershipForm.status = row.status
  membershipForm.sort = row.sort || 0
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!membershipForm.name) {
    ElMessage.warning('请输入卡名称')
    return
  }

  submitting.value = true
  try {
    const data = { ...membershipForm }
    if (editingId.value) {
      await updateMembership(editingId.value, data)
      ElMessage.success('更新成功')
    } else {
      await createMembership(data)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadMemberships()
  } catch (e) {
    // 错误已处理
  } finally {
    submitting.value = false
  }
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除「${row.name}」吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await deleteMembership(row._id)
      ElMessage.success('删除成功')
      loadMemberships()
    } catch (e) {}
  }).catch(() => {})
}

onMounted(() => {
  loadMemberships()
  loadServices()
})
</script>

<style scoped lang="scss">
.memberships-page {
  .filter-card {
    margin-bottom: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .price {
    color: #e91e63;
    font-weight: bold;
  }
}
</style>
