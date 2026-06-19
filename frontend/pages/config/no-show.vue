<template>
  <div class="space-y-4">
    <n-card>
      <template #header>
        <div class="flex items-center justify-between">
          <span>爽约名单管理</span>
          <n-space>
            <n-input
              v-model:value="searchPhone"
              placeholder="搜索手机号"
              style="width: 200px"
              clearable
              @keyup.enter="loadData"
            />
            <n-select
              v-model:value="filterBlocked"
              :options="blockedOptions"
              placeholder="状态筛选"
              style="width: 150px"
              clearable
            />
            <n-button type="primary" @click="showCreateModal = true">
              <template #icon>
                <AddCircleOutline />
              </template>
              添加名单
            </n-button>
          </n-space>
        </div>
      </template>

      <n-table :data="noShowList" :columns="columns" bordered>
        <template #is_blocked="{ row }">
          <n-tag :type="row.is_blocked ? 'error' : 'success'">
            {{ row.is_blocked ? '已封禁' : '已解除' }}
          </n-tag>
        </template>
        <template #created_by="{ row }">
          {{ getOperatorName(row.created_by) }}
        </template>
        <template #actions="{ row }">
          <n-space>
            <n-button size="small" text @click="editEntry(row)">
              编辑
            </n-button>
            <n-button
              size="small"
              text
              :type="row.is_blocked ? 'success' : 'error'"
              @click="toggleBlock(row)"
            >
              {{ row.is_blocked ? '解除封禁' : '封禁' }}
            </n-button>
            <n-popconfirm
              positive-text="删除"
              negative-text="取消"
              @positive-click="deleteEntry(row)"
            >
              <template #trigger>
                <n-button size="small" text type="error">
                  删除
                </n-button>
              </template>
              确定要删除该记录吗？
            </n-popconfirm>
          </n-space>
        </template>
      </n-table>
    </n-card>

    <n-modal v-model:show="showCreateModal" preset="card" :title="editingEntry ? '编辑记录' : '添加爽约名单'" style="width: 450px">
      <n-form
        ref="formRef"
        :model="formValue"
        :rules="rules"
        label-placement="top"
      >
        <n-form-item label="手机号" path="visitor_phone">
          <n-input v-model:value="formValue.visitor_phone" placeholder="请输入手机号" />
        </n-form-item>
        <n-form-item label="访客姓名">
          <n-input v-model:value="formValue.visitor_name" placeholder="请输入姓名（可选）" />
        </n-form-item>
        <n-form-item label="爽约次数">
          <n-input-number v-model:value="formValue.no_show_count" :min="1" style="width: 100%" />
        </n-form-item>
        <n-form-item label="原因">
          <n-input
            v-model:value="formValue.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入爽约原因"
          />
        </n-form-item>
        <n-form-item label="是否封禁">
          <n-switch v-model:value="formValue.is_blocked" />
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
  NInput,
  NSelect,
  NSpace,
  NModal,
  NForm,
  NFormItem,
  NInputNumber,
  NSwitch,
  NTag,
  NPopconfirm,
  useMessage,
  TableColumns,
  SelectOption,
  FormInst,
  FormRules
} from 'naive-ui'
import { AddCircleOutline } from '@vicons/ionicons5'
import { useAuth } from '~/composables/useAuth'

const message = useMessage()
const { apiRequest } = useAuth()

const noShowList = ref<any[]>([])
const searchPhone = ref('')
const filterBlocked = ref<boolean | null>(null)
const showCreateModal = ref(false)
const editingEntry = ref<any>(null)
const submitting = ref(false)

const blockedOptions: SelectOption[] = [
  { label: '已封禁', value: true },
  { label: '已解除', value: false }
]

const formRef = ref<FormInst | null>(null)
const formValue = ref({
  visitor_phone: '',
  visitor_name: '',
  no_show_count: 1,
  reason: '',
  is_blocked: true
})

const rules: FormRules = {
  visitor_phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

const columns: TableColumns = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '手机号', key: 'visitor_phone' },
  { title: '姓名', key: 'visitor_name' },
  { title: '爽约次数', key: 'no_show_count' },
  { title: '原因', key: 'reason', ellipsis: { tooltip: true } },
  { title: '状态', key: 'is_blocked' },
  { title: '操作人', key: 'created_by' },
  { title: '创建时间', key: 'created_at' },
  { title: '操作', key: 'actions', width: 200 }
]

function getOperatorName(userId: number) {
  return userId || '-'
}

async function loadData() {
  try {
    const params: any = {}
    if (searchPhone.value) {
      params.visitor_phone = searchPhone.value
    }
    if (filterBlocked.value !== null) {
      params.is_blocked = filterBlocked.value
    }
    
    const data = await apiRequest<any[]>('/api/no-show-list', { params })
    noShowList.value = data
  } catch (error) {
    message.error('加载数据失败')
  }
}

function editEntry(row: any) {
  editingEntry.value = row
  formValue.value = {
    visitor_phone: row.visitor_phone,
    visitor_name: row.visitor_name || '',
    no_show_count: row.no_show_count,
    reason: row.reason || '',
    is_blocked: row.is_blocked
  }
  showCreateModal.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (editingEntry.value) {
      await apiRequest(`/api/no-show-list/${editingEntry.value.id}`, {
        method: 'PUT',
        body: formValue.value
      })
      message.success('更新成功')
    } else {
      await apiRequest('/api/no-show-list', {
        method: 'POST',
        body: formValue.value
      })
      message.success('添加成功')
    }
    
    showCreateModal.value = false
    loadData()
  } catch (error: any) {
    message.error(error.data?.detail || '操作失败')
  } finally {
    submitting.value = false
    editingEntry.value = null
  }
}

async function toggleBlock(row: any) {
  try {
    await apiRequest(`/api/no-show-list/${row.id}`, {
      method: 'PUT',
      body: { is_blocked: !row.is_blocked }
    })
    message.success('状态更新成功')
    loadData()
  } catch (error) {
    message.error('操作失败')
  }
}

async function deleteEntry(row: any) {
  try {
    await apiRequest(`/api/no-show-list/${row.id}`, {
      method: 'DELETE'
    })
    message.success('删除成功')
    loadData()
  } catch (error) {
    message.error('删除失败')
  }
}

onMounted(() => {
  loadData()
})
</script>
