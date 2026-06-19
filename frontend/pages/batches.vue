<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">批次效期维护</h2>
      <n-space v-if="auth.isPurchaser || auth.isWarehouse">
        <n-button type="primary" @click="openAdd">新增批次入库</n-button>
      </n-space>
    </div>

    <div class="filter-bar">
      <n-form inline :model="filters">
        <n-form-item label="关键词">
          <n-input v-model:value="filters.keyword" placeholder="批号/药品名" clearable style="width: 200px" />
        </n-form-item>
        <n-form-item label="状态">
          <n-select v-model:value="filters.status" :options="statusOptions" clearable placeholder="全部" style="width: 130px" />
        </n-form-item>
        <n-form-item label="仅近效期">
          <n-switch v-model:value="filters.near_expiry_only" />
        </n-form-item>
        <n-form-item label="仅含差异">
          <n-switch v-model:value="filters.sign_diff_only" />
        </n-form-item>
        <n-form-item label="效期范围">
          <n-date-picker v-model:value="filters.expiry_range" type="daterange" clearable style="width: 260px" />
        </n-form-item>
        <n-form-item><n-button type="primary" @click="loadData">查询</n-button></n-form-item>
      </n-form>
    </div>

    <div class="content-area">
      <n-data-table
        :columns="columns"
        :data="dataList"
        :loading="loading"
        :pagination="pagination"
        @update:page="p => { pagination.page = p; loadData() }"
        @update:page-size="s => { pagination.pageSize = s; pagination.page = 1; loadData() }"
        bordered striped
      >
        <template #status="{ row }">
          <n-tag :type="statusTagType(row.status)" size="small">{{ statusText(row.status) }}</n-tag>
        </template>
        <template #expiry="{ row }">
          <n-tag :type="expiryTagType(row)" size="small" :class="expiryTagClass(row)">
            {{ row.expiry_date }} ({{ daysLeft(row) }}天)
          </n-tag>
        </template>
        <template #sign_diff="{ row }">
          <span v-if="row.sign_difference && Number(row.sign_difference) !== 0" class="critical">
            ¥{{ row.sign_difference }}
          </span>
          <span v-else>-</span>
        </template>
        <template #action="{ row }">
          <n-button-group size="small">
            <n-button @click="goTrace(row)">追溯</n-button>
            <n-button @click="openEdit(row)" v-if="auth.isPurchaser || auth.isWarehouse">编辑</n-button>
          </n-button-group>
        </template>
      </n-data-table>
    </div>

    <n-modal v-model:show="modal.show" preset="card" :title="modal.isEdit ? '编辑批次' : '新增批次入库'" style="width: 760px">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="110px">
        <n-grid :cols="2" :x-gap="16">
          <n-form-item label="批号" path="batch_no"><n-input v-model:value="form.batch_no" :disabled="modal.isEdit" /></n-form-item>
          <n-form-item label="药品" path="medicine_id">
            <n-select v-model:value="form.medicine_id" :options="medicineOptions" filterable clearable />
          </n-form-item>
          <n-form-item label="供应商" path="supplier_id">
            <n-select v-model:value="form.supplier_id" :options="supplierOptions" filterable clearable />
          </n-form-item>
          <n-form-item label="采购订单号"><n-input v-model:value="form.purchase_order_no" /></n-form-item>
          <n-form-item label="生产日期" path="production_date">
            <n-date-picker v-model:value="form.production_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
          </n-form-item>
          <n-form-item label="有效期至" path="expiry_date">
            <n-date-picker v-model:value="form.expiry_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
          </n-form-item>
          <n-form-item label="入库数量" path="quantity">
            <n-input-number v-model:value="form.quantity" :min="1" style="width: 100%" />
          </n-form-item>
          <n-form-item label="实收数量">
            <n-input-number v-model:value="form.received_quantity" :min="0" style="width: 100%" />
          </n-form-item>
          <n-form-item label="采购单价">
            <n-input-number v-model:value="form.purchase_price" :min="0" :precision="2" style="width: 100%" />
          </n-form-item>
          <n-form-item label="销售单价">
            <n-input-number v-model:value="form.selling_price" :min="0" :precision="2" style="width: 100%" />
          </n-form-item>
          <n-form-item label="存放库位" path="location_id">
            <n-select v-model:value="form.location_id" :options="locationOptions" filterable clearable />
          </n-form-item>
          <n-form-item label="检验报告号">
            <n-input v-model:value="form.inspection_report_no" />
          </n-form-item>
          <n-form-item label="合格证号" path="certificate_no">
            <n-input v-model:value="form.certificate_no" />
          </n-form-item>
          <n-form-item label="批次状态">
            <n-select v-model:value="form.status" :options="statusOptions" />
          </n-form-item>
          <n-form-item label="签收差异备注" :span="2">
            <n-input v-model:value="form.sign_difference_remark" type="textarea" :rows="2" />
          </n-form-item>
          <n-form-item label="备注" :span="2">
            <n-input v-model:value="form.remark" type="textarea" :rows="2" />
          </n-form-item>
        </n-grid>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="modal.show = false">取消</n-button>
          <n-button type="primary" :loading="saving" @click="save">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  NSpace, NButton, NForm, NFormItem, NInput, NSelect, NDataTable, NModal,
  NInputNumber, NSwitch, NGrid, NDatePicker, NTag, NButtonGroup, useMessage
} from 'naive-ui'
import dayjs from 'dayjs'
import { useAuthStore } from '~/stores/auth'
import { apiClient } from '~/utils/api'

