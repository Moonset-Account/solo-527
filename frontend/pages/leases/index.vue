<template>
  <MainLayout>
    <div class="leases-page">
      <n-card :bordered="false">
        <div class="filter-section">
          <n-form inline :model="queryForm">
            <n-form-item label="关键词">
              <n-input
                v-model:value="queryForm.keyword"
                placeholder="租约编号/租客/房源"
                clearable
                style="width: 200px"
              />
            </n-form-item>
            <n-form-item label="租约类型">
              <n-select
                v-model:value="queryForm.lease_type"
                placeholder="请选择"
                clearable
                style="width: 150px"
                :options="leaseTypeOptions"
              />
            </n-form-item>
            <n-form-item label="状态">
              <n-select
                v-model:value="queryForm.status"
                placeholder="请选择"
                clearable
                style="width: 150px"
                :options="statusOptions"
              />
            </n-form-item>
            <n-form-item label="开始日期">
              <n-date-picker
                v-model:value="dateRange"
                type="daterange"
                clearable
                style="width: 260px"
              />
            </n-form-item>
            <n-form-item>
              <n-space>
                <n-button type="primary" @click="handleSearch">查询</n-button>
                <n-button @click="handleReset">重置</n-button>
              </n-space>
            </n-form-item>
          </n-form>
        </div>

        <div class="table-toolbar">
          <div class="toolbar-left">
            <n-button
              v-if="userStore.hasPermission('lease:manage')"
              type="primary"
              @click="handleCreate"
            >
              新增租约
            </n-button>
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
        :title="isEdit ? '编辑租约' : '新增租约'"
        style="width: 600px"
      >
        <n-form ref="formRef" :model="formData" :rules="formRules" label-placement="left" label-width="100px">
          <n-form-item label="房源" path="property_id">
            <n-select
              v-model:value="formData.property_id"
              placeholder="请选择房源"
              :options="propertyOptions"
              filterable
            />
          </n-form-item>
          <n-form-item label="租客" path="tenant_id">
            <n-select
              v-model:value="formData.tenant_id"
              placeholder="请选择租客"
              :options="tenantOptions"
              filterable
            />
          </n-form-item>
          <n-form-item label="租约类型" path="lease_type">
            <n-select
              v-model:value="formData.lease_type"
              placeholder="请选择"
              :options="leaseTypeOptions"
            />
          </n-form-item>
          <n-form-item label="开始日期" path="start_date">
            <n-date-picker v-model:value="formData.start_date" type="date" />
          </n-form-item>
          <n-form-item label="结束日期" path="end_date">
            <n-date-picker v-model:value="formData.end_date" type="date" />
          </n-form-item>
          <n-form-item label="月租金" path="rent_amount">
            <n-input-number v-model:value="formData.rent_amount" style="width: 100%" :min="0" />
          </n-form-item>
          <n-form-item label="押金" path="deposit_amount">
            <n-input-number v-model:value="formData.deposit_amount" style="width: 100%" :min="0" />
          </n-form-item>
          <n-form-item label="付款周期" path="payment_cycle">
            <n-select
              v-model:value="formData.payment_cycle"
              :options="[
                { label: '月付', value: 'monthly' },
                { label: '季付', value: 'quarterly' },
                { label: '半年付', value: 'half_year' },
                { label: '年付', value: 'yearly' },
              ]"
            />
          </n-form-item>
          <n-form-item label="付款日" path="payment_day">
            <n-input-number v-model:value="formData.payment_day" :min="1" :max="31" />
          </n-form-item>
          <n-form-item label="状态" path="status">
            <n-select v-model:value="formData.status" :options="statusOptions" />
          </n-form-item>
          <n-form-item label="备注" path="remark">
            <n-input v-model:value="formData.remark" type="textarea" :rows="3" />
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
import { useRouter } from 'vue-router'
import type { FormInst, FormRules, DataTableColumns } from 'naive-ui'
import MainLayout from '~/components/layout/MainLayout.vue'
import { getLeaseList, createLease, updateLease, deleteLease, getPropertyList, getTenantList } from '~/api/lease'
import type { Lease, Property, Tenant } from '~/types'
import { useUserStore } from '~/stores/user'
import { useMessageUtil, useDialogUtil } from '~/composables/useMessage'

const router = useRouter()
const userStore = useUserStore()
const { success, error } = useMessageUtil()
const { confirm } = useDialogUtil()

const loading = ref(false)
const tableData = ref<Lease[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
})

const queryForm = reactive({
  keyword: '',
  lease_type: '',
  status: '',
})

const dateRange = ref<[number, number] | null>(null)

const showModal = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInst | null>(null)
const editingId = ref<number | null>(null)

const formData = reactive({
  property_id: undefined as number | undefined,
  tenant_id: undefined as number | undefined,
  lease_type: '',
  start_date: null as number | null,
  end_date: null as number | null,
  rent_amount: 0,
  deposit_amount: 0,
  payment_cycle: 'monthly',
  payment_day: 1,
  status: 'pending',
  remark: '',
})

const formRules: FormRules = {
  property_id: [{ required: true, message: '请选择房源', trigger: 'change' }],
  tenant_id: [{ required: true, message: '请选择租客', trigger: 'change' }],
  lease_type: [{ required: true, message: '请选择租约类型', trigger: 'change' }],
  start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  end_date: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
  rent_amount: [{ required: true, message: '请输入月租金', trigger: 'blur' }],
}

