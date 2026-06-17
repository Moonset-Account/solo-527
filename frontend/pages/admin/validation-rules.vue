<template>
  <MainLayout>
    <div class="admin-validation-page">
      <n-card :bordered="false">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <n-button type="primary" @click="handleCreate">新增规则</n-button>
          </div>
          <div class="toolbar-right">
            <n-button @click="loadData">刷新</n-button>
          </div>
        </div>

        <n-spin :show="loading">
          <n-data-table
            :columns="columns"
            :data="tableData"
            :pagination="pagination"
            :bordered="false"
            @update:page="handlePageChange"
            @update:page-size="handlePageSizeChange"
          />
        </n-spin>
      </n-card>

      <n-modal
        v-model:show="showModal"
        preset="card"
        :title="isEdit ? '编辑规则' : '新增规则'"
        style="width: 550px"
      >
        <n-form :model="formData" label-placement="left" label-width="120px">
          <n-form-item label="规则名称">
            <n-input v-model:value="formData.name" />
          </n-form-item>
          <n-form-item label="规则编码">
            <n-input v-model:value="formData.code" :disabled="isEdit" />
          </n-form-item>
          <n-form-item label="字段名称">
            <n-input v-model:value="formData.field_name" />
          </n-form-item>
          <n-form-item label="规则类型">
            <n-select v-model:value="formData.rule_type" :options="ruleTypeOptions" />
          </n-form-item>
          <n-form-item label="错误提示">
            <n-input v-model:value="formData.error_message" />
          </n-form-item>
          <n-form-item label="规则配置">
            <n-input
              v-model:value="ruleConfigStr"
              type="textarea"
              :rows="3"
              placeholder="JSON格式，如: { &quot;min&quot;: 0, &quot;max&quot;: 100 }"
            />
          </n-form-item>
          <n-form-item label="启用">
            <n-switch v-model:value="formData.is_active" />
          </n-form-item>
          <n-form-item label="描述">
            <n-input v-model:value="formData.description" type="textarea" :rows="2" />
          </n-form-item>
        </n-form>
        <template #footer>
          <n-space justify="end">
            <n-button @click="showModal = false">取消</n-button>
            <n-button type="primary" :loading="submitting" @click="handleSubmit">确定</n-button>
          </n-space>
        </template>
      </n-modal>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import MainLayout from '~/components/layout/MainLayout.vue'
import { getValidationRules, createValidationRule, updateValidationRule, deleteValidationRule } from '~/api/system'
import type { ValidationRule } from '~/types'
import { useMessageUtil, useDialogUtil } from '~/composables/useMessage'

const { success, error } = useMessageUtil()
const { confirm } = useDialogUtil()

const loading = ref(false)
const tableData = ref<ValidationRule[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  showSizePicker: false,
})

const showModal = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const editingId = ref<number | null>(null)

const formData = reactive<any>({
  name: '',
  code: '',
  field_name: '',
  rule_type: 'required',
  error_message: '',
  rule_config: null,
  is_active: true,
  description: '',
})

const ruleConfigStr = computed({
  get() {
    return formData.rule_config ? JSON.stringify(formData.rule_config, null, 2) : ''
  },
  set(val) {
    try {
      formData.rule_config = val ? JSON.parse(val) : null
    } catch (e) {
      // 解析失败时保留原样
    }
  },
})

const ruleTypeOptions = [
  { label: '必填', value: 'required' },
  { label: '最小长度', value: 'min_length' },
  { label: '最大长度', value: 'max_length' },
  { label: '最小值', value: 'min_value' },
  { label: '最大值', value: 'max_value' },
  { label: '正则表达式', value: 'regex' },
  { label: '邮箱格式', value: 'email' },
  { label: '手机号格式', value: 'phone' },
]

const columns: DataTableColumns<ValidationRule> = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '规则名称', key: 'name', width: 150 },
  { title: '规则编码', key: 'code', width: 150 },
  { title: '字段名称', key: 'field_name', width: 120 },
  { title: '规则类型', key: 'rule_type', width: 120, render: (row) => getRuleTypeLabel(row.rule_type) },
  { title: '错误提示', key: 'error_message', width: 200, ellipsis: true },
  {
    title: '状态',
    key: 'is_active',
    width: 100,
    render: (row) => h('n-tag', { type: row.is_active ? 'success' : 'default' }, () => row.is_active ? '启用' : '禁用'),
  },
  { title: '更新时间', key: 'updated_at', width: 170 },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (row) => h('n-space', null, () => [
      h('n-button', { size: 'small', onClick: () => handleEdit(row) }, () => '编辑'),
      h('n-button', { size: 'small', type: 'error', onClick: () => handleDelete(row.id) }, () => '删除'),
    ]),
  },
]

function getRuleTypeLabel(type: string): string {
  const map: Record<string, string> = {
    required: '必填',
    min_length: '最小长度',
    max_length: '最大长度',
    min_value: '最小值',
    max_value: '最大值',
    regex: '正则表达式',
    email: '邮箱格式',
    phone: '手机号格式',
  }
  return map[type] || type
}

async function loadData() {
  loading.value = true
  try {
    const res = await getValidationRules({ page: pagination.page, page_size: pagination.pageSize })
    if (res.code === 200) {
      tableData.value = res.data.items
      pagination.total = res.data.total
    }
  } catch (e: any) {
    error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function handlePageChange(page: number) {
  pagination.page = page
  loadData()
}

function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize
  pagination.page = 1
  loadData()
}

function handleCreate() {
  isEdit.value = false
  editingId.value = null
  Object.assign(formData, {
    name: '',
    code: '',
    field_name: '',
    rule_type: 'required',
    error_message: '',
    rule_config: null,
    is_active: true,
    description: '',
  })
  showModal.value = true
}

function handleEdit(row: ValidationRule) {
  isEdit.value = true
  editingId.value = row.id
  Object.assign(formData, {
    name: row.name,
    code: row.code,
    field_name: row.field_name,
    rule_type: row.rule_type,
    error_message: row.error_message,
    rule_config: row.rule_config,
    is_active: row.is_active,
    description: row.description,
  })
  showModal.value = true
}

async function handleSubmit() {
  if (!formData.name || !formData.code || !formData.field_name || !formData.error_message) {
    error('请填写完整信息')
    return
  }
  submitting.value = true
  try {
    if (isEdit.value && editingId.value) {
      await updateValidationRule(editingId.value, formData)
      success('更新成功')
    } else {
      await createValidationRule(formData)
      success('创建成功')
    }
    showModal.value = false
    loadData()
  } catch (e: any) {
    error(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

function handleDelete(id: number) {
  confirm('确认删除', '确定要删除这条校验规则吗？', async () => {
    try {
      await deleteValidationRule(id)
      success('删除成功')
      loadData()
    } catch (e: any) {
      error(e.message || '删除失败')
    }
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.admin-validation-page {
  padding: 0;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
</style>