const message = useMessage()
const auth = useAuthStore()
const loading = ref(false); const saving = ref(false); const formRef = ref()

const filters = reactive({
  keyword: '', status: null as any, near_expiry_only: false, sign_diff_only: false,
  expiry_range: null as any
})
const pagination = reactive({ page: 1, pageSize: 20, itemCount: 0 })
const dataList = ref<any[]>([])
const medicineOptions = ref<any[]>([])
const supplierOptions = ref<any[]>([])
const locationOptions = ref<any[]>([])

const statusOptions = [
  { label: '在库', value: 'in_stock' },
  { label: '部分出库', value: 'partial' },
  { label: '售罄', value: 'sold_out' },
  { label: '已过期', value: 'expired' },
  { label: '已召回', value: 'recalled' }
]

const columns = [
  { title: '批号', key: 'batch_no', width: 140, fixed: 'left' },
  { title: '药品名称', key: ['medicine', 'name'], width: 160, render: (r: any) => r.medicine?.name },
  { title: '规格', key: ['medicine', 'specification'], width: 120, render: (r: any) => r.medicine?.specification },
  { title: '供应商', key: ['supplier', 'name'], width: 120, render: (r: any) => r.supplier?.name || '-' },
  { title: '生产日期', key: 'production_date', width: 110 },
  { title: '有效期(剩)', key: 'expiry', width: 180 },
  { title: '数量', key: 'quantity', width: 90 },
  { title: '实收', key: 'received_quantity', width: 80 },
  { title: '采购价', key: 'purchase_price', width: 90, render: (r: any) => r.purchase_price ? '¥' + r.purchase_price : '-' },
  { title: '签收差异', key: 'sign_diff', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建人', key: ['creator', 'full_name'], width: 100, render: (r: any) => r.creator?.full_name || '-' },
  { title: '操作', key: 'action', width: 140, fixed: 'right' }
]

function statusTagType(s: string) {
  const m: Record<string, any> = { in_stock: 'success', partial: 'info', sold_out: 'warning', expired: 'error', recalled: 'error' }
  return m[s] || 'default'
}
function statusText(s: string) {
  const m: Record<string, string> = { in_stock: '在库', partial: '部分出库', sold_out: '售罄', expired: '已过期', recalled: '已召回' }
  return m[s] || s
}
function daysLeft(row: any) { return dayjs(row.expiry_date).diff(dayjs(), 'day') }
function expiryTagType(row: any) {
  const d = daysLeft(row)
  if (d < 0) return 'error'
  if (d <= 30) return 'error'
  if (d <= 90) return 'warning'
  if (d <= 180) return 'info'
  return 'success'
}
function expiryTagClass(row: any) {
  const d = daysLeft(row)
  if (d < 0 || d <= 30) return 'tag-critical'
  if (d <= 90) return 'tag-high'
  if (d <= 180) return 'tag-medium'
  return 'tag-low'
}

const modal = reactive({ show: false, isEdit: false, id: 0 })
const form = reactive({
  batch_no: '', medicine_id: null as any, supplier_id: null as any,
  purchase_order_no: '', production_date: null as any, expiry_date: null as any,
  quantity: 0, received_quantity: 0, purchase_price: 0, selling_price: 0,
  location_id: null as any, inspection_report_no: '', certificate_no: '',
  status: 'in_stock', sign_difference_remark: '', remark: ''
})
const rules = {
  batch_no: { required: true, message: '请输入批号', trigger: 'blur' },
  medicine_id: { required: true, message: '请选择药品', trigger: 'change' },
  production_date: { required: true, message: '请选择生产日期', trigger: 'change' },
  expiry_date: { required: true, message: '请选择有效期', trigger: 'change' },
  quantity: { required: true, message: '请输入数量', trigger: 'change', type: 'number', min: 1 }
}

function resetForm() {
  Object.assign(form, {
    batch_no: '', medicine_id: null, supplier_id: null, purchase_order_no: '',
    production_date: null, expiry_date: null, quantity: 0, received_quantity: 0,
    purchase_price: 0, selling_price: 0, location_id: null,
    inspection_report_no: '', certificate_no: '', status: 'in_stock',
    sign_difference_remark: '', remark: ''
  })
}
function openAdd() { resetForm(); modal.isEdit = false; modal.id = 0; modal.show = true }
function openEdit(row: any) {
  Object.assign(form, row)
  modal.isEdit = true; modal.id = row.id; modal.show = true
}
function goTrace(row: any) {
  navigateTo({ path: '/trace', query: { batch_no: row.batch_no } })
  setTimeout(() => {
    const inputEl: any = document.querySelector('input[placeholder="请输入完整批号"]')
    if (inputEl) { inputEl.value = row.batch_no; inputEl.dispatchEvent(new Event('input')) }
  }, 300)
}
async function save() {
  try {
    await formRef.value?.validate(); saving.value = true
    if (modal.isEdit) await apiClient.put<any>(`/batches/${modal.id}`, form)
    else await apiClient.post<any>('/batches', form)
    message.success('保存成功'); modal.show = false; loadData()
  } catch (e: any) { message.error(e?.detail || '保存失败') }
  finally { saving.value = false }
}
async function loadMeta() {
  try {
    const [meds, sups, locs] = await Promise.all([
      apiClient.get<any>('/medicines', { page: 1, page_size: 1000, is_active: true }),
      apiClient.get<any>('/suppliers', { page: 1, page_size: 500, is_active: true }),
      apiClient.get<any>('/locations', { page: 1, page_size: 500 })
    ])
    medicineOptions.value = (meds.items || []).map((x: any) => ({ label: `${x.name} ${x.specification}`, value: x.id }))
    supplierOptions.value = (sups.items || []).map((x: any) => ({ label: x.name, value: x.id }))
    locationOptions.value = (locs.items || []).map((x: any) => ({ label: `${x.code} - ${x.name}`, value: x.id }))
  } catch (e) {}
}
async function loadData() {
  loading.value = true
  try {
    const params: any = { page: pagination.page, page_size: pagination.pageSize, ...filters }
    if (filters.expiry_range) {
      params.expiry_from = filters.expiry_range[0]
      params.expiry_to = filters.expiry_range[1]
    }
    delete params.expiry_range
    const res = await apiClient.get<any>('/batches', params)
    dataList.value = res.items || []; pagination.itemCount = res.total || 0
  } catch (e: any) { message.error(e?.detail || '加载失败') }
  finally { loading.value = false }
}
onMounted(() => { auth.init(); if (!auth.isLoggedIn) return navigateTo('/login'); loadMeta(); loadData() })
definePageMeta({ layout: 'default' })
</script>
