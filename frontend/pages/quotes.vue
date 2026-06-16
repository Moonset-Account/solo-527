<template>
  <div>
    <n-page-header title="报价管理" subtitle="收集供应商报价信息">
      <template #extra>
        <n-button type="primary" @click="showCreate = true">
          <template #icon><DocumentTextOutline /></template>
          录入报价
        </n-button>
      </template>
    </n-page-header>

    <n-card style="margin-top: 16px;">
      <n-space vertical :size="16">
        <n-space>
          <n-select v-model:value="filterMaterial" :options="materialOptions" placeholder="选择耗材" clearable style="width: 200px;" filterable />
          <n-select v-model:value="filterSupplier" :options="supplierOptions" placeholder="选择供应商" clearable style="width: 200px;" filterable />
          <n-select v-model:value="filterStatus" :options="statusOptions" placeholder="报价状态" clearable style="width: 140px;" />
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

    <n-modal v-model:show="showCreate" preset="card" title="录入报价" style="width: 600px;">
      <n-form ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="100px">
        <n-grid :cols="2" :x-gap="12">
          <n-form-item label="耗材" path="material_id" :span="2">
            <n-select v-model:value="formData.material_id" :options="materialOptions" placeholder="请选择耗材" filterable />
          </n-form-item>
          <n-form-item label="供应商" path="supplier_id" :span="2">
            <n-select v-model:value="formData.supplier_id" :options="supplierOptions" placeholder="请选择供应商" filterable />
          </n-form-item>
          <n-form-item label="单价(元)" path="unit_price">
            <n-input-number v-model:value="formData.unit_price" style="width: 100%;" :min="0" :precision="2" />
          </n-form-item>
          <n-form-item label="税率(%)">
            <n-input-number v-model:value="formData.tax_rate" style="width: 100%;" :min="0" :max="100" :precision="2" />
          </n-form-item>
          <n-form-item label="最小起订量">
            <n-input-number v-model:value="formData.min_order_qty" style="width: 100%;" :min="1" />
          </n-form-item>
          <n-form-item label="交货天数">
            <n-input-number v-model:value="formData.delivery_days" style="width: 100%;" :min="0" />
          </n-form-item>
          <n-form-item label="报价有效期">
            <n-date-picker v-model:value="dateRange" type="daterange" style="width: 100%;" />
          </n-form-item>
          <n-form-item label="付款条款">
            <n-input v-model:value="formData.payment_terms" placeholder="如: 月结30天" />
          </n-form-item>
          <n-form-item label="质保期">
            <n-input v-model:value="formData.warranty_period" placeholder="如: 12个月" />
          </n-form-item>
          <n-form-item label="附件">
            <n-upload action="#" :show-file-list="false">
              <n-button>上传报价单</n-button>
            </n-upload>
          </n-form-item>
          <n-form-item label="备注" :span="2">
            <n-input v-model:value="formData.remarks" type="textarea" :rows="2" placeholder="备注说明" />
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
import { DocumentTextOutline } from '@vicons/ionicons5'
import { listQuotes, createQuote, listMaterials, listSuppliers } from '~/api'
import dayjs from 'dayjs'

const message = useMessage()
const loading = ref(false)
const submitting = ref(false)
const showCreate = ref(false)
const formRef = ref()
const filterMaterial = ref<number | null>(null)
const filterSupplier = ref<number | null>(null)
const filterStatus = ref<string | null>(null)
const dateRange = ref<number[] | null>(null)

const dataList = ref<any[]>([])
const materialOptions = ref<any[]>([])
const supplierOptions = ref<any[]>([])
const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '已提交', value: 'submitted' },
  { label: '已评估', value: 'evaluated' },
  { label: '已接受', value: 'accepted' },
  { label: '已拒绝', value: 'rejected' },
  { label: '已过期', value: 'expired' }
]

const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
})

