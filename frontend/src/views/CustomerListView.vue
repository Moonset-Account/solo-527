<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">客户管理</h2>
      <div style="display:flex;gap:10px">
        <el-button type="primary" @click="showEdit = true">
          <el-icon><Plus /></el-icon> 新增客户
        </el-button>
      </div>
    </div>
    <div class="section-card">
      <div class="card-body">
        <div class="search-bar">
          <el-input v-model="keyword" placeholder="姓名/手机号" clearable style="width:240px" :prefix-icon="Search" @keyup.enter="fetchList" @clear="fetchList" />
          <el-select v-model="sortBy" style="width:180px" @change="fetchList">
            <el-option label="爽约率 从高到低" value="-noShowRate" />
            <el-option label="爽约率 从低到高" value="noShowRate" />
            <el-option label="总预约数 从高到低" value="-totalBookings" />
            <el-option label="最近访问 从近到远" value="-lastVisit" />
          </el-select>
          <el-button type="primary" @click="fetchList"><el-icon><Search /></el-icon> 查询</el-button>
        </div>
        <el-table :data="list" v-loading="loading" stripe style="width:100%">
          <el-table-column type="index" label="#" width="60" />
          <el-table-column label="姓名" width="120">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;gap:8px">
                <el-avatar :size="30" style="background:#e6f7f3;color:#2ab99f">{{ row.name?.[0] }}</el-avatar>
                <span>{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="phone" label="手机号" width="140" />
          <el-table-column label="性别/年龄" width="110">
            <template #default="{ row }">
              {{ row.gender || '-' }} / {{ row.age || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="爽约统计" width="220">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;gap:8px">
                <el-tag :type="(row.no_show_rate || 0) >= 0.3 ? 'danger' : (row.no_show_rate >= 0.15 ? 'warning' : 'success')" size="small">
                  {{ ((row.no_show_rate || 0) * 100).toFixed(1) }}%
                </el-tag>
                <el-progress :percentage="Math.round((row.no_show_rate || 0) * 100)" :stroke-width="8" style="width:100px;--el-progress-color: (row.no_show_rate || 0) >= 0.3 ? '#f56c6c' : (row.no_show_rate >= 0.15 ? '#e6a23c' : '#67c23a')" :show-text="false" />
                <span style="font-size:12px;color:#909399">{{ row.no_show_count }}/{{ row.total_bookings }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="最近就诊" width="160">
            <template #default="{ row }">{{ row.last_visit ? formatTime(row.last_visit) : '-' }}</template>
          </el-table-column>
          <el-table-column label="病史" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <el-tag v-if="row.medical_history" size="small" type="warning" effect="light">{{ row.medical_history }}</el-tag>
              <span v-else style="color:#c0c4cc">无</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="viewBooking(row)">预约记录</el-button>
              <el-button link type="warning" size="small" @click="edit(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div style="display:flex;justify-content:flex-end;margin-top:20px">
          <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.perPage" :page-sizes="[10,20,50]" :total="pagination.total" layout="total, sizes, prev, pager, next, jumper" @size-change="fetchList" @current-change="fetchList" />
        </div>
      </div>
    </div>

    <el-dialog v-model="showEdit" :title="editing.id ? '编辑客户' : '新增客户'" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="editing" :rules="formRules" label-width="90px">
        <el-form-item label="姓名" prop="name"><el-input v-model="editing.name" maxlength="50" /></el-form-item>
        <el-form-item label="手机号" prop="phone"><el-input v-model="editing.phone" maxlength="20" /></el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="editing.gender">
            <el-radio value="男">男</el-radio><el-radio value="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="年龄"><el-input-number v-model="editing.age" :min="0" :max="150" /></el-form-item>
        <el-form-item label="病史">
          <el-input v-model="editing.medicalHistory" type="textarea" :rows="3" maxlength="500" placeholder="病史、过敏史等" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitEdit">确认保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { getCustomerList, createCustomer, updateCustomer, deleteCustomer } from '@/api/customer'
import dayjs from 'dayjs'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const showEdit = ref(false)
const formRef = ref<FormInstance>()
const list = ref<any[]>([])
const keyword = ref('')
const sortBy = ref('-noShowRate')
const pagination = reactive({ page: 1, perPage: 20, total: 0 })
const editing = reactive<any>({ id: null, name: '', phone: '', gender: '', age: null, medicalHistory: '' })
const formRules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
}
const formatTime = (t: string) => t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'
const fetchList = async () => {
  loading.value = true
  try {
    const res = await getCustomerList({
      keyword: keyword.value || undefined,
      sort: sortBy.value,
      page: pagination.page, perPage: pagination.perPage,
    })
    list.value = res.data.data
    pagination.total = res.data.meta.total
  } finally { loading.value = false }
}
const viewBooking = (row: any) => { router.push({ path: '/bookings', query: { customerId: row.id } }) }
const edit = (row: any) => {
  editing.id = row.id
  editing.name = row.name
  editing.phone = row.phone
  editing.gender = row.gender || ''
  editing.age = row.age
  editing.medicalHistory = row.medical_history || ''
  showEdit.value = true
}
const submitEdit = async () => {
  await formRef.value?.validate()
  submitting.value = true
  try {
    if (editing.id) {
      await updateCustomer(editing.id, { ...editing })
      ElMessage.success('更新成功')
    } else {
      await createCustomer({ ...editing })
      ElMessage.success('创建成功')
    }
    showEdit.value = false
    fetchList()
  } finally { submitting.value = false }
}
const remove = async (row: any) => {
  await ElMessageBox.confirm(`确认删除客户「${row.name}」吗？`, '提示', { type: 'warning' })
  await deleteCustomer(row.id)
  ElMessage.success('已删除')
  fetchList()
}
onMounted(fetchList)
</script>
