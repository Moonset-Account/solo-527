<template>
  <div>
    <n-page-header title="供应商管理" subtitle="供应商信息维护与风险评估">
      <template #extra>
        <n-button type="primary" @click="showCreate = true">
          <template #icon><PersonAddOutline /></template>
          新增供应商
        </n-button>
      </template>
    </n-page-header>

    <n-card style="margin-top: 16px;">
      <n-space vertical :size="16">
        <n-space>
          <n-input v-model:value="searchKeyword" placeholder="搜索名称/编码/联系人" clearable style="width: 240px;" />
          <n-select v-model:value="filterRisk" :options="riskOptions" placeholder="风险等级" clearable style="width: 140px;" />
          <n-select v-model:value="filterStatus" :options="statusOptions" placeholder="合作状态" clearable style="width: 140px;" />
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

    <n-modal v-model:show="showCreate" preset="card" :title="editId ? '编辑供应商' : '新增供应商'" style="width: 640px;">
      <n-form ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="100px">
        <n-grid :cols="2" :x-gap="12">
          <n-form-item label="供应商名称" path="name" :span="2">
            <n-input v-model:value="formData.name" placeholder="请输入供应商全称" />
          </n-form-item>
          <n-form-item label="供应商编码" path="code">
            <n-input v-model:value="formData.code" placeholder="供应商编码" />
          </n-form-item>
          <n-form-item label="联系人">
            <n-input v-model:value="formData.contact_person" placeholder="联系人姓名" />
          </n-form-item>
          <n-form-item label="联系电话">
            <n-input v-model:value="formData.phone" placeholder="联系电话" />
          </n-form-item>
          <n-form-item label="邮箱">
            <n-input v-model:value="formData.email" placeholder="邮箱地址" />
          </n-form-item>
          <n-form-item label="税号">
            <n-input v-model:value="formData.tax_number" placeholder="纳税人识别号" />
          </n-form-item>
          <n-form-item label="开户行">
            <n-input v-model:value="formData.bank_name" placeholder="开户银行" />
          </n-form-item>
          <n-form-item label="银行账号">
            <n-input v-model:value="formData.bank_account" placeholder="银行账号" />
          </n-form-item>
          <n-form-item label="公司地址" :span="2">
            <n-input v-model:value="formData.address" placeholder="详细地址" />
          </n-form-item>
          <n-form-item label="备注" :span="2">
            <n-input v-model:value="formData.remarks" type="textarea" :rows="3" placeholder="备注说明" />
          </n-form-item>
        </n-grid>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="handleCancel">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSubmit">确定</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showRisk" preset="card" title="风险评估" style="width: 500px;">
      <n-form :model="riskFormData" label-placement="left" label-width="100px">
        <n-form-item label="供应商">
          <n-input :value="riskSupplier?.name" disabled />
        </n-form-item>
        <n-form-item label="风险等级">
          <n-select v-model:value="riskFormData.risk_level" :options="riskOptions" />
        </n-form-item>
        <n-form-item label="风险说明">
          <n-input v-model:value="riskFormData.risk_reason" type="textarea" :rows="4" placeholder="请说明风险原因" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showRisk = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleRiskSubmit">确定</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { useMessage, type DataTableColumns } from 'naive-ui'
import { PersonAddOutline, AlertTriangleOutline } from '@vicons/ionicons5'
import { listSuppliers, createSupplier, updateSupplier } from '~/api'
import dayjs from 'dayjs'

const message = useMessage()
const loading = ref(false)
const submitting = ref(false)
const showCreate = ref(false)
const showRisk = ref(false)
const editId = ref<number | null>(null)
const riskSupplier = ref<any>(null)
const riskFormData = reactive({ risk_level: 'low', risk_reason: '' })
const formRef = ref()
const searchKeyword = ref('')
const filterRisk = ref<string | null>(null)
const filterStatus = ref<string | null>(null)

const dataList = ref<any[]>([])

const riskOptions = [
  { label: '低风险', value: 'low' },
  { label: '中风险', value: 'medium' },
  { label: '高风险', value: 'high' },
  { label: '极高风险', value: 'critical' }
]
const statusOptions = [
  { label: '活跃', value: 'active' },
  { label: '待审核', value: 'pending' },
  { label: '暂停', value: 'suspended' },
  { label: '黑名单', value: 'blacklisted' }
]

const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
})

