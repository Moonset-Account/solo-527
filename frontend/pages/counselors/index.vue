<template>
  <div class="space-y-4">
    <n-card>
      <template #header>
        <div class="flex items-center justify-between">
          <span>咨询师管理</span>
          <n-button type="primary" @click="showCreateModal = true">
            <template #icon>
              <AddCircleOutline />
            </template>
            新增咨询师
          </n-button>
        </div>
      </template>

      <n-table :data="counselors" :columns="columns" bordered>
        <template #is_active="{ row }">
          <n-tag :type="row.is_active ? 'success' : 'default'">
            {{ row.is_active ? '在职' : '离职' }}
          </n-tag>
        </template>
        <template #actions="{ row }">
          <n-space>
            <n-button size="small" text @click="editCounselor(row)">
              编辑
            </n-button>
            <n-button
              size="small"
              text
              :type="row.is_active ? 'error' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.is_active ? '停用' : '启用' }}
            </n-button>
          </n-space>
        </template>
      </n-table>
    </n-card>

    <n-modal v-model:show="showCreateModal" preset="card" :title="editingCounselor ? '编辑咨询师' : '新增咨询师'" style="width: 550px">
      <n-form
        ref="formRef"
        :model="formValue"
        :rules="rules"
        label-placement="top"
      >
        <n-row :gutter="12">
          <n-col :span="12">
            <n-form-item label="姓名" path="name">
              <n-input v-model:value="formValue.name" placeholder="请输入姓名" />
            </n-form-item>
          </n-col>
          <n-col :span="12">
            <n-form-item label="性别">
              <n-radio-group v-model:value="formValue.gender">
                <n-radio value="男">男</n-radio>
                <n-radio value="女">女</n-radio>
              </n-radio-group>
            </n-form-item>
          </n-col>
        </n-row>
        <n-row :gutter="12">
          <n-col :span="12">
            <n-form-item label="手机号">
              <n-input v-model:value="formValue.phone" placeholder="请输入手机号" />
            </n-form-item>
          </n-col>
          <n-col :span="12">
            <n-form-item label="邮箱">
              <n-input v-model:value="formValue.email" placeholder="请输入邮箱" />
            </n-form-item>
          </n-col>
        </n-row>
        <n-row :gutter="12">
          <n-col :span="12">
            <n-form-item label="职称">
              <n-input v-model:value="formValue.title" placeholder="如：二级心理咨询师" />
            </n-form-item>
          </n-col>
          <n-col :span="12">
            <n-form-item label="擅长领域">
              <n-input v-model:value="formValue.specialty" placeholder="如：焦虑抑郁、婚姻家庭" />
            </n-form-item>
          </n-col>
        </n-row>
        <n-form-item label="个人简介">
          <n-input
            v-model:value="formValue.description"
            type="textarea"
            :rows="3"
            placeholder="咨询师个人简介"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSubmit">
            确认
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  NCard,
  NTable,
  NButton,
  NSpace,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NRow,
  NCol,
  NRadioGroup,
  NRadio,
  NTag,
  useMessage,
  TableColumns,
  FormInst,
  FormRules
} from 'naive-ui'
import { AddCircleOutline } from '@vicons/ionicons5'
import { useAuth } from '~/composables/useAuth'

const message = useMessage()
const { apiRequest } = useAuth()

const counselors = ref<any[]>([])
const showCreateModal = ref(false)
const editingCounselor = ref<any>(null)
const submitting = ref(false)

const formRef = ref<FormInst | null>(null)
const formValue = ref({
  name: '',
  gender: '' as string | null,
  phone: '',
  email: '',
  title: '',
  specialty: '',
  description: ''
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }]
}

const columns: TableColumns = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '姓名', key: 'name' },
  { title: '性别', key: 'gender' },
  { title: '手机号', key: 'phone' },
  { title: '职称', key: 'title' },
  { title: '擅长领域', key: 'specialty' },
  { title: '状态', key: 'is_active' },
  { title: '操作', key: 'actions', width: 150 }
]

async function loadData() {
  try {
    const data = await apiRequest<any[]>('/api/counselors')
    counselors.value = data
  } catch (error) {
    message.error('加载数据失败')
  }
}

function editCounselor(row: any) {
  editingCounselor.value = row
  formValue.value = {
    name: row.name,
    gender: row.gender,
    phone: row.phone,
    email: row.email,
    title: row.title,
    specialty: row.specialty,
    description: row.description
  }
  showCreateModal.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (editingCounselor.value) {
      await apiRequest(`/api/counselors/${editingCounselor.value.id}`, {
        method: 'PUT',
        body: formValue.value
      })
      message.success('更新成功')
    } else {
      await apiRequest('/api/counselors', {
        method: 'POST',
        body: formValue.value
      })
      message.success('创建成功')
    }
    
    showCreateModal.value = false
    loadData()
  } catch (error: any) {
    message.error(error.data?.detail || '操作失败')
  } finally {
    submitting.value = false
    editingCounselor.value = null
  }
}

async function toggleStatus(row: any) {
  try {
    await apiRequest(`/api/counselors/${row.id}`, {
      method: row.is_active ? 'DELETE' : 'PUT',
      body: row.is_active ? undefined : { is_active: true }
    })
    message.success('状态更新成功')
    loadData()
  } catch (error) {
    message.error('操作失败')
  }
}

onMounted(() => {
  loadData()
})
</script>
