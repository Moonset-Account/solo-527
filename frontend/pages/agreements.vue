<template>
  <div>
    <n-page-header title="框架协议" subtitle="供应商框架协议管理与执行跟踪">
      <template #extra>
        <n-button type="primary" @click="showCreate = true">
          <template #icon><DocumentTextOutline /></template>
          新建协议
        </n-button>
      </template>
    </n-page-header>

    <n-card style="margin-top: 16px;">
      <n-space vertical :size="16">
        <n-space>
          <n-input v-model:value="searchKeyword" placeholder="搜索协议号/标题" clearable style="width: 240px;" />
          <n-select v-model:value="filterStatus" :options="statusOptions" placeholder="协议状态" clearable style="width: 140px;" />
          <n-select v-model:value="filterSupplier" :options="supplierOptions" placeholder="供应商" clearable style="width: 180px;" filterable />
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

    <n-modal v-model:show="showCreate" preset="card" title="新建框架协议" style="width: 680px;">
      <n-form ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="110px">
        <n-grid :cols="2" :x-gap="12">
          <n-form-item label="协议标题" path="title" :span="2">
            <n-input v-model:value="formData.title" placeholder="请输入协议标题" />
          </n-form-item>
          <n-form-item label="供应商" path="supplier_id">
            <n-select v-model:value="formData.supplier_id" :options="supplierOptions" placeholder="选择供应商" filterable />
          </n-form-item>
          <n-form-item label="预估总金额">
            <n-input-number v-model:value="formData.total_estimated_amount" style="width: 100%;" :min="0" :precision="2" />
          </n-form-item>
          <n-form-item label="协议有效期" path="effective_date">
            <n-date-picker v-model:value="dateRange" type="daterange" style="width: 100%;" />
          </n-form-item>
          <n-form-item label="付款条款">
            <n-input v-model:value="formData.payment_terms" placeholder="如: 月结60天" />
          </n-form-item>
          <n-form-item label="交货条款" :span="2">
            <n-input v-model:value="formData.delivery_terms" placeholder="交货相关条款" />
          </n-form-item>
          <n-form-item label="备注" :span="2">
            <n-input v-model:value="formData.remarks" type="textarea" :rows="2" placeholder="备注说明" />
          </n-form-item>
        </n-grid>

        <n-divider>协议明细(耗材限价)</n-divider>
        <n-data-table
          :columns="itemColumns"
          :data="formData.items"
          :bordered="true"
          size="small"
        />
        <n-button size="small" type="primary" ghost style="margin-top: 8px;" @click="addItem">添加明细</n-button>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreate = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSubmit">创建协议</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { useMessage, type DataTableColumns } from 'naive-ui'
import { DocumentTextOutline, AddOutline } from '@vicons/ionicons5'
import { listAgreements, createAgreement, listSuppliers } from '~/api'
import dayjs from 'dayjs'

const message = useMessage()
const loading = ref(false)
const submitting = ref(false)
const showCreate = ref(false)
const formRef = ref()
const searchKeyword = ref('')
const filterStatus = ref<string | null>(null)
const filterSupplier = ref<number | null>(null)
const dateRange = ref<number[] | null>(null)

const dataList = ref<any[]>([])
const supplierOptions = ref<any[]>([])
const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '执行中', value: 'active' },
  { label: '已到期', value: 'expired' },
  { label: '已终止', value: 'terminated' }
]

const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
})

function getStatusTag(type: string) {
  const map: Record<string, any> = { draft: 'default', active: 'success', expired: 'warning', terminated: 'error' }
  const label: Record<string, string> = { draft: '草稿', active: '执行中', expired: '已到期', terminated: '已终止' }
  return { type: map[type] || 'default', label: label[type] || type }
}

