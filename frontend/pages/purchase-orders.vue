<template>
  <div>
    <n-page-header title="采购订单" subtitle="管理采购订单与跟踪交货进度">
      <template #extra>
        <n-button type="primary" @click="showCreate = true">
          <template #icon><CartOutline /></template>
          创建订单
        </n-button>
      </template>
    </n-page-header>

    <n-card style="margin-top: 16px;">
      <n-space vertical :size="16">
        <n-space>
          <n-input v-model:value="searchKeyword" placeholder="搜索订单号" clearable style="width: 200px;" />
          <n-select v-model:value="filterStatus" :options="statusOptions" placeholder="订单状态" clearable style="width: 140px;" />
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

    <n-modal v-model:show="showCreate" preset="card" title="创建采购订单" style="width: 680px;">
      <n-form ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="110px">
        <n-grid :cols="2" :x-gap="12">
          <n-form-item label="关联需求单" path="pr_id">
            <n-select v-model:value="formData.pr_id" :options="prOptions" placeholder="选择采购需求" filterable />
          </n-form-item>
          <n-form-item label="供应商" path="supplier_id">
            <n-select v-model:value="formData.supplier_id" :options="supplierOptions" placeholder="选择供应商" filterable />
          </n-form-item>
          <n-form-item label="预计交货日期">
            <n-date-picker v-model:value="formData.expected_delivery_date" type="date" style="width: 100%;" />
          </n-form-item>
          <n-form-item label="付款条款">
            <n-input v-model:value="formData.payment_terms" placeholder="如: 月结30天" />
          </n-form-item>
          <n-form-item label="送货地址" :span="2">
            <n-input v-model:value="formData.delivery_address" placeholder="详细送货地址" />
          </n-form-item>
          <n-form-item label="备注" :span="2">
            <n-input v-model:value="formData.remarks" type="textarea" :rows="2" placeholder="备注说明" />
          </n-form-item>
        </n-grid>

        <n-divider>订单明细</n-divider>
        <n-data-table
          :columns="itemColumns"
          :data="formData.items"
          :bordered="true"
          size="small"
        />
        <n-space style="margin-top: 8px;">
          <n-button size="small" type="primary" ghost @click="addItem">添加明细</n-button>
          <n-text strong>
            合计: ¥{{ formData.items.reduce((s: number, i: any) => s + i.quantity * i.unit_price, 0).toLocaleString() }}
          </n-text>
        </n-space>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreate = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSubmit">创建订单</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showView" preset="card" title="采购订单详情" style="width: 760px;">
      <n-descriptions :column="2" bordered v-if="viewData">
        <n-descriptions-item label="订单号">{{ viewData.po_no }}</n-descriptions-item>
        <n-descriptions-item label="状态">
          <n-tag :type="getStatusTag(viewData.status).type">{{ getStatusTag(viewData.status).label }}</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="需求单号" :span="2">{{ viewData.purchase_request?.pr_no || '-' }}</n-descriptions-item>
        <n-descriptions-item label="供应商" :span="2">{{ viewData.supplier?.name || '-' }}</n-descriptions-item>
        <n-descriptions-item label="预计交货">{{ viewData.expected_delivery_date ? dayjs(viewData.expected_delivery_date).format('YYYY-MM-DD') : '-' }}</n-descriptions-item>
        <n-descriptions-item label="实际交货">{{ viewData.actual_delivery_date ? dayjs(viewData.actual_delivery_date).format('YYYY-MM-DD') : '-' }}</n-descriptions-item>
        <n-descriptions-item label="付款条款">{{ viewData.payment_terms || '-' }}</n-descriptions-item>
        <n-descriptions-item label="订单总额">¥{{ viewData.grand_total?.toLocaleString() }}</n-descriptions-item>
        <n-descriptions-item label="送货地址" :span="2">{{ viewData.delivery_address || '-' }}</n-descriptions-item>
        <n-descriptions-item label="备注" :span="2">{{ viewData.remarks || '-' }}</n-descriptions-item>
      </n-descriptions>
      <n-divider>订单明细</n-divider>
      <n-data-table
        :columns="viewItemColumns"
        :data="viewData?.items || []"
        :bordered="true"
        size="small"
      />
      <template #footer>
        <n-space justify="end">
          <n-button @click="showView = false">关闭</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showDelivery" preset="card" title="更新交货信息" style="width: 520px;">
      <n-form :model="deliveryForm" label-placement="left" label-width="120px">
        <n-form-item label="订单号">
          <n-input :value="viewData?.po_no" disabled />
        </n-form-item>
        <n-form-item label="预计交货日期">
          <n-date-picker v-model:value="deliveryForm.expected_delivery_date" type="date" style="width: 100%;" />
        </n-form-item>
        <n-form-item label="实际交货日期">
          <n-date-picker v-model:value="deliveryForm.actual_delivery_date" type="date" style="width: 100%;" />
        </n-form-item>
        <n-form-item label="订单状态">
          <n-select v-model:value="deliveryForm.status" :options="[
            { label: '已确认', value: 'confirmed' },
            { label: '部分交货', value: 'partial_delivered' },
            { label: '已交货', value: 'delivered' },
            { label: '已完成', value: 'completed' }
          ]" />
        </n-form-item>
        <n-form-item label="变更原因">
          <n-input v-model:value="deliveryForm.change_reason" type="textarea" :rows="3" placeholder="如交期有变化请说明原因" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showDelivery = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleDeliverySubmit">确定</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { useMessage, type DataTableColumns } from 'naive-ui'
