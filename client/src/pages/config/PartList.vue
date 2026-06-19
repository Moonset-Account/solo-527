<template>
  <div>
    <PageHeader title="配件报价" subtitle="管理配件信息和报价" />
    <a-card>
      <div class="flex justify-between mb-4">
        <a-input-search
          v-model:value="keyword"
          placeholder="搜索配件编码、名称、品牌"
          style="width: 300px"
          @search="loadData"
          enter-button
        />
        <a-button type="primary" @click="handleAdd">
          <template #icon><Plus /></template>
          新增
        </a-button>
      </div>
      <a-table
        :columns="columns"
        :data-source="data"
        :pagination="pagination"
        @change="handlePageChange"
        row-key="id"
        :loading="loading"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a @click="handleEdit(record)">编辑</a>
            <a-divider type="vertical" />
            <a-popconfirm title="确定删除此配件吗？" @confirm="handleDelete(record.id)">
              <a class="text-red-500">删除</a>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </a-card>
    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑配件' : '新增配件'"
      @ok="handleSubmit"
      :confirm-loading="submitting"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        layout="vertical"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="配件编码" name="code">
              <a-input
                v-model:value="formData.code"
                placeholder="请输入配件编码"
                :disabled="isEdit"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="配件名称" name="name">
              <a-input v-model:value="formData.name" placeholder="请输入配件名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="品牌" name="brand">
              <a-input v-model:value="formData.brand" placeholder="请输入品牌" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="型号" name="model">
              <a-input v-model:value="formData.model" placeholder="请输入型号" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="单价" name="salePrice">
              <a-input-number
                v-model:value="formData.salePrice"
                placeholder="单价"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="库存" name="stock">
              <a-input-number
                v-model:value="formData.stock"
                placeholder="库存"
                :min="0"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="单位" name="unit">
              <a-input v-model:value="formData.unit" placeholder="单位" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="分类" name="category">
              <a-input v-model:value="formData.category" placeholder="请输入分类" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="成本价" name="costPrice">
              <a-input-number
                v-model:value="formData.costPrice"
                placeholder="成本价"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>
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
import { getPartList, createPart, updatePart, deletePart } from '@/api/parts'
import type { Part } from '@/types'
import type { TablePaginationConfig } from 'ant-design-vue'

const keyword = ref('')
const loading = ref(false)
const data = ref<Part[]>([])
const pagination = ref<TablePaginationConfig>({ current: 1, pageSize: 10, total: 0 })
const modalVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const editId = ref<number | null>(null)
const existingCodes = ref<string[]>([])

const formData = reactive({
  code: '',
  name: '',
  brand: '',
  model: '',
  category: '',
  unit: '',
  costPrice: 0,
  salePrice: 0,
  stock: 0
})

const validateCodeUnique = async (_rule: any, value: string) => {
  if (!value) return Promise.resolve()
  if (isEdit.value) return Promise.resolve()
  if (existingCodes.value.includes(value)) {
    return Promise.reject(new Error('配件编码已存在'))
  }
  return Promise.resolve()
}

const rules = {
  code: [
    { required: true, message: '请输入配件编码', trigger: 'blur' },
    { validator: validateCodeUnique, trigger: 'blur' }
  ],
  name: [{ required: true, message: '请输入配件名称', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }]
}

const columns = [
  { title: '配件编码', dataIndex: 'code', key: 'code' },
  { title: '配件名称', dataIndex: 'name', key: 'name' },
  { title: '品牌', dataIndex: 'brand', key: 'brand' },
  { title: '型号', dataIndex: 'model', key: 'model' },
  { title: '单价', dataIndex: 'salePrice', key: 'salePrice' },
  { title: '库存', dataIndex: 'stock', key: 'stock' },
  { title: '单位', dataIndex: 'unit', key: 'unit' },
  { title: '操作', key: 'action', width: 150 }
]

const loadData = async () => {
  loading.value = true
  try {
    const res = await getPartList({
      page: pagination.value.current || 1,
      pageSize: pagination.value.pageSize || 10,
      keyword: keyword.value
    })
    data.value = res.list
    pagination.value.total = res.total
    existingCodes.value = res.list.map(item => item.code || '').filter(Boolean)
  } catch (e) {
    message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: TablePaginationConfig) => {
  pagination.value = page
  loadData()
}

const handleAdd = () => {
  isEdit.value = false
  editId.value = null
  Object.assign(formData, {
    code: '',
    name: '',
    brand: '',
    model: '',
    category: '',
    unit: '',
    costPrice: 0,
    salePrice: 0,
    stock: 0
  })
  modalVisible.value = true
}

const handleEdit = (record: Part) => {
  isEdit.value = true
  editId.value = record.id
  Object.assign(formData, {
    code: record.code || '',
    name: record.name,
    brand: record.brand || '',
    model: record.model || '',
    category: record.category,
    unit: record.unit,
    costPrice: record.costPrice,
    salePrice: record.salePrice,
    stock: record.stock
  })
  modalVisible.value = true
}

const handleDelete = async (id: number) => {
  try {
    await deletePart(id)
    message.success('删除成功')
    loadData()
  } catch (e) {
    message.error('删除失败')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitting.value = true
    if (isEdit.value && editId.value) {
      await updatePart(editId.value, formData)
      message.success('更新成功')
    } else {
      await createPart(formData)
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
})
</script>