const leaseTypeOptions = [
  { label: '办公室', value: 'office' },
  { label: '工位', value: 'desk' },
  { label: '会议室', value: 'meeting_room' },
  { label: '商铺', value: 'shop' },
]

const statusOptions = [
  { label: '待生效', value: 'pending' },
  { label: '生效中', value: 'active' },
  { label: '已到期', value: 'expired' },
  { label: '已终止', value: 'terminated' },
]

const propertyOptions = ref<{ label: string; value: number }[]>([])
const tenantOptions = ref<{ label: string; value: number }[]>([])

const columns: DataTableColumns<Lease> = [
  { title: '租约编号', key: 'lease_no', width: 160 },
  { title: '房源', key: 'property_id', width: 120, render: (row) => `房源#${row.property_id}` },
  { title: '租客', key: 'tenant_id', width: 120, render: (row) => `租客#${row.tenant_id}` },
  { title: '租约类型', key: 'lease_type', width: 100, render: (row) => getLeaseTypeLabel(row.lease_type) },
  { title: '开始日期', key: 'start_date', width: 120 },
  { title: '结束日期', key: 'end_date', width: 120 },
  { title: '月租金', key: 'rent_amount', width: 120, render: (row) => `¥${Number(row.rent_amount).toLocaleString()}` },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) => h('n-tag', { type: getStatusTagType(row.status) }, () => getStatusLabel(row.status)),
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: (row) => h('n-space', null, () => [
      h('n-button', { size: 'small', onClick: () => viewDetail(row.id) }, () => '详情'),
      userStore.hasPermission('lease:manage') ? h('n-button', { size: 'small', onClick: () => handleEdit(row) }, () => '编辑') : null,
      userStore.hasPermission('lease:manage') ? h('n-button', { size: 'small', type: 'error', onClick: () => handleDelete(row.id) }, () => '删除') : null,
    ]),
  },
]

function getLeaseTypeLabel(type: string): string {
  const map: Record<string, string> = {
    office: '办公室',
    desk: '工位',
    meeting_room: '会议室',
    shop: '商铺',
  }
  return map[type] || type
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '待生效',
    active: '生效中',
    expired: '已到期',
    terminated: '已终止',
  }
  return map[status] || status
}

function getStatusTagType(status: string): string {
  const map: Record<string, string> = {
    pending: 'warning',
    active: 'success',
    expired: 'default',
    terminated: 'error',
  }
  return map[status] || 'default'
}

async function loadData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      page_size: pagination.pageSize,
      ...queryForm,
    }
    if (dateRange.value) {
      params.start_date_from = new Date(dateRange.value[0]).toISOString().split('T')[0]
      params.start_date_to = new Date(dateRange.value[1]).toISOString().split('T')[0]
    }
    const res = await getLeaseList(params)
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

async function loadOptions() {
  try {
    const [propRes, tenantRes] = await Promise.all([
      getPropertyList({ page: 1, page_size: 100 }),
      getTenantList({ page: 1, page_size: 100 }),
    ])
    if (propRes.code === 200) {
      propertyOptions.value = propRes.data.items.map((p: Property) => ({
        label: p.name,
        value: p.id,
      }))
    }
    if (tenantRes.code === 200) {
      tenantOptions.value = tenantRes.data.items.map((t: Tenant) => ({
        label: t.name,
        value: t.id,
      }))
    }
  } catch (e) {
    console.error('加载选项失败', e)
  }
}

function handleSearch() {
  pagination.page = 1
  loadData()
}

function handleReset() {
  queryForm.keyword = ''
  queryForm.lease_type = ''
  queryForm.status = ''
  dateRange.value = null
  pagination.page = 1
  loadData()
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
    property_id: undefined,
    tenant_id: undefined,
    lease_type: '',
    start_date: null,
    end_date: null,
    rent_amount: 0,
    deposit_amount: 0,
    payment_cycle: 'monthly',
    payment_day: 1,
    status: 'pending',
    remark: '',
  })
  showModal.value = true
}

function handleEdit(row: Lease) {
  isEdit.value = true
  editingId.value = row.id
  Object.assign(formData, {
    property_id: row.property_id,
    tenant_id: row.tenant_id,
    lease_type: row.lease_type,
    start_date: new Date(row.start_date).getTime(),
    end_date: new Date(row.end_date).getTime(),
    rent_amount: row.rent_amount,
    deposit_amount: row.deposit_amount,
    payment_cycle: row.payment_cycle,
    payment_day: row.payment_day,
    status: row.status,
    remark: row.remark || '',
  })
  showModal.value = true
}

function viewDetail(id: number) {
  router.push(`/leases/${id}`)
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const data: any = { ...formData }
    if (data.start_date) {
      data.start_date = new Date(data.start_date).toISOString().split('T')[0]
    }
    if (data.end_date) {
      data.end_date = new Date(data.end_date).toISOString().split('T')[0]
    }

    if (isEdit.value && editingId.value) {
      await updateLease(editingId.value, data)
      success('更新成功')
    } else {
      await createLease(data)
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
  confirm('确认删除', '确定要删除这条租约吗？删除后不可恢复。', async () => {
    try {
      await deleteLease(id)
      success('删除成功')
      loadData()
    } catch (e: any) {
      error(e.message || '删除失败')
    }
  })
}

onMounted(() => {
  loadData()
  loadOptions()
})
</script>

<style scoped>
.leases-page {
  padding: 0;
}

.filter-section {
  margin-bottom: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
</style>
