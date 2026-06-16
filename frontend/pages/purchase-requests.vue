<template>
  <div>
    <n-page-header title="采购需求" subtitle="创建和审批采购需求单">
      <template #extra>
        <n-button type="primary" @click="showCreate = true">
          <template #icon><AddOutline /></template>
          新建需求
        </n-button>
      </template>
    </n-page-header>

    <n-card style="margin-top: 16px;">
      <n-space vertical :size="16">
        <n-space>
          <n-input v-model:value="searchKeyword" placeholder="搜索单号/标题/项目" clearable style="width: 240px;" />
          <n-select v-model:value="filterStatus" :options="statusOptions" placeholder="状态" clearable style="width: 140px;" />
          <n-input v-model:value="filterDept" placeholder="部门" clearable style="width: 140px;" />
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

    <n-modal v-model:show="showCreate" preset="card" title="新建采购需求" style="width: 720px;">
      <n-form ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="100px">
        <n-grid :cols="2" :x-gap="12">
          <n-form-item label="需求标题" path="title" :span="2">
            <n-input v-model:value="formData.title" placeholder="请输入需求标题" />
          </n-form-item>
          <n-form-item label="所属部门">
            <n-input v-model:value="formData.department" placeholder="部门名称" />
          </n-form-item>
          <n-form-item label="项目名称">
            <n-input v-model:value="formData.project_name" placeholder="关联项目" />
          </n-form-item>
          <n-form-item label="期望到货日期">
            <n-date-picker v-model:value="formData.expected_date" type="date" style="width: 100%;" />
          </n-form-item>
          <n-form-item label="紧急程度">
            <n-select v-model:value="formData.urgency" :options="urgencyOptions" placeholder="选择紧急程度" />
          </n-form-item>
          <n-form-item label="备注" :span="2">
            <n-input v-model:value="formData.remarks" type="textarea" :rows="2" placeholder="备注说明" />
          </n-form-item>
        </n-grid>

        <n-divider>采购明细</n-divider>
        <n-space vertical style="width: 100%;">
          <n-data-table
            :columns="itemColumns"
            :data="formData.items"
            :bordered="true"
            size="small"
          />
          <n-button size="small" type="primary" ghost @click="addItem">
            <template #icon><AddOutline /></template>
            添加明细
          </n-button>
        </n-space>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreate = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSubmit">提交需求</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showView" preset="card" title="采购需求详情" style="width: 720px;">
      <n-descriptions :column="2" bordered v-if="viewData">
        <n-descriptions-item label="需求单号">{{ viewData.pr_no }}</n-descriptions-item>
        <n-descriptions-item label="状态">
          <n-tag :type="getStatusTag(viewData.status).type">{{ getStatusTag(viewData.status).label }}</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="标题" :span="2">{{ viewData.title }}</n-descriptions-item>
        <n-descriptions-item label="部门">{{ viewData.department }}</n-descriptions-item>
        <n-descriptions-item label="项目">{{ viewData.project_name }}</n-descriptions-item>
        <n-descriptions-item label="紧急程度">{{ viewData.urgency }}</n-descriptions-item>
        <n-descriptions-item label="期望到货">{{ viewData.expected_date || '-' }}</n-descriptions-item>
        <n-descriptions-item label="预估金额" :span="2">¥{{ viewData.total_estimated_amount?.toLocaleString() }}</n-descriptions-item>
        <n-descriptions-item label="备注" :span="2">{{ viewData.remarks || '-' }}</n-descriptions-item>
      </n-descriptions>
      <n-divider>采购明细</n-divider>
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

    <n-modal v-model:show="showApprove" preset="card" title="审批采购需求" style="width: 500px;">
      <n-form :model="approveForm" label-placement="left" label-width="100px">
        <n-form-item label="需求单号">
          <n-input :value="viewData?.pr_no" disabled />
        </n-form-item>
        <n-form-item label="审批结果">
          <n-select v-model:value="approveForm.status" :options="[
            { label: '通过', value: 'approved' },
            { label: '拒绝', value: 'rejected' }
          ]" />
        </n-form-item>
        <n-form-item label="审批意见">
          <n-input v-model:value="approveForm.comment" type="textarea" :rows="3" placeholder="请输入审批意见" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showApprove = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleApproveSubmit">确定</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { useMessage, type DataTableColumns } from 'naive-ui'
import { AddOutline, TrashOutline } from '@vicons/ionicons5'
import { listPurchaseRequests, createPurchaseRequest, getPurchaseRequest, updatePurchaseRequest } from '~/api'
import dayjs from 'dayjs'

const message = useMessage()
const loading = ref(false)
const submitting = ref(false)
const showCreate = ref(false)
const showView = ref(false)
const showApprove = ref(false)
const viewData = ref<any>(null)
const approveForm = reactive({ status: 'approved', comment: '' })
const formRef = ref()
const searchKeyword = ref('')
const filterStatus = ref<string | null>(null)
const filterDept = ref('')

const dataList = ref<any[]>([])
const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '已提交', value: 'submitted' },
  { label: '已审批', value: 'approved' },
  { label: '已拒绝', value: 'rejected' },
  { label: '询价中', value: 'inquiry' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' }
]
const urgencyOptions = [
  { label: '普通', value: 'normal' },
  { label: '紧急', value: 'urgent' },
  { label: '特急', value: 'critical' }
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
    draft: 'default', submitted: 'info', approved: 'success', rejected: 'error',
    inquiry: 'warning', completed: 'success', cancelled: 'default'
  }
  const label: Record<string, string> = {
    draft: '草稿', submitted: '已提交', approved: '已审批', rejected: '已拒绝',
    inquiry: '询价中', completed: '已完成', cancelled: '已取消'
  }
  return { type: map[type] || 'default', label: label[type] || type }
}

