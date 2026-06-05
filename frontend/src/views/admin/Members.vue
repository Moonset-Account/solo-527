<template>
  <div class="admin-members">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>会员管理</span>
          <div class="header-actions">
            <el-input
              v-model="keyword"
              placeholder="搜索姓名/手机号"
              style="width: 250px; margin-right: 12px;"
              clearable
              @keyup.enter="loadMembers"
            >
              <template #append>
                <el-button icon="Search" @click="loadMembers" />
              </template>
            </el-input>
            <el-select v-model="filterLevel" placeholder="会员等级" style="width: 120px; margin-right: 12px;" clearable @change="loadMembers">
              <el-option v-for="lvl in levels" :key="lvl.id" :label="lvl.name" :value="lvl.id" />
            </el-select>
            <el-button type="primary" icon="Plus" @click="openDialog()">新增会员</el-button>
          </div>
        </div>
      </template>

      <el-table :data="members" v-loading="loading" stripe border>
        <el-table-column prop="member_no" label="会员号" width="140" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column label="手机号" width="140">
          <template #default="{ row }">{{ row.phone_display || row.phone }}</template>
        </el-table-column>
        <el-table-column label="等级" width="120">
          <template #default="{ row }">
            <el-tag :type="levelTagType(row.level)" size="small">{{ row.level_name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="积分" width="100" align="right">
          <template #default="{ row }" style="font-weight: bold; color: #409eff;">{{ row.points }}</template>
        </el-table-column>
        <el-table-column label="累计消费" width="120" align="right">
          <template #default="{ row }">¥{{ row.total_spent }}</template>
        </el-table-column>
        <el-table-column prop="join_date" label="入会日期" width="120" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">
              {{ row.is_active ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
            <el-button type="success" link size="small" @click="openPointsDialog(row)">调整积分</el-button>
            <el-button type="warning" link size="small" @click="viewPointsHistory(row)">积分历史</el-button>
            <el-button :type="row.is_active ? 'danger' : 'success'" link size="small" @click="toggleStatus(row)">
              {{ row.is_active ? '停用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadMembers"
          @current-change="loadMembers"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑会员' : '新增会员'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="form.email" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别">
              <el-radio-group v-model="form.gender">
                <el-radio label="male">男</el-radio>
                <el-radio label="female">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生日">
              <el-date-picker v-model="form.birthday" type="date" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="等级">
              <el-select v-model="form.level_id" style="width: 100%;">
                <el-option v-for="lvl in levels" :key="lvl.id" :label="lvl.name" :value="lvl.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="地址">
              <el-input v-model="form.address" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveMember">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="pointsDialogVisible" title="调整积分" width="400px">
      <el-form label-width="80px">
        <el-form-item label="当前积分">
          <span style="font-size: 20px; font-weight: bold; color: #409eff;">{{ currentMember?.points }}</span>
        </el-form-item>
        <el-form-item label="调整类型">
          <el-radio-group v-model="pointsForm.type">
            <el-radio label="add">增加</el-radio>
            <el-radio label="subtract">减少</el-radio>
            <el-radio label="set">设置为</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="pointsForm.points" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="pointsForm.reason" placeholder="如：消费奖励、活动奖励、积分兑换等" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pointsDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="adjustPoints">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="historyDialogVisible" title="积分历史" width="700px">
      <el-table :data="pointsHistory" v-loading="historyLoading" stripe size="small">
        <el-table-column prop="created_at" label="时间" width="180" />
        <el-table-column prop="change_type_display" label="类型" width="100" />
        <el-table-column prop="points_change" label="变动" width="80" align="right">
          <template #default="{ row }">
            <span :style="{ color: row.points_change >= 0 ? '#52c41a' : '#ff4d4f' }">
              {{ row.points_change >= 0 ? '+' : '' }}{{ row.points_change }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="balance_after" label="变动后" width="100" align="right" />
        <el-table-column prop="reason" label="原因" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/utils/request'

const loading = ref(false)
const historyLoading = ref(false)
const members = ref([])
const levels = ref([])
const keyword = ref('')
const filterLevel = ref('')
const dialogVisible = ref(false)
const pointsDialogVisible = ref(false)
const historyDialogVisible = ref(false)
const currentMember = ref(null)
const pointsHistory = ref([])
const formRef = ref(null)

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const form = reactive({
  id: null, name: '', phone: '', email: '', gender: 'male',
  birthday: null, level_id: null, address: '', remark: ''
})

const pointsForm = reactive({
  type: 'add',
  points: 0,
  reason: ''
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
}

const levelTagType = (level) => {
  const types = { 1: 'info', 2: 'success', 3: 'warning', 4: 'danger' }
  return types[level] || 'info'
}

const loadMembers = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/members/members/', {
      params: {
        page: pagination.page,
        page_size: pagination.page_size,
        search: keyword.value,
        level: filterLevel.value
      }
    })
    members.value = data.results
    pagination.total = data.count
  } finally {
    loading.value = false
  }
}

const loadLevels = async () => {
  const { data } = await api.get('/members/levels/')
  levels.value = data.results
  if (levels.value.length > 0 && !form.level_id) {
    form.level_id = levels.value[0].id
  }
}

const openDialog = (row = null) => {
  if (row) {
    Object.assign(form, {
      id: row.id, name: row.name, phone: row.phone, email: row.email || '',
      gender: row.gender || 'male', birthday: row.birthday,
      level_id: row.level?.id || row.level_id,
      address: row.address || '', remark: row.remark || ''
    })
  } else {
    Object.assign(form, {
      id: null, name: '', phone: '', email: '', gender: 'male',
      birthday: null, level_id: levels.value[0]?.id, address: '', remark: ''
    })
  }
  dialogVisible.value = true
}

const saveMember = async () => {
  await formRef.value.validate()
  try {
    if (form.id) {
      await api.put(`/members/members/${form.id}/`, form)
      ElMessage.success('更新成功')
    } else {
      await api.post('/members/members/', form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadMembers()
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const openPointsDialog = (row) => {
  currentMember.value = row
  pointsForm.type = 'add'
  pointsForm.points = 0
  pointsForm.reason = ''
  pointsDialogVisible.value = true
}

const adjustPoints = async () => {
  try {
    await api.post(`/members/members/${currentMember.value.id}/adjust_points/`, pointsForm)
    ElMessage.success('积分调整成功')
    pointsDialogVisible.value = false
    loadMembers()
  } catch (e) {
    ElMessage.error('调整失败')
  }
}

const viewPointsHistory = async (row) => {
  historyLoading.value = true
  try {
    const { data } = await api.get(`/members/members/${row.id}/points_history/`)
    pointsHistory.value = data.results || data
    historyDialogVisible.value = true
  } finally {
    historyLoading.value = false
  }
}

const toggleStatus = async (row) => {
  try {
    const newStatus = !row.is_active
    await api.patch(`/members/members/${row.id}/`, { is_active: newStatus })
    ElMessage.success('操作成功')
    loadMembers()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadMembers()
  loadLevels()
})
</script>

<style lang="scss" scoped>
.admin-members {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    
    .header-actions {
      display: flex;
      align-items: center;
    }
  }
  
  .pagination {
    margin-top: 20px;
    text-align: right;
  }
}
</style>