import { CartOutline, AddOutline } from '@vicons/ionicons5'
import { listPurchaseOrders, createPurchaseOrder, listSuppliers, listPurchaseRequests, getPurchaseOrder, updatePurchaseOrder } from '~/api'
import dayjs from 'dayjs'

const message = useMessage()
const loading = ref(false)
const submitting = ref(false)
const showCreate = ref(false)
const showView = ref(false)
const showDelivery = ref(false)
const viewData = ref<any>(null)
const deliveryForm = reactive({
  expected_delivery_date: null as number | null,
  actual_delivery_date: null as number | null,
  status: 'confirmed',
  change_reason: ''
})
const formRef = ref()
const searchKeyword = ref('')
const filterStatus = ref<string | null>(null)
const filterSupplier = ref<number | null>(null)

const dataList = ref<any[]>([])
const supplierOptions = ref<any[]>([])
const prOptions = ref<any[]>([])
const statusOptions = [
  { label: '待发送', value: 'pending' },
  { label: '已发送', value: 'sent' },
  { label: '已确认', value: 'confirmed' },
  { label: '部分交货', value: 'partial_delivered' },
  { label: '已交货', value: 'delivered' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' }
]

const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
})

function getStatusTag(type: string) {
  const map: Record<string, any> = {
    pending: 'default', sent: 'info', confirmed: 'warning', partial_delivered: 'warning',
    delivered: 'success', completed: 'success', cancelled: 'error'
  }
  const label: Record<string, string> = {
    pending: '待发送', sent: '已发送', confirmed: '已确认', partial_delivered: '部分交货',
    delivered: '已交货', completed: '已完成', cancelled: '已取消'
  }
  return { type: map[type] || 'default', label: label[type] || type }
}

const columns: DataTableColumns = [
  { title: '订单号', key: 'po_no', width: 140 },
  { title: '需求单号', key: 'purchase_request', width: 120, render: (row: any) =>
    row.purchase_request?.pr_no || `PR${row.pr_id}`
  },
  { title: '供应商', key: 'supplier_id', width: 140, render: (row: any) =>
    row.supplier?.name || '-'
  },
  { title: '订单总额', key: 'grand_total', width: 130, render: (row: any) =>
    h('n-strong', null, () => `¥${row.grand_total.toLocaleString()}`)
  },
  { title: '预计交货', key: 'expected_delivery_date', width: 110, render: (row: any) =>
    row.expected_delivery_date ? dayjs(row.expected_delivery_date).format('YYYY-MM-DD') : '-'
  },
  { title: '实际交货', key: 'actual_delivery_date', width: 110, render: (row: any) =>
    row.actual_delivery_date ? dayjs(row.actual_delivery_date).format('YYYY-MM-DD') : '-'
  },
  { title: '交货天数', key: 'delivery_days_actual', width: 90, render: (row: any) => row.delivery_days_actual != null ? `${row.delivery_days_actual}天` : '-' },
  { title: '状态', key: 'status', width: 90, render: (row: any) => {
      const s = getStatusTag(row.status)
      return h('n-tag', { type: s.type }, { default: () => s.label })
  }},
  { title: '创建时间', key: 'created_at', width: 160, render: (row: any) => dayjs(row.created_at).format('YYYY-MM-DD HH:mm') },
  { title: '操作', key: 'actions', width: 150, render: (row: any) =>
    h('n-space', null, () => [
      h('n-button', { size: 'small', onClick: () => handleView(row) }, () => '查看'),
      h('n-button', { size: 'small', type: 'warning', onClick: () => handleUpdateDelivery(row) }, () => '更新交期')
    ])
  }
]