const columns: DataTableColumns = [
  { title: '需求单号', key: 'pr_no', width: 140 },
  { title: '标题', key: 'title', width: 180, ellipsis: { tooltip: true } },
  { title: '部门', key: 'department', width: 100 },
  { title: '项目', key: 'project_name', width: 120 },
  { title: '预估金额', key: 'total_estimated_amount', width: 120, render: (row: any) =>
    h('n-strong', null, () => `¥${row.total_estimated_amount.toLocaleString()}`)
  },
  { title: '期望到货', key: 'expected_date', width: 110, render: (row: any) => row.expected_date || '-' },
  { title: '紧急度', key: 'urgency', width: 80, render: (row: any) => {
      const map: Record<string, any> = { normal: 'default', urgent: 'warning', critical: 'error' }
      return h('n-tag', { type: map[row.urgency] || 'default' }, { default: () => row.urgency })
  }},
  { title: '状态', key: 'status', width: 90, render: (row: any) => {
      const s = getStatusTag(row.status)
      return h('n-tag', { type: s.type }, { default: () => s.label })
  }},
  { title: '创建时间', key: 'created_at', width: 160, render: (row: any) => dayjs(row.created_at).format('YYYY-MM-DD HH:mm') },
  { title: '操作', key: 'actions', width: 180, render: (row: any) =>
    h('n-space', null, () => [
      h('n-button', { size: 'small', onClick: () => handleView(row) }, () => '查看'),
      h('n-button', { size: 'small', type: 'primary', onClick: () => handleApprove(row) }, () => '审批')
    ])
  }
]

const itemColumns: DataTableColumns = [
  { title: '耗材', key: 'material_id', render: (_: any, index: number) =>
    h('n-input', { value: formData.items[index].material_id, placeholder: '耗材ID', onUpdateValue: (v: any) => formData.items[index].material_id = v })
  },
  { title: '数量', key: 'quantity', width: 120, render: (_: any, index: number) =>
    h('n-input-number', { value: formData.items[index].quantity, min: 1, onUpdateValue: (v: any) => formData.items[index].quantity = v })
  },
  { title: '单价(元)', key: 'unit_price', width: 140, render: (_: any, index: number) =>
    h('n-input-number', { value: formData.items[index].unit_price, min: 0, precision: 2, onUpdateValue: (v: any) => formData.items[index].unit_price = v })
  },
  { title: '操作', key: 'actions', width: 80, render: (_: any, index: number) =>
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
  title: '',
  department: '',
  project_name: '',
  project_owner_id: null as number | null,
  expected_date: null as number | null,
  urgency: 'normal',
  remarks: '',
  items: [{ material_id: 0, quantity: 1, unit_price: 0 }]
})

const rules = {
  title: { required: true, message: '请输入需求标题', trigger: 'blur' }
}

function addItem() {
  formData.items.push({ material_id: 0, quantity: 1, unit_price: 0 })
}

function removeItem(index: number) {
  if (formData.items.length > 1) {
    formData.items.splice(index, 1)
  } else {
    message.warning('至少需要一条明细')
  }
}

async function loadData() {
  loading.value = true
  try {
    const res = await listPurchaseRequests({
      page: pagination.page,
      page_size: pagination.pageSize,
      keyword: searchKeyword.value,
      status: filterStatus.value,
      department: filterDept.value
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
  filterDept.value = ''
  pagination.page = 1
  loadData()
}

async function handleView(row: any) {
  try {
    const res = await getPurchaseRequest(row.id)
    if (res.code === 200) {
      viewData.value = res.data
      showView.value = true
    }
  } catch (e: any) {
    message.error(e.message || '加载失败')
  }
}

async function handleApprove(row: any) {
  try {
    const res = await getPurchaseRequest(row.id)
    if (res.code === 200) {
      viewData.value = res.data
      approveForm.status = 'approved'
      approveForm.comment = ''
      showApprove.value = true
    }
  } catch (e: any) {
    message.error(e.message || '加载失败')
  }
}

async function handleApproveSubmit() {
  try {
    submitting.value = true
    await updatePurchaseRequest(viewData.value.id, {
      status: approveForm.status,
      approval_comment: approveForm.comment
    })
    message.success('审批完成')
    showApprove.value = false
    loadData()
  } catch (e: any) {
    message.error(e.message || '审批失败')
  } finally {
    submitting.value = false
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    const validItems = formData.items.filter((i: any) => i.material_id > 0 && i.quantity > 0)
    if (validItems.length === 0) {
      message.warning('请填写有效的采购明细')
      return
    }
    submitting.value = true
    await createPurchaseRequest({ ...formData, items: validItems })
    message.success('需求提交成功')
    showCreate.value = false
    Object.assign(formData, { title: '', department: '', project_name: '', expected_date: null, urgency: 'normal', remarks: '', items: [{ material_id: 0, quantity: 1, unit_price: 0 }] })
    loadData()
  } catch (e: any) {
    message.error(e.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>