const columns: DataTableColumns = [
  { title: '协议编号', key: 'agreement_no', width: 140 },
  { title: '协议标题', key: 'title', width: 180, ellipsis: { tooltip: true } },
  { title: '供应商', key: 'supplier_id', width: 140 },
  { title: '预估金额', key: 'total_estimated_amount', width: 120, render: (row: any) =>
    h('n-strong', null, () => `¥${row.total_estimated_amount.toLocaleString()}`)
  },
  { title: '已使用', key: 'used_amount', width: 110, render: (row: any) => `¥${row.used_amount.toLocaleString()}` },
  { title: '剩余额度', key: 'remaining_amount', width: 110, render: (row: any) =>
    h('n-tag', { type: row.remaining_amount > 0 ? 'success' : 'error' }, { default: () => `¥${row.remaining_amount.toLocaleString()}` })
  },
  { title: '有效期', key: 'period', width: 200, render: (row: any) =>
    `${dayjs(row.effective_date).format('YYYY-MM-DD')} ~ ${dayjs(row.expiry_date).format('YYYY-MM-DD')}`
  },
  { title: '状态', key: 'status', width: 90, render: (row: any) => {
      const s = getStatusTag(row.status)
      return h('n-tag', { type: s.type }, { default: () => s.label })
  }},
  { title: '创建时间', key: 'created_at', width: 160, render: (row: any) => dayjs(row.created_at).format('YYYY-MM-DD HH:mm') }
]

const itemColumns: DataTableColumns = [
  { title: '耗材ID', key: 'material_id', render: (_: any, index: number) =>
    h('n-input-number', { value: formData.items[index].material_id, min: 1, style: 'width: 100px', onUpdateValue: (v: any) => formData.items[index].material_id = v })
  },
  { title: '协议单价', key: 'unit_price', width: 130, render: (_: any, index: number) =>
    h('n-input-number', { value: formData.items[index].unit_price, min: 0, precision: 2, onUpdateValue: (v: any) => formData.items[index].unit_price = v })
  },
  { title: '最小起订', key: 'min_order_qty', width: 110, render: (_: any, index: number) =>
    h('n-input-number', { value: formData.items[index].min_order_qty, min: 1, onUpdateValue: (v: any) => formData.items[index].min_order_qty = v })
  },
  { title: '交货天数', key: 'delivery_days', width: 110, render: (_: any, index: number) =>
    h('n-input-number', { value: formData.items[index].delivery_days, min: 0, onUpdateValue: (v: any) => formData.items[index].delivery_days = v })
  },
  { title: '操作', key: 'actions', width: 70, render: (_: any, index: number) =>
    h('n-button', { size: 'small', type: 'error', quaternary: true, onClick: () => removeItem(index) }, () => '删除')
  }
]

const formData = reactive({
  title: '',
  supplier_id: null as number | null,
  total_estimated_amount: 0,
  effective_date: null as any,
  expiry_date: null as any,
  payment_terms: '',
  delivery_terms: '',
  remarks: '',
  items: [{ material_id: 0, unit_price: 0, min_order_qty: 1, delivery_days: 0 }]
})

const rules = {
  title: { required: true, message: '请输入协议标题', trigger: 'blur' },
  supplier_id: { required: true, message: '请选择供应商', trigger: 'change' }
}

function addItem() {
  formData.items.push({ material_id: 0, unit_price: 0, min_order_qty: 1, delivery_days: 0 })
}

function removeItem(index: number) {
  if (formData.items.length > 1) formData.items.splice(index, 1)
}

async function loadSuppliers() {
  try {
    const res = await listSuppliers({ page_size: 500 })
    if (res.code === 200) supplierOptions.value = res.data.items.map((s: any) => ({ label: s.name, value: s.id }))
  } catch (e) {}
}

async function loadData() {
  loading.value = true
  try {
    const res = await listAgreements({
      page: pagination.page,
      page_size: pagination.pageSize,
      keyword: searchKeyword.value,
      status: filterStatus.value,
      supplier_id: filterSupplier.value
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
  filterStatus.value = null
  filterSupplier.value = null
  pagination.page = 1
  loadData()
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    if (!dateRange.value || dateRange.value.length !== 2) {
      message.warning('请选择协议有效期')
      return
    }
    formData.effective_date = dayjs(dateRange.value[0]).toDate()
    formData.expiry_date = dayjs(dateRange.value[1]).toDate()
    const validItems = formData.items.filter((i: any) => i.material_id > 0)
    if (validItems.length === 0) {
      message.warning('请填写有效的协议明细')
      return
    }
    submitting.value = true
    await createAgreement({ ...formData, items: validItems })
    message.success('协议创建成功')
    showCreate.value = false
    Object.assign(formData, { title: '', supplier_id: null, total_estimated_amount: 0, effective_date: null, expiry_date: null, payment_terms: '', delivery_terms: '', remarks: '', items: [{ material_id: 0, unit_price: 0, min_order_qty: 1, delivery_days: 0 }] })
    dateRange.value = null
    loadData()
  } catch (e: any) {
    message.error(e.message || '创建失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadSuppliers()
  loadData()
})
</script>
