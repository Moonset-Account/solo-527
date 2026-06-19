<template>
  <div>
    <PageHeader title="检测模板" subtitle="管理车辆检测模板" />
    <a-card>
      <div class="flex justify-between mb-4">
        <a-select
          v-model:value="categoryFilter"
          placeholder="选择分类"
          style="width: 200px"
          allow-clear
          @change="loadData"
        >
          <a-select-option v-for="cat in categories" :key="cat" :value="cat">
            {{ cat }}
          </a-select-option>
        </a-select>
        <a-button type="primary" @click="handleAdd">
          <template #icon><Plus /></template>
          新增
        </a-button>
      </div>
      <a-row :gutter="16">
        <a-col :span="8" v-for="item in data" :key="item.id">
          <a-card
            class="mb-4 cursor-pointer hover:shadow-md transition-shadow"
            @click="handleEdit(item)"
          >
            <div class="flex justify-between items-start mb-3">
              <div>
                <h3 class="text-lg font-semibold m-0">{{ item.name }}</h3>
                <p class="text-gray-500 text-sm mt-1">分类：{{ item.category || '-' }}</p>
              </div>
              <a-switch
                :checked="item.enabled"
                @click.stop="handleToggle(item)"
              />
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">检测项数量</span>
              <span class="font-medium">{{ item.items?.length || 0 }}</span>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </a-card>
    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑模板' : '新增模板'"
      @ok="handleSubmit"
      :confirm-loading="submitting"
      width="900px"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        layout="vertical"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="模板名称" name="name">
              <a-input v-model:value="formData.name" placeholder="请输入模板名称" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="分类" name="category">
              <a-select v-model:value="formData.category" placeholder="请选择分类">
                <a-select-option v-for="cat in categories" :key="cat" :value="cat">
                  {{ cat }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="4">
            <a-form-item label="启用状态">
              <a-switch v-model:checked="formData.enabled" />
            </a-form-item>
          </a-col>
        </a-row>
        <div class="flex justify-between items-center mb-2">
          <span class="font-medium">检测项目</span>
          <a-button size="small" type="primary" @click="addInspectionItem">
            <template #icon><Plus /></template>
            添加检测项
          </a-button>
        </div>
        <a-table
          :columns="inspectionColumns"
          :data-source="formData.items"
          :pagination="false"
          row-key="id"
          size="small"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'name'">
              <a-input v-model:value="record.name" placeholder="检测项目" size="small" />
            </template>
            <template v-else-if="column.key === 'standard'">
              <a-input v-model:value="record.standard" placeholder="检测标准" size="small" />
            </template>
            <template v-else-if="column.key === 'unit'">
              <a-input v-model:value="record.unit" placeholder="单位" size="small" style="width: 80px" />
            </template>
            <template v-else-if="column.key === 'minValue'">
              <a-input-number v-model:value="record.minValue" placeholder="最小值" size="small" style="width: 100%" />
            </template>
            <template v-else-if="column.key === 'maxValue'">
              <a-input-number v-model:value="record.maxValue" placeholder="最大值" size="small" style="width: 100%" />
            </template>
            <template v-else-if="column.key === 'action'">
              <a-button type="text" danger size="small" @click="removeInspectionItem(index)">
                删除
              </a-button>
            </template>
          </template>
        </a-table>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { Plus } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
import {
  getTemplateList,
  getTemplateCategories,
  createTemplate,
  updateTemplate,
  toggleTemplate
} from '@/api/templates'
import type { InspectionTemplate, InspectionItem } from '@/types'
import type { TablePaginationConfig } from 'ant-design-vue'

interface InspectionItemExt extends InspectionItem {
  minValue?: number
  maxValue?: number
}

interface InspectionTemplateExt extends Omit<InspectionTemplate, 'items'> {
  category: string
  enabled: boolean
  items: InspectionItemExt[]
}

const categoryFilter = ref<string>()
const data = ref<InspectionTemplateExt[]>([])
const categories = ref<string[]>([])
const pagination = ref<TablePaginationConfig>({ current: 1, pageSize: 10, total: 0 })
const modalVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const editId = ref<number | null>(null)

const formData = reactive<{
  name: string
  category: string
  enabled: boolean
  items: InspectionItemExt[]
}>({
  name: '',
  category: '',
  enabled: true,
  items: []
})

const rules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

const inspectionColumns = [
  { title: '检测项目', dataIndex: 'name', key: 'name' },
  { title: '检测标准', dataIndex: 'standard', key: 'standard' },
  { title: '单位', dataIndex: 'unit', key: 'unit', width: 100 },
  { title: '最小值', dataIndex: 'minValue', key: 'minValue', width: 120 },
  { title: '最大值', dataIndex: 'maxValue', key: 'maxValue', width: 120 },
  { title: '操作', key: 'action', width: 80 }
]

const loadData = async () => {
  try {
    const res = await getTemplateList({
      page: pagination.value.current || 1,
      pageSize: pagination.value.pageSize || 10,
      category: categoryFilter.value
    })
    data.value = res.list.map(item => ({
      ...item,
      category: (item as any).category || '',
      enabled: (item as any).enabled !== false
    }))
    pagination.value.total = res.total
  } catch (e) {
    message.error('加载数据失败')
  }
}

const loadCategories = async () => {
  try {
    categories.value = await getTemplateCategories()
  } catch (e) {
    message.error('加载分类失败')
  }
}

const handleToggle = async (item: InspectionTemplateExt) => {
  try {
    await toggleTemplate(item.id, !item.enabled)
    message.success('状态更新成功')
    loadData()
  } catch (e) {
    message.error('操作失败')
  }
}

const handleAdd = () => {
  isEdit.value = false
  editId.value = null
  Object.assign(formData, {
    name: '',
    category: '',
    enabled: true,
    items: []
  })
  modalVisible.value = true
}

const handleEdit = (record: InspectionTemplateExt) => {
  isEdit.value = true
  editId.value = record.id
  Object.assign(formData, {
    name: record.name,
    category: record.category,
    enabled: record.enabled,
    items: record.items?.map(item => ({ ...item })) || []
  })
  modalVisible.value = true
}

const addInspectionItem = () => {
  formData.items.push({
    id: Date.now(),
    name: '',
    category: formData.category,
    standard: '',
    unit: '',
    minValue: undefined,
    maxValue: undefined
  })
}

const removeInspectionItem = (index: number) => {
  formData.items.splice(index, 1)
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitting.value = true
    const submitData = {
      name: formData.name,
      description: '',
      category: formData.category,
      enabled: formData.enabled,
      items: formData.items.map(item => ({
        name: item.name,
        category: item.category,
        standard: item.standard,
        unit: item.unit,
        minValue: item.minValue,
        maxValue: item.maxValue
      }))
    }
    if (isEdit.value && editId.value) {
      await updateTemplate(editId.value, submitData as any)
      message.success('更新成功')
    } else {
      await createTemplate(submitData as any)
      message.success('创建成功')
    }
    modalVisible.value = false
    loadData()
  } catch (e) {
    if (e !== false) message.error('操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
  loadCategories()
})
</script>
