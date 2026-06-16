<template>
  <div>
    <n-page-header title="耗材管理" subtitle="登记和维护耗材规格信息">
      <template #extra>
        <n-button type="primary" @click="showCreate = true">
          <template #icon><AddOutline /></template>
          新增耗材
        </n-button>
      </template>
    </n-page-header>

    <n-card style="margin-top: 16px;">
      <n-space vertical :size="16">
        <n-space>
          <n-input v-model:value="searchKeyword" placeholder="搜索名称/编码/规格" clearable style="width: 240px;" />
          <n-select v-model:value="filterCategory" :options="categoryOptions" placeholder="选择分类" clearable style="width: 180px;" />
          <n-select v-model:value="filterActive" :options="activeOptions" placeholder="状态" clearable style="width: 120px;" />
          <n-button type="primary" @click="loadData">查询</n-button>
          <n-button @click="resetFilters">重置</n-button>
        </n-space>

        <n-data-table
          :columns="columns"
          :data="dataList"
          :loading="loading"
          :pagination="pagination"
          @update:page="handlePageChange"
        />
      </n-space>
    </n-card>

    <n-modal v-model:show="showCreate" preset="card" title="新增耗材" style="width: 600px;">
      <n-form ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="100px">
        <n-grid :cols="2" :x-gap="12">
          <n-form-item label="耗材名称" path="name" :span="2">
            <n-input v-model:value="formData.name" placeholder="请输入耗材名称" />
          </n-form-item>
          <n-form-item label="耗材编码" path="code">
            <n-input v-model:value="formData.code" placeholder="自动生成或手动输入" />
          </n-form-item>
          <n-form-item label="所属分类" path="category_id">
            <n-select v-model:value="formData.category_id" :options="categoryOptions" placeholder="请选择分类" />
          </n-form-item>
          <n-form-item label="规格型号" path="specification" :span="2">
            <n-input v-model:value="formData.specification" placeholder="请输入详细规格" />
          </n-form-item>
          <n-form-item label="品牌">
            <n-input v-model:value="formData.brand" placeholder="品牌" />
          </n-form-item>
          <n-form-item label="型号">
            <n-input v-model:value="formData.model" placeholder="型号" />
          </n-form-item>
          <n-form-item label="计量单位" path="unit">
            <n-input v-model:value="formData.unit" placeholder="如: 个/盒/箱" />
          </n-form-item>
          <n-form-item label="最低库存">
            <n-input-number v-model:value="formData.min_stock" :min="0" style="width: 100%;" />
          </n-form-item>
          <n-form-item label="备注" :span="2">
            <n-input v-model:value="formData.description" type="textarea" placeholder="备注说明" :rows="3" />
          </n-form-item>
        </n-grid>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreate = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSubmit">确定</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { useMessage, type DataTableColumns } from 'naive-ui'
import { AddOutline } from '@vicons/ionicons5'
import { listMaterials, createMaterial, listCategories } from '~/api'
import dayjs from 'dayjs'

const message = useMessage()
const loading = ref(false)
const submitting = ref(false)
const showCreate = ref(false)
const formRef = ref()
const searchKeyword = ref('')
const filterCategory = ref<number | null>(null)
const filterActive = ref<boolean | null>(null)

const dataList = ref<any[]>([])
const categoryOptions = ref<any[]>([])
const activeOptions = [
  { label: '启用', value: true },
  { label: '停用', value: false }
]

const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
})

const columns: DataTableColumns = [
  { title: '编码', key: 'code', width: 120 },
  { title: '名称', key: 'name', width: 180 },
  { title: '规格', key: 'specification', ellipsis: { tooltip: true } },
  { title: '品牌', key: 'brand', width: 100 },
  { title: '型号', key: 'model', width: 100 },
  { title: '单位', key: 'unit', width: 80 },
  { title: '分类', key: 'category', width: 100, render: (row: any) => row.category?.name || '-' },
  { title: '状态', key: 'is_active', width: 80, render: (row: any) =>
    h('n-tag', { type: row.is_active ? 'success' : 'default' }, () => row.is_active ? '启用' : '停用')
  },
  { title: '创建时间', key: 'created_at', width: 160, render: (row: any) => dayjs(row.created_at).format('YYYY-MM-DD HH:mm') },
  { title: '操作', key: 'actions', width: 120, render: (row: any) =>
    h('n-space', null, () => [
      h('n-button', { size: 'small', onClick: () => handleEdit(row) }, () => '编辑'),
      h('n-button', { size: 'small', type: 'primary', onClick: () => handleQuote(row) }, () => '报价')
    ])
  }
]

const formData = reactive({
  name: '',
  code: '',
  specification: '',
  unit: '',
  category_id: null as number | null,
  brand: '',
  model: '',
  description: '',
  min_stock: 0
})

const rules = {
  name: { required: true, message: '请输入耗材名称', trigger: 'blur' },
  code: { required: true, message: '请输入耗材编码', trigger: 'blur' },
  specification: { required: true, message: '请输入规格', trigger: 'blur' },
  unit: { required: true, message: '请输入计量单位', trigger: 'blur' }
}

async function loadCategories() {
  try {
    const res = await listCategories({ page_size: 100 })
    if (res.code === 200) {
      categoryOptions.value = res.data.items.map((c: any) => ({ label: c.name, value: c.id }))
    }
  } catch (e) {}
}

async function loadData() {
  loading.value = true
  try {
    const res = await listMaterials({
      page: pagination.page,
      page_size: pagination.pageSize,
      keyword: searchKeyword.value,
      category_id: filterCategory.value,
      is_active: filterActive.value
    })
    if (res.code === 200) {
      dataList.value = res.data.items
      pagination.itemCount = res.data.total
    }
  } catch (e: any) {
    message.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function handlePageChange(page: number) {
  pagination.page = page
  loadData()
}

function resetFilters() {
  searchKeyword.value = ''
  filterCategory.value = null
  filterActive.value = null
  pagination.page = 1
  loadData()
}

function handleEdit(row: any) {
  message.info('编辑功能开发中')
}

function handleQuote(row: any) {
  message.info(`查看 ${row.name} 的报价`)
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    submitting.value = true
    await createMaterial(formData)
    message.success('创建成功')
    showCreate.value = false
    Object.assign(formData, { name: '', code: '', specification: '', unit: '', category_id: null, brand: '', model: '', description: '', min_stock: 0 })
    loadData()
  } catch (e: any) {
    message.error(e.message || '创建失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadCategories()
  loadData()
})
</script>