function getRiskTag(type: string) {
  const map: Record<string, any> = { low: 'success', medium: 'warning', high: 'error', critical: 'error' }
  const label: Record<string, string> = { low: '低风险', medium: '中风险', high: '高风险', critical: '极高风险' }
  return { type: map[type] || 'default', label: label[type] || type }
}
function getStatusTag(type: string) {
  const map: Record<string, any> = { active: 'success', pending: 'warning', suspended: 'default', blacklisted: 'error' }
  const label: Record<string, string> = { active: '活跃', pending: '待审核', suspended: '暂停', blacklisted: '黑名单' }
  return { type: map[type] || 'default', label: label[type] || type }
}

const columns: DataTableColumns = [
  { title: '编码', key: 'code', width: 100 },
  { title: '供应商名称', key: 'name', width: 180 },
  { title: '联系人', key: 'contact_person', width: 100 },
  { title: '电话', key: 'phone', width: 120 },
  { title: '风险等级', key: 'risk_level', width: 100, render: (row: any) => {
      const r = getRiskTag(row.risk_level)
      return h('n-tag', { type: r.type }, { default: () => r.label })
  }},
  { title: '合作状态', key: 'status', width: 100, render: (row: any) => {
      const s = getStatusTag(row.status)
      return h('n-tag', { type: s.type }, { default: () => s.label })
  }},
  { title: '信用评分', key: 'credit_rating', width: 90, render: (row: any) =>
    h('n-progress', { type: 'line', percentage: row.credit_rating, 'show-indicator': false, style: 'width: 80px' })
  },
  { title: '准时交货率', key: 'on_time_delivery_rate', width: 100, render: (row: any) => `${row.on_time_delivery_rate}%` },
  { title: '累计订单', key: 'total_orders', width: 90 },
  { title: '累计金额', key: 'total_amount', width: 120, render: (row: any) => `¥${row.total_amount.toLocaleString()}` },
  { title: '创建时间', key: 'created_at', width: 160, render: (row: any) => dayjs(row.created_at).format('YYYY-MM-DD HH:mm') },
  { title: '操作', key: 'actions', width: 160, render: (row: any) =>
    h('n-space', null, () => [
      h('n-button', { size: 'small', onClick: () => handleEdit(row) }, () => '编辑'),
      h('n-button', { size: 'small', type: 'warning', onClick: () => handleRisk(row) }, () => '风险评估')
    ])
  }
]

const formData = reactive({
  name: '',
  code: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  tax_number: '',
  bank_account: '',
  bank_name: '',
  remarks: ''
})

const rules = {
  name: { required: true, message: '请输入供应商名称', trigger: 'blur' },
  code: { required: true, message: '请输入供应商编码', trigger: 'blur' }
}

async function loadData() {
  loading.value = true
  try {
    const res = await listSuppliers({
      page: pagination.page,
      page_size: pagination.pageSize,
      keyword: searchKeyword.value,
      risk_level: filterRisk.value,
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
  searchKeyword.value = ''
  filterRisk.value = null
  filterStatus.value = null
  pagination.page = 1
  loadData()
}

function handleEdit(row: any) {
  Object.assign(formData, {
    name: row.name,
    code: row.code,
    contact_person: row.contact_person,
    phone: row.phone,
    email: row.email,
    address: row.address,
    tax_number: row.tax_number,
    bank_account: row.bank_account,
    bank_name: row.bank_name,
    remarks: row.remarks
  })
  editId.value = row.id
  showCreate.value = true
}

function handleRisk(row: any) {
  riskSupplier.value = row
  riskFormData.risk_level = row.risk_level
  riskFormData.risk_reason = ''
  showRisk.value = true
}

function handleCancel() {
  showCreate.value = false
  editId.value = null
  Object.assign(formData, { name: '', code: '', contact_person: '', phone: '', email: '', address: '', tax_number: '', bank_account: '', bank_name: '', remarks: '' })
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    submitting.value = true
    if (editId.value) {
      await updateSupplier(editId.value, formData)
      message.success('更新成功')
    } else {
      await createSupplier(formData)
      message.success('创建成功')
    }
    showCreate.value = false
    editId.value = null
    Object.assign(formData, { name: '', code: '', contact_person: '', phone: '', email: '', address: '', tax_number: '', bank_account: '', bank_name: '', remarks: '' })
    loadData()
  } catch (e: any) {
    message.error(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function handleRiskSubmit() {
  try {
    submitting.value = true
    await updateSupplier(riskSupplier.value.id, { risk_level: riskFormData.risk_level, risk_reason: riskFormData.risk_reason })
    message.success('风险评估完成')
    showRisk.value = false
    loadData()
  } catch (e: any) {
    message.error(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>