const itemColumns: DataTableColumns = [
  { title: '耗材ID', key: 'material_id', render: (_: any, index: number) =>
    h('n-input-number', { value: formData.items[index].material_id, min: 1, style: 'width: 100px', onUpdateValue: (v: any) => formData.items[index].material_id = v })
  },
  { title: '数量', key: 'quantity', width: 110, render: (_: any, index: number) =>
    h('n-input-number', { value: formData.items[index].quantity, min: 1, onUpdateValue: (v: any) => formData.items[index].quantity = v })
  },
  { title: '单价(元)', key: 'unit_price', width: 130, render: (_: any, index: number) =>
    h('n-input-number', { value: formData.items[index].unit_price, min: 0, precision: 2, onUpdateValue: (v: any) => formData.items[index].unit_price = v })
  },
  { title: '小计', key: 'subtotal', width: 110, render: (_: any, index: number) =>
    `¥${(formData.items[index].quantity * formData.items[index].unit_price).toLocaleString()}`
  },
  { title: '操作', key: 'actions', width: 70, render: (_: any, index: number) =>
    h('n-button', { size: 'small', type: 'error', quaternary: true, onClick: () => removeItem(index) }, () => '删除')
  }
]

const viewItemColumns: DataTableColumns = [
  { title: '耗材ID', key: 'material_id', width: 100 },
  { title: '数量', key: 'quantity', width: 100 },
  { title: '单价(元)', key: 'unit_price', width: 120, render: (row: any) => `¥${row.unit_price?.toFixed(2)}` },
  { title: '小计(元)', key: 'subtotal', width: 120, render: (row: any) => `¥${(row.quantity * row.unit_price)?.toFixed(2)}` }
]

const formData = reactive({
  pr_id: null as number | null,
  supplier_id: null as number | null,
  delivery_address: '',
  expected_delivery_date: null as number | null,
  payment_terms: '',
  remarks: '',
  items: [{ material_id: 0, quantity: 1, unit_price: 0 }]
})

const rules = {
  pr_id: { required: true, message: '请选择采购需求', trigger: 'change' },
  supplier_id: { required: true, message: '请选择供应商', trigger: 'change' }
}

function addItem() {
  formData.items.push({ material_id: 0, quantity: 1, unit_price: 0 })
}

function removeItem(index: number) {
  if (formData.items.length > 1) formData.items.splice(index, 1)
}

async function loadOptions() {
  try {
    const [supRes, prRes] = await Promise.all([
      listSuppliers({ page_size: 500 }),
      listPurchaseRequests({ page_size: 500 })
    ])
    if (supRes.code === 200) supplierOptions.value = supRes.data.items.map((s: any) => ({ label: s.name, value: s.id }))
    if (prRes.code === 200) prOptions.value = prRes.data.items.map((p: any) => ({ label: `${p.pr_no} - ${p.title}`, value: p.id }))
  } catch (e) {}
}

async function loadData() {
  loading.value = true
  try {
    const res = await listPurchaseOrders({
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

async function handleView(row: any) {
  try {
    const res = await getPurchaseOrder(row.id)
    if (res.code === 200) {
      viewData.value = res.data
      showView.value = true
    }
  } catch (e: any) {
    message.error(e.message || '加载失败')
  }
}

async function handleUpdateDelivery(row: any) {
  try {
    const res = await getPurchaseOrder(row.id)
    if (res.code === 200) {
      viewData.value = res.data
      deliveryForm.expected_delivery_date = res.data.expected_delivery_date ? dayjs(res.data.expected_delivery_date).valueOf() : null
      deliveryForm.actual_delivery_date = res.data.actual_delivery_date ? dayjs(res.data.actual_delivery_date).valueOf() : null
      deliveryForm.status = res.data.status
      deliveryForm.change_reason = ''
      showDelivery.value = true
    }
  } catch (e: any) {
    message.error(e.message || '加载失败')
  }
}

async function handleDeliverySubmit() {
  try {
    submitting.value = true
    const updateData: any = {
      status: deliveryForm.status
    }
    if (deliveryForm.expected_delivery_date) {
      updateData.expected_delivery_date = dayjs(deliveryForm.expected_delivery_date).toDate()
    }
    if (deliveryForm.actual_delivery_date) {
      updateData.actual_delivery_date = dayjs(deliveryForm.actual_delivery_date).toDate()
    }
    if (deliveryForm.change_reason) {
      updateData.delivery_change_reason = deliveryForm.change_reason
    }
    await updatePurchaseOrder(viewData.value.id, updateData)
    message.success('交货信息更新成功')
    showDelivery.value = false
    loadData()
  } catch (e: any) {
    message.error(e.message || '更新失败')
  } finally {
    submitting.value = false
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    const validItems = formData.items.filter((i: any) => i.material_id > 0 && i.quantity > 0)
    if (validItems.length === 0) {
      message.warning('请填写有效的订单明细')
      return
    }
    submitting.value = true
    await createPurchaseOrder({ ...formData, items: validItems })
    message.success('订单创建成功')
    showCreate.value = false
    Object.assign(formData, { pr_id: null, supplier_id: null, delivery_address: '', expected_delivery_date: null, payment_terms: '', remarks: '', items: [{ material_id: 0, quantity: 1, unit_price: 0 }] })
    loadData()
  } catch (e: any) {
    message.error(e.message || '创建失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadOptions()
  loadData()
})
</script>