function getStatusTag(type: string) {
  const map: Record<string, any> = { draft: 'default', submitted: 'info', evaluated: 'warning', accepted: 'success', rejected: 'error', expired: 'default' }
  const label: Record<string, string> = { draft: '草稿', submitted: '已提交', evaluated: '已评估', accepted: '已接受', rejected: '已拒绝', expired: '已过期' }
  return { type: map[type] || 'default', label: label[type] || type }
}

const columns: DataTableColumns = [
  { title: '报价单号', key: 'quote_no', width: 130 },
  { title: '耗材', key: 'material_name', width: 160, render: () => '-' },
  { title: '供应商', key: 'supplier', width: 140, render: () => '-' },
  { title: '单价(元)', key: 'unit_price', width: 100, render: (row: any) => h('n-strong', null, () => `¥${row.unit_price.toFixed(2)}`) },
  { title: '税率', key: 'tax_rate', width: 80, render: (row: any) => `${row.tax_rate}%` },
  { title: '最小起订', key: 'min_order_qty', width: 90 },
  { title: '交货期', key: 'delivery_days', width: 90, render: (row: any) => row.delivery_days ? `${row.delivery_days}天` : '-' },
  { title: '有效期', key: 'valid', width: 180, render: (row: any) =>
    row.valid_from && row.valid_to ? `${dayjs(row.valid_from).format('YYYY-MM-DD')} ~ ${dayjs(row.valid_to).format('YYYY-MM-DD')}` : '-'
  },
  { title: '状态', key: 'status', width: 90, render: (row: any) => {
      const s = getStatusTag(row.status)
      return h('n-tag', { type: s.type }, { default: () => s.label })
  }},
  { title: '录入时间', key: 'created_at', width: 160, render: (row: any) => dayjs(row.created_at).format('YYYY-MM-DD HH:mm') }
]

const formData = reactive({
  material_id: null as number | null,
  supplier_id: null as number | null,
  unit_price: 0,
  tax_rate: 13,
  min_order_qty: 1,
  delivery_days: null as number | null,
  payment_terms: '',
  warranty_period: '',
  valid_from: null as any,
  valid_to: null as any,
  remarks: ''
})

const rules = {
  material_id: { required: true, message: '请选择耗材', trigger: 'change' },
  supplier_id: { required: true, message: '请选择供应商', trigger: 'change' },
  unit_price: { required: true, message: '请输入单价', trigger: 'blur', type: 'number', min: 0 }
}

async function loadOptions() {
  try {
    const [matRes, supRes] = await Promise.all([
      listMaterials({ page_size: 500, is_active: true }),
      listSuppliers({ page_size: 500 })
    ])
    if (matRes.code === 200) {
      materialOptions.value = matRes.data.items.map((m: any) => ({ label: `${m.code} - ${m.name}`, value: m.id }))
    }
    if (supRes.code === 200) {
      supplierOptions.value = supRes.data.items.map((s: any) => ({ label: s.name, value: s.id }))
    }
  } catch (e) {}
}

async function loadData() {
  loading.value = true
  try {
    const res = await listQuotes({
      page: pagination.page,
      page_size: pagination.pageSize,
      material_id: filterMaterial.value,
      supplier_id: filterSupplier.value,
      status: filterStatus.value
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
  filterSupplier.value = null
  filterStatus.value = null
  pagination.page = 1
  loadData()
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    if (dateRange.value && dateRange.value.length === 2) {
      formData.valid_from = dayjs(dateRange.value[0]).toDate()
      formData.valid_to = dayjs(dateRange.value[1]).toDate()
    }
    submitting.value = true
    await createQuote(formData)
    message.success('报价录入成功')
    showCreate.value = false
    Object.assign(formData, { material_id: null, supplier_id: null, unit_price: 0, tax_rate: 13, min_order_qty: 1, delivery_days: null, payment_terms: '', warranty_period: '', valid_from: null, valid_to: null, remarks: '' })
    dateRange.value = null
    loadData()
  } catch (e: any) {
    message.error(e.message || '录入失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadOptions()
  loadData()
})
</script>
