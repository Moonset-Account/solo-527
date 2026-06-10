<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">人员管理</h2>
      <el-button type="primary" @click="showEdit = true"><el-icon><Plus /></el-icon> 新增人员</el-button>
    </div>
    <div class="section-card">
      <div class="card-body">
        <div class="search-bar">
          <el-select v-model="filterType" placeholder="全部类型" clearable style="width:140px" @change="fetchList">
            <el-option label="医生" value="doctor" />
            <el-option label="技师" value="technician" />
          </el-select>
          <el-select v-model="filterActive" placeholder="全部状态" clearable style="width:140px" @change="fetchList">
            <el-option label="在岗" value="1" />
            <el-option label="离岗" value="0" />
          </el-select>
        </div>
        <el-table :data="list" v-loading="loading" stripe style="width:100%">
          <el-table-column label="人员" width="200">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;gap:10px">
                <el-avatar :size="40" :style="row.type === 'doctor' ? {background:'#6c7ae0'} : {background:'#2ab99f'}">{{ row.name?.[0] }}</el-avatar>
                <div>
                  <div style="font-weight:500">{{ row.name }}</div>
                  <div style="font-size:12px;color:#909399">{{ row.title || (row.type === 'doctor' ? '医生' : '技师') }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.type === 'doctor' ? 'primary' : 'success'" effect="light">
                {{ row.type === 'doctor' ? '医生' : '技师' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="phone" label="联系电话" width="140" />
          <el-table-column prop="specialties" label="专业特长" min-width="200" show-overflow-tooltip />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.is_active" type="success" effect="light">在岗</el-tag>
              <el-tag v-else type="info" effect="plain">离岗</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="goSchedule(row)">排班</el-button>
              <el-button link type="warning" size="small" @click="edit(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog v-model="showEdit" :title="editing.id ? '编辑人员' : '新增人员'" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="editing" :rules="formRules" label-width="90px">
        <el-form-item label="姓名" prop="name"><el-input v-model="editing.name" maxlength="50" /></el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="editing.type" style="width:100%">
            <el-option label="医生" value="doctor" /><el-option label="技师" value="technician" />
          </el-select>
        </el-form-item>
        <el-form-item label="职称"><el-input v-model="editing.title" maxlength="50" /></el-form-item>
        <el-form-item label="联系电话"><el-input v-model="editing.phone" maxlength="20" /></el-form-item>
        <el-form-item label="专业特长"><el-input v-model="editing.specialties" type="textarea" :rows="2" maxlength="200" /></el-form-item>
        <el-form-item label="是否在岗">
          <el-switch v-model="editing.isActive" />
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
import { Plus } from '@element-plus/icons-vue'
import { getStaffList, createStaff, updateStaff, deleteStaff } from '@/api/staff'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const showEdit = ref(false)
const formRef = ref<FormInstance>()
const list = ref<any[]>([])
const filterType = ref('')
const filterActive = ref('')

const editing = reactive<any>({ id: null, name: '', type: 'doctor', title: '', phone: '', specialties: '', isActive: true })
const formRules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getStaffList({ type: filterType.value || undefined, active: filterActive.value || undefined })
    list.value = res.data
  } finally { loading.value = false }
}

const goSchedule = (row: any) => { router.push('/staff-schedule') }
const edit = (row: any) => {
  editing.id = row.id
  editing.name = row.name
  editing.type = row.type
  editing.title = row.title || ''
  editing.phone = row.phone || ''
  editing.specialties = row.specialties || ''
  editing.isActive = row.is_active
  showEdit.value = true
}
const submitEdit = async () => {
  await formRef.value?.validate()
  submitting.value = true
  try {
    if (editing.id) {
      await updateStaff(editing.id, { ...editing })
      ElMessage.success('更新成功')
    } else {
      await createStaff({ ...editing })
      ElMessage.success('创建成功')
    }
    showEdit.value = false
    fetchList()
  } finally { submitting.value = false }
}
const remove = async (row: any) => {
  await ElMessageBox.confirm(`确认删除「${row.name}」吗？`, '提示', { type: 'warning' })
  await deleteStaff(row.id)
  ElMessage.success('已删除')
  fetchList()
}
onMounted(fetchList)
</script>
