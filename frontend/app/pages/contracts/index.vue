<template>
  <div>
    <n-space justify="space-between" align="center" style="margin-bottom: 16px">
      <n-space>
        <n-input v-model:value="searchKeyword" placeholder="搜索合同编号/客户名称" clearable style="width: 240px" @keyup.enter="handleSearch" />
        <n-select v-model:value="statusFilter" placeholder="状态筛选" clearable :options="statusOptions" style="width: 160px" />
        <n-button type="primary" @click="handleSearch">搜索</n-button>
        <n-button @click="handleReset">重置</n-button>
      </n-space>
      <n-space>
        <n-button type="primary" @click="handleAdd">新增合同</n-button>
      </n-space>
    </n-space>
    <n-data-table :columns="columns" :data="contractsStore.contracts" :loading="contractsStore.loading" :bordered="false" :pagination="false" />
    <n-space justify="end" style="margin-top: 16px">
      <n-pagination v-model:page="page" v-model:page-size="pageSize" :total="contractsStore.total" :page-sizes="[10, 20, 50]" show-size-picker @update:page="loadData" @update:page-size="handlePageSizeChange" />
    </n-space>

    <n-modal v-model:show="showAddModal" preset="dialog" title="新增合同" positive-text="确认" negative-text="取消" @positive-click="handleAddSubmit">
      <n-form ref="addFormRef" :model="addForm" :rules="addRules" label-placement="left" label-width="100">
        <n-form-item label="合同编号" path="contract_no">
          <n-input v-model:value="addForm.contract_no" placeholder="请输入合同编号" />
        </n-form-item>
        <n-form-item label="客户名称" path="customer_name">
          <n-input v-model:value="addForm.customer_name" placeholder="请输入客户名称" />
        </n-form-item>
        <n-form-item label="项目地址" path="project_address">
          <n-input v-model:value="addForm.project_address" placeholder="请输入项目地址" />
        </n-form-item>
        <n-form-item label="合同金额" path="amount">
          <n-input-number v-model:value="addForm.amount" placeholder="请输入合同金额" style="width: 100%" :min="0" prefix="¥" />
        </n-form-item>
        <n-form-item label="合同状态" path="status">
          <n-select v-model:value="addForm.status" :options="statusOptions" placeholder="请选择合同状态" />
        </n-form-item>
        <n-form-item label="签订日期" path="sign_date">
          <n-date-picker v-model:formatted-value="addForm.sign_date" type="date" value-format="yyyy-MM-dd" style="width: 100%" />
        </n-form-item>
        <n-form-item label="到期日期" path="end_date">
          <n-date-picker v-model:formatted-value="addForm.end_date" type="date" value-format="yyyy-MM-dd" style="width: 100%" />
        </n-form-item>
      </n-form>
    </n-modal>

    <n-modal v-model:show="showAssignModal" preset="dialog" title="分派巡检任务" positive-text="确认分派" negative-text="取消" @positive-click="handleAssignSubmit">
      <n-form ref="assignFormRef" :model="assignForm" :rules="assignRules" label-placement="left" label-width="100">
        <n-form-item label="合同编号">
          <n-input :value="currentContract?.contract_no" disabled />
        </n-form-item>
        <n-form-item label="任务名称" path="node_name">
          <n-input v-model:value="assignForm.node_name" placeholder="请输入巡检任务名称" />
        </n-form-item>
        <n-form-item label="巡检员" path="inspector_id">
          <n-select v-model:value="assignForm.inspector_id" :options="inspectorOptions" placeholder="请选择巡检员" />
        </n-form-item>
        <n-form-item label="截止日期" path="deadline">
          <n-date-picker v-model:formatted-value="assignForm.deadline" type="date" value-format="yyyy-MM-dd" style="width: 100%" />
        </n-form-item>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h, reactive } from 'vue'
import { useRouter } from '#imports'
import { useMessage, NTag, NButton, NSpace, type FormInst, type FormRules } from 'naive-ui'
import { useContractsStore } from '~/stores/contracts'
import { authApi, inspectionApi } from '~/utils/api'
import type { User, Contract } from '~/types'

definePageMeta({
  layout: 'default',
})

const router = useRouter()
const message = useMessage()
const contractsStore = useContractsStore()
const page = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')
const statusFilter = ref('')
const showAddModal = ref(false)
const showAssignModal = ref(false)
const addFormRef = ref<FormInst | null>(null)
const assignFormRef = ref<FormInst | null>(null)
const currentContract = ref<Contract | null>(null)
const inspectors = ref<User[]>([])

