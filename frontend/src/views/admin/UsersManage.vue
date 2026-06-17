<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">用户权限管理</h2>
      <el-button type="primary" @click="showDialog = true">
        <el-icon><Plus /></el-icon>新增用户
      </el-button>
    </div>

    <div class="card-shadow">
      <div class="filter-bar">
        <el-input v-model="filter.keyword" placeholder="搜索用户名/姓名" clearable style="width: 240px" />
        <el-select v-model="filter.department" placeholder="部门" clearable style="width: 160px">
          <el-option v-for="d in deptDict" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
        <el-button type="primary" @click="loadData">查询</el-button>
      </div>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="realName" label="姓名" width="100" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="phone" label="手机" width="130" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="laboratory" label="实验室" width="120" />
        <el-table-column prop="position" label="岗位" width="100" />
        <el-table-column label="角色" width="220">
          <template #default="{ row }">
            <el-tag v-for="role in row.roles" :key="role" style="margin-right: 4px">
              {{ roleLabel(role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button
              v-if="row.isActive"
              link
              type="danger"
              @click="handleDisable(row)"
            >禁用</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        style="margin-top: 16px"
        background
        @current-change="loadData"
      />
    </div>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑用户' : '新增用户'" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="form.username" :disabled="isEdit" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="密码" prop="password" v-if="!isEdit">
              <el-input v-model="form.password" type="password" show-password />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" prop="realName">
              <el-input v-model="form.realName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="form.email" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机">
              <el-input v-model="form.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门">
              <el-select v-model="form.department" style="width: 100%">
                <el-option v-for="d in deptDict" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="实验室">
              <el-select v-model="form.laboratory" style="width: 100%">
                <el-option v-for="l in labDict" :key="l.value" :label="l.label" :value="l.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="岗位">
              <el-select v-model="form.position" style="width: 100%">
                <el-option v-for="p in posDict" :key="p.value" :label="p.label" :value="p.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="角色" prop="roles">
              <el-select v-model="form.roles" multiple style="width: 100%">
                <el-option label="超级管理员" value="super_admin" />
                <el-option label="管理员" value="admin" />
                <el-option label="试剂管理员" value="reagent_manager" />
                <el-option label="实验室主管" value="lab_manager" />
                <el-option label="研究员" value="researcher" />
                <el-option label="普通用户" value="user" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { userApi, configApi } from '@/api'
import { UserRole, type User, type DictionaryItem } from '@/types'
import { Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const submitting = ref(false)
const list = ref<User[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const showDialog = ref(false)
const isEdit = ref(false)
const editId = ref('')

const deptDict = ref<DictionaryItem[]>([])
const labDict = ref<DictionaryItem[]>([])
const posDict = ref<DictionaryItem[]>([])

const filter = reactive({ keyword: '', department: '' })

const formRef = ref<FormInstance>()
const form = reactive<any>({
  username: '', password: '', realName: '', email: '', phone: '',
  department: '', laboratory: '', position: '', roles: ['user'], isActive: true,
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  roles: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    [UserRole.SUPER_ADMIN]: '超级管理员',
    [UserRole.ADMIN]: '管理员',
    [UserRole.REAGENT_MANAGER]: '试剂管理员',
    [UserRole.LAB_MANAGER]: '实验室主管',
    [UserRole.RESEARCHER]: '研究员',
    [UserRole.USER]: '普通用户',
  }
  return map[role] || role
}

function resetForm() {
  Object.assign(form, {
    username: '', password: '', realName: '', email: '', phone: '',
    department: '', laboratory: '', position: '', roles: ['user'], isActive: true,
  })
}

async function loadData() {
  loading.value = true
  try {
    const res = await userApi.list({ ...filter, page: page.value, pageSize: pageSize.value })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function handleEdit(row: User) {
  isEdit.value = true
  editId.value = row._id
  Object.assign(form, {
    username: row.username,
    realName: row.realName,
    email: row.email || '',
    phone: row.phone || '',
    department: row.department || '',
    laboratory: row.laboratory || '',
    position: row.position || '',
    roles: row.roles,
    isActive: row.isActive,
  })
  showDialog.value = true
}

async function handleDisable(row: User) {
  try {
    await ElMessageBox.confirm(`确定禁用用户 ${row.username}？`, '提示', { type: 'warning' })
    await userApi.remove(row._id)
    ElMessage.success('已禁用')
    loadData()
  } catch {}
}

async function submitForm() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (isEdit.value) {
        await userApi.update(editId.value, form)
        ElMessage.success('更新成功')
      } else {
        await userApi.create(form)
        ElMessage.success('创建成功')
      }
      showDialog.value = false
      loadData()
    } finally {
      submitting.value = false
    }
  })
}

async function loadDicts() {
  try {
    [deptDict.value, labDict.value, posDict.value] = await Promise.all([
      configApi.getDictionaryItems('department'),
      configApi.getDictionaryItems('laboratory'),
      configApi.getDictionaryItems('position'),
    ])
  } catch {}
}

onMounted(() => {
  loadDicts()
  loadData()
})
</script>
