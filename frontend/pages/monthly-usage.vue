<template>
  <div>
    <n-page-header title="月度用量登记" subtitle="录入各部门耗材月度用量数据">
      <template #extra>
        <n-button type="primary" @click="showCreate = true">
          <template #icon><AddOutline /></template>
          登记用量
        </n-button>
      </template>
    </n-page-header>

    <n-card style="margin-top: 16px;">
      <n-space vertical :size="16">
        <n-space>
          <n-select v-model:value="filterMaterial" :options="materialOptions" placeholder="选择耗材" clearable style="width: 220px;" filterable />
          <n-input-number v-model:value="filterYear" placeholder="年份" style="width: 120px;" :min="2020" :max="2100" />
          <n-select v-model:value="filterMonth" :options="monthOptions" placeholder="月份" clearable style="width: 120px;" />
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

    <n-modal v-model:show="showCreate" preset="card" title="登记月度用量" style="width: 520px;">
      <n-form ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="100px">
        <n-form-item label="耗材" path="material_id">
          <n-select v-model:value="formData.material_id" :options="materialOptions" placeholder="请选择耗材" filterable />
        </n-form-item>
        <n-form-item label="年份" path="year">
          <n-input-number v-model:value="formData.year" style="width: 100%;" :min="2020" :max="2100" />
        </n-form-item>
        <n-form-item label="月份" path="month">
          <n-select v-model:value="formData.month" :options="monthOptions" placeholder="选择月份" />
        </n-form-item>
        <n-form-item label="使用数量" path="quantity">
          <n-input-number v-model:value="formData.quantity" style="width: 100%;" :min="0" :step="1" />
        </n-form-item>
        <n-form-item label="使用部门">
          <n-input v-model:value="formData.department" placeholder="请输入部门名称" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="formData.remarks" type="textarea" :rows="2" placeholder="备注说明" />
        </n-form-item>
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
import { listMonthlyUsages, createMonthlyUsage, listMaterials } from '~/api'
import dayjs from 'dayjs'

const message = useMessage()
const loading = ref(false)
const submitting = ref(false)
const showCreate = ref(false)
const formRef = ref()
const filterMaterial = ref<number | null>(null)
const filterYear = ref(dayjs().year())
const filterMonth = ref<number | null>(null)

const dataList = ref<any[]>([])
const materialOptions = ref<any[]>([])
const monthOptions = Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}月`, value: i + 1 }))

const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
})

const columns: DataTableColumns = [
  { title: '耗材编码', key: 'material_code', width: 120, render: (row: any) => row.material?.code || '-' },
  { title: '耗材名称', key: 'material_name', width: 160, render: (row: any) => row.material?.name || '-' },
  { title: '规格', key: 'specification', render: (row: any) => row.material?.specification || '-', ellipsis: { tooltip: true } },
  { title: '年份', key: 'year', width: 80 },
  { title: '月份', key: 'month', width: 80, render: (row: any) => `${row.month}月` },
  { title: '使用数量', key: 'quantity', width: 100, render: (row: any) =>
    h('n-strong', null, () => `${row.quantity} ${row.material?.unit || ''}`)
  },
  { title: '使用部门', key: 'department', width: 120 },
  { title: '备注', key: 'remarks', ellipsis: { tooltip: true } },
  { title: '登记时间', key: 'created_at', width: 160, render: (row: any) => dayjs(row.created_at).format('YYYY-MM-DD HH:mm') }
]

const formData = reactive({
  material_id: null as number | null,
  year: dayjs().year(),
  month: dayjs().month() + 1,
  quantity: 0,
  department: '',
  remarks: ''
})

const rules = {
  material_id: { required: true, message: '请选择耗材', trigger: 'change' },
  year: { required: true, message: '请选择年份', trigger: 'blur' },
  month: { required: true, message: '请选择月份', trigger: 'change' },
  quantity: { required: true, message: '请输入使用数量', trigger: 'blur', type: 'number', min: 0 }
}

async function loadMaterials() {
  try {
    const res = await listMaterials({ page_size: 500, is_active: true })
    if (res.code === 200) {
      materialOptions.value = res.data.items.map((m: any) => ({
        label: `${m.code} - ${m.name}`,
        value: m.id
      }))
    }
  } catch (e) {}
}

async function loadData() {
  loading.value = true
  try {
    const res = await listMonthlyUsages({
      page: pagination.page,
      page_size: pagination.pageSize,
      material_id: filterMaterial.value,
      year: filterYear.value,
      month: filterMonth.value
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
  filterMaterial.value = null
  filterYear.value = dayjs().year()
  filterMonth.value = null
  pagination.page = 1
  loadData()
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    submitting.value = true
    await createMonthlyUsage(formData)
    message.success('登记成功')
    showCreate.value = false
    Object.assign(formData, { material_id: null, year: dayjs().year(), month: dayjs().month() + 1, quantity: 0, department: '', remarks: '' })
    loadData()
  } catch (e: any) {
    message.error(e.message || '登记失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadMaterials()
  loadData()
})
</script>