const statusOptions = [
  { label: '已签订', value: 'signed' },
  { label: '执行中', value: 'executing' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]

const statusMap: Record<string, { label: string; type: string }> = {
  signed: { label: '已签订', type: 'info' },
  executing: { label: '执行中', type: 'warning' },
  completed: { label: '已完成', type: 'success' },
  cancelled: { label: '已取消', type: 'error' },
}

const inspectorOptions = computed(() => inspectors.value.map(i => ({ label: i.display_name, value: i.id })))

const addForm = reactive({
  contract_no: '',
  customer_name: '',
  project_address: '',
  amount: undefined as number | undefined,
  status: 'signed',
  sign_date: '',
  end_date: '',
})

const addRules: FormRules = {
  contract_no: [{ required: true, message: '请输入合同编号', trigger: 'blur' }],
  customer_name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  project_address: [{ required: true, message: '请输入项目地址', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入合同金额', trigger: 'blur' }],
  status: [{ required: true, message: '请选择合同状态', trigger: 'change' }],
  sign_date: [{ required: true, message: '请选择签订日期', trigger: 'change' }],
  end_date: [{ required: true, message: '请选择到期日期', trigger: 'change' }],
}

const assignForm = reactive({
  node_name: '',
  inspector_id: undefined as number | undefined,
  deadline: '',
})

const assignRules: FormRules = {
  node_name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  inspector_id: [{ required: true, message: '请选择巡检员', trigger: 'change' }],
  deadline: [{ required: true, message: '请选择截止日期', trigger: 'change' }],
}

const columns = [
  { title: '合同编号', key: 'contract_no', width: 140 },
  { title: '客户名称', key: 'customer_name', width: 140 },
  { title: '项目地址', key: 'project_address', ellipsis: { tooltip: true } },
  { title: '合同金额', key: 'amount', width: 120, render: (row: any) => `¥${row.amount?.toLocaleString() ?? 0}` },
  {
    title: '状态', key: 'status', width: 100,
    render: (row: any) => {
      const s = statusMap[row.status] ?? { label: row.status, type: 'default' }
      return h(NTag, { size: 'small', type: s.type as any }, { default: () => s.label })
    },
  },
  { title: '签订日期', key: 'sign_date', width: 120, render: (row: any) => row.sign_date?.slice(0, 10) ?? '' },
  { title: '到期日期', key: 'end_date', width: 120, render: (row: any) => row.end_date?.slice(0, 10) ?? '' },
  {
    title: '操作', key: 'actions', width: 200,
    render: (row: any) => h(NSpace, { size: 'small' }, {
      default: () => [
        h(NButton, { size: 'tiny', text: true, onClick: () => handleView(row) }, { default: () => '查看' }),
        h(NButton, { size: 'tiny', text: true, onClick: () => handleEdit(row) }, { default: () => '编辑' }),
        h(NButton, { size: 'tiny', text: true, type: 'primary', onClick: () => handleAssign(row) }, { default: () => '分派巡检' }),
      ],
    }),
  },
]

function handleSearch() {
  page.value = 1
  loadData()
}

function handleReset() {
  searchKeyword.value = ''
  statusFilter.value = ''
  page.value = 1
  loadData()
}

function handlePageSizeChange() {
  page.value = 1
  loadData()
}

async function loadData() {
  const params: any = {
    page: page.value,
    size: pageSize.value,
  }
  if (statusFilter.value) {
    params.status = statusFilter.value
  }
  if (searchKeyword.value) {
    params.keyword = searchKeyword.value
  }
  await contractsStore.fetchList(params)
}

function handleAdd() {
  addForm.contract_no = ''
  addForm.customer_name = ''
  addForm.project_address = ''
  addForm.amount = undefined
  addForm.status = 'signed'
  addForm.sign_date = ''
  addForm.end_date = ''
  showAddModal.value = true
}

async function handleAddSubmit() {
  try {
    await addFormRef.value?.validate()
  } catch {
    return
  }
  try {
    await contractsStore.create(addForm as any)
    message.success('合同创建成功')
    showAddModal.value = false
    loadData()
  } catch (e: any) {
    message.error(e?.data?.detail || '创建失败')
  }
}

function handleView(row: any) {
  router.push(`/contracts/${row.id}`)
}

function handleEdit(row: any) {
  router.push(`/contracts/${row.id}?action=edit`)
}

async function handleAssign(row: any) {
  currentContract.value = row
  assignForm.node_name = ''
  assignForm.inspector_id = undefined
  assignForm.deadline = ''
  try {
    inspectors.value = await authApi.inspectors()
  } catch {}
  showAssignModal.value = true
}

async function handleAssignSubmit() {
  try {
    await assignFormRef.value?.validate()
  } catch {
    return
  }
  try {
    await inspectionApi.create({
      contract_id: currentContract.value?.id,
      node_name: assignForm.node_name,
      inspector_id: assignForm.inspector_id,
      deadline: assignForm.deadline,
      status: 'pending',
    })
    message.success('巡检任务分派成功')
    showAssignModal.value = false
  } catch (e: any) {
    message.error(e?.data?.detail || '分派失败')
  }
}

onMounted(() => {
  loadData()
})
</script>
