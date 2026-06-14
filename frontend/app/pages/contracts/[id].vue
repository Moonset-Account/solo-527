<template>
  <div>
    <n-spin :show="loading">
      <n-page-header @back="router.back()" :title="isEdit ? '编辑合同' : '合同详情'" style="margin-bottom: 16px">
        <template #extra>
          <n-space v-if="tabValue === 'basic'">
            <n-button v-if="!isEdit" type="primary" @click="isEdit = true">编辑</n-button>
            <n-button v-if="isEdit" type="primary" :loading="saving" @click="handleSave">保存</n-button>
            <n-button v-if="isEdit" @click="handleCancelEdit">取消</n-button>
          </n-space>
        </template>
      </n-page-header>

      <n-tabs v-model:value="tabValue" type="line">
        <n-tab-pane name="basic" tab="基本信息">
          <n-card>
            <n-form ref="editFormRef" :model="editForm" :rules="editRules" label-placement="left" label-width="100" :disabled="!isEdit">
              <n-grid :cols="2" :x-gap="24">
                <n-gi>
                  <n-form-item label="合同编号" path="contract_no">
                    <n-input v-model:value="editForm.contract_no" placeholder="请输入合同编号" />
                  </n-form-item>
                </n-gi>
                <n-gi>
                  <n-form-item label="客户名称" path="customer_name">
                    <n-input v-model:value="editForm.customer_name" placeholder="请输入客户名称" />
                  </n-form-item>
                </n-gi>
                <n-gi>
                  <n-form-item label="合同金额" path="amount">
                    <n-input-number v-model:value="editForm.amount" placeholder="请输入合同金额" style="width: 100%" :min="0" prefix="¥" />
                  </n-form-item>
                </n-gi>
                <n-gi>
                  <n-form-item label="合同状态" path="status">
                    <n-select v-model:value="editForm.status" :options="statusOptions" placeholder="请选择合同状态" />
                  </n-form-item>
                </n-gi>
                <n-gi>
                  <n-form-item label="签订日期" path="sign_date">
                    <n-date-picker v-model:formatted-value="editForm.sign_date" type="date" value-format="yyyy-MM-dd" style="width: 100%" />
                  </n-form-item>
                </n-gi>
                <n-gi>
                  <n-form-item label="到期日期" path="end_date">
                    <n-date-picker v-model:formatted-value="editForm.end_date" type="date" value-format="yyyy-MM-dd" style="width: 100%" />
                  </n-form-item>
                </n-gi>
                <n-gi :span="2">
                  <n-form-item label="项目地址" path="project_address">
                    <n-input v-model:value="editForm.project_address" placeholder="请输入项目地址" />
                  </n-form-item>
                </n-gi>
              </n-grid>
            </n-form>
          </n-card>
        </n-tab-pane>

        <n-tab-pane name="budget" tab="预算版本">
          <n-card>
            <template #header-extra>
              <n-button type="primary" size="small" @click="showAddBudgetModal = true">新增版本</n-button>
            </template>
            <n-tabs v-model:value="activeBudgetTab" type="card">
              <n-tab-pane v-for="bv in budgetVersions" :key="bv.id" :name="String(bv.id)" :tab="bv.version">
                <n-data-table :columns="budgetColumns" :data="bv.items || []" :bordered="false" size="small" />
                <n-empty v-if="!bv.items || bv.items.length === 0" description="暂无预算明细" />
              </n-tab-pane>
            </n-tabs>
            <n-empty v-if="budgetVersions.length === 0" description="暂无预算版本" />
          </n-card>
        </n-tab-pane>

        <n-tab-pane name="inspections" tab="巡检任务">
          <n-card>
            <template #header-extra>
              <n-button type="primary" size="small" @click="showAddInspectionModal = true">分派任务</n-button>
            </template>
            <n-data-table :columns="inspectionColumns" :data="inspectionTasks" :bordered="false" size="small" />
            <n-empty v-if="inspectionTasks.length === 0" description="暂无巡检任务" />
          </n-card>
        </n-tab-pane>

        <n-tab-pane name="acceptance" tab="验收记录">
          <n-card>
            <n-data-table :columns="acceptanceColumns" :data="acceptanceRecords" :bordered="false" size="small" />
            <n-empty v-if="acceptanceRecords.length === 0" description="暂无验收记录" />
          </n-card>
        </n-tab-pane>

        <n-tab-pane name="satisfaction" tab="满意度">
          <n-card>
            <template v-if="satisfactionRecord">
              <n-descriptions :column="1" label-placement="left" label-width="120">
                <n-descriptions-item label="满意度等级">
                  <n-tag :type="levelTagType(satisfactionRecord.level)" size="small">{{ levelLabel(satisfactionRecord.level) }}</n-tag>
                </n-descriptions-item>
                <n-descriptions-item label="客户评价">
                  {{ satisfactionRecord.comment || '暂无评价' }}
                </n-descriptions-item>
                <n-descriptions-item label="提交时间">
                  {{ satisfactionRecord.created_at?.slice(0, 10) || '暂无' }}
                </n-descriptions-item>
              </n-descriptions>
            </template>
            <n-empty v-else description="暂无满意度记录" />
          </n-card>
        </n-tab-pane>
      </n-tabs>
    </n-spin>

    <n-modal v-model:show="showAddBudgetModal" preset="dialog" title="新增预算版本" positive-text="确认" negative-text="取消" @positive-click="handleAddBudget">
      <n-form ref="budgetFormRef" :model="budgetForm" :rules="budgetRules" label-placement="left" label-width="100">
        <n-form-item label="版本号" path="version">
          <n-input v-model:value="budgetForm.version" placeholder="如：v1.0" />
        </n-form-item>
        <n-form-item label="预算明细">
          <n-space vertical style="width: 100%">
            <n-space v-for="(item, index) in budgetForm.items" :key="index" align="center">
              <n-input v-model:value="item.name" placeholder="项目名称" style="width: 150px" />
              <n-input-number v-model:value="item.amount" placeholder="金额" :min="0" style="width: 120px" />
              <n-input v-model:value="item.unit" placeholder="单位" style="width: 80px" />
              <n-button size="small" type="error" @click="removeBudgetItem(index)">删除</n-button>
            </n-space>
            <n-button size="small" @click="addBudgetItem">添加明细</n-button>
          </n-space>
        </n-form-item>
      </n-form>
    </n-modal>

    <n-modal v-model:show="showAddInspectionModal" preset="dialog" title="分派巡检任务" positive-text="确认分派" negative-text="取消" @positive-click="handleAddInspection">
      <n-form ref="inspectionFormRef" :model="inspectionForm" :rules="inspectionRules" label-placement="left" label-width="100">
        <n-form-item label="任务名称" path="node_name">
          <n-input v-model:value="inspectionForm.node_name" placeholder="请输入巡检任务名称" />
        </n-form-item>
        <n-form-item label="巡检员" path="inspector_id">
          <n-select v-model:value="inspectionForm.inspector_id" :options="inspectorOptions" placeholder="请选择巡检员" />
        </n-form-item>
        <n-form-item label="巡检模板" path="template_id">
          <n-select v-model:value="inspectionForm.template_id" :options="templateOptions" placeholder="请选择巡检模板" />
        </n-form-item>
        <n-form-item label="截止日期" path="deadline">
          <n-date-picker v-model:formatted-value="inspectionForm.deadline" type="date" value-format="yyyy-MM-dd" style="width: 100%" />
        </n-form-item>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h, reactive } from 'vue'
import { useRouter, useRoute } from '#imports'
import { useMessage, NTag, NButton, NSpace, type FormInst, type FormRules } from 'naive-ui'
import { contractApi, satisfactionApi, configApi, inspectionApi, authApi } from '~/utils/api'
import type { Contract, BudgetVersion, BudgetItem, SatisfactionRecord, InspectionTask, InspectionTemplate, User } from '~/types'

definePageMeta({
  layout: 'default',
})

const router = useRouter()
const route = useRoute()
const message = useMessage()

const contract = ref<Contract | null>(null)
const budgetVersions = ref<BudgetVersion[]>([])
const activeBudgetTab = ref('')
const satisfactionRecord = ref<SatisfactionRecord | null>(null)
const inspectionTasks = ref<InspectionTask[]>([])
const inspectionTemplates = ref<InspectionTemplate[]>([])
const inspectors = ref<User[]>([])
const acceptanceRecords = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const isEdit = ref(false)
const tabValue = ref('basic')
const showAddBudgetModal = ref(false)
const showAddInspectionModal = ref(false)
const editFormRef = ref<FormInst | null>(null)
const budgetFormRef = ref<FormInst | null>(null)
const inspectionFormRef = ref<FormInst | null>(null)

const contractId = computed(() => Number(route.params.id))

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
const templateOptions = computed(() => inspectionTemplates.value.map(t => ({ label: t.name, value: t.id })))

const editForm = reactive({
  contract_no: '',
  customer_name: '',
  project_address: '',
  amount: undefined as number | undefined,
  status: 'signed',
  sign_date: '',
  end_date: '',
})

const editRules: FormRules = {
  contract_no: [{ required: true, message: '请输入合同编号', trigger: 'blur' }],
  customer_name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  project_address: [{ required: true, message: '请输入项目地址', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入合同金额', trigger: 'blur' }],
  status: [{ required: true, message: '请选择合同状态', trigger: 'change' }],
  sign_date: [{ required: true, message: '请选择签订日期', trigger: 'change' }],
  end_date: [{ required: true, message: '请选择到期日期', trigger: 'change' }],
}

const budgetForm = reactive({
  version: '',
  items: [{ name: '', amount: undefined as number | undefined, unit: '' }] as BudgetItem[],
})

const budgetRules: FormRules = {
  version: [{ required: true, message: '请输入版本号', trigger: 'blur' }],
}

const inspectionForm = reactive({
  node_name: '',
  inspector_id: undefined as number | undefined,
  template_id: undefined as number | undefined,
  deadline: '',
})

const inspectionRules: FormRules = {
  node_name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  inspector_id: [{ required: true, message: '请选择巡检员', trigger: 'change' }],
  deadline: [{ required: true, message: '请选择截止日期', trigger: 'change' }],
}

const budgetColumns = [
  { title: '项目', key: 'name' },
  { title: '金额', key: 'amount', width: 120, render: (row: any) => `¥${row.amount?.toLocaleString() ?? 0}` },
  { title: '单位', key: 'unit', width: 80 },
]

const inspectionColumns = [
  { title: '任务名称', key: 'node_name' },
  { title: '巡检员', key: 'inspector_name', width: 100 },
  {
    title: '状态', key: 'status', width: 100,
    render: (row: any) => {
      const map: Record<string, { label: string; type: string }> = {
        pending: { label: '待执行', type: 'default' },
        in_progress: { label: '进行中', type: 'warning' },
        completed: { label: '已完成', type: 'info' },
        accepted: { label: '已验收', type: 'success' },
      }
      const s = map[row.status] ?? { label: row.status, type: 'default' }
      return h(NTag, { size: 'small', type: s.type as any }, { default: () => s.label })
    },
  },
  { title: '截止日期', key: 'deadline', width: 120, render: (row: any) => row.deadline?.slice(0, 10) ?? '' },
  {
    title: '操作', key: 'actions', width: 80,
    render: (row: any) => h(NButton, { size: 'tiny', text: true, onClick: () => router.push(`/inspections/${row.id}`) }, { default: () => '查看' }),
  },
]

const acceptanceColumns = [
  { title: '验收节点', key: 'node_name' },
  { title: '验收结果', key: 'result', width: 100, render: (row: any) => h(NTag, { size: 'small', type: row.result === 'pass' ? 'success' : 'error' }, { default: () => row.result === 'pass' ? '通过' : '不通过' }) },
  { title: '验收人', key: 'operator_name', width: 100 },
  { title: '验收时间', key: 'created_at', width: 180, render: (row: any) => row.created_at?.slice(0, 19) ?? '' },
  { title: '备注', key: 'remark' },
]

function levelLabel(level?: string) {
  const map: Record<string, string> = { pending: '待反馈', satisfied: '满意', neutral: '一般', dissatisfied: '不满意' }
  return map[level ?? ''] ?? level ?? ''
}

function levelTagType(level?: string) {
  const map: Record<string, string> = { pending: 'default', satisfied: 'success', neutral: 'warning', dissatisfied: 'error' }
  return (map[level ?? ''] ?? 'default') as any
}

function addBudgetItem() {
  budgetForm.items.push({ name: '', amount: undefined, unit: '' })
}

function removeBudgetItem(index: number) {
  budgetForm.items.splice(index, 1)
}

function fillEditForm(data: Contract) {
  editForm.contract_no = (data as any).contract_no || ''
  editForm.customer_name = data.customer_name || ''
  editForm.project_address = (data as any).project_address || ''
  editForm.amount = data.amount
  editForm.status = data.status
  editForm.sign_date = (data as any).sign_date || (data as any).start_date || ''
  editForm.end_date = data.end_date || ''
}

async function loadData() {
  const id = contractId.value
  loading.value = true
  try {
    contract.value = await contractApi.get(id)
    if (contract.value) {
      fillEditForm(contract.value)
    }
  } catch (e: any) {
    message.error(e?.data?.detail || '加载合同信息失败')
  }
  try {
    const res = await configApi.budgetVersions({ contract_id: id })
    budgetVersions.value = res.items || []
    if (budgetVersions.value.length > 0) {
      activeBudgetTab.value = String(budgetVersions.value[0].id)
    }
  } catch {}
  try {
    const records = await satisfactionApi.list({ contract_id: id })
    satisfactionRecord.value = records.items?.[0] ?? null
  } catch {}
  try {
    const res = await inspectionApi.list({ contract_id: id })
    inspectionTasks.value = res.items || []
  } catch {}
  try {
    inspectors.value = await authApi.inspectors()
  } catch {}
  try {
    const res = await configApi.inspectionTemplates()
    inspectionTemplates.value = res.items || []
  } catch {}
  loading.value = false
}

async function handleSave() {
  try {
    await editFormRef.value?.validate()
  } catch {
    return
  }
  saving.value = true
  try {
    await contractApi.update(contractId.value, editForm as any)
    message.success('保存成功')
    isEdit.value = false
    loadData()
  } catch (e: any) {
    message.error(e?.data?.detail || '保存失败')
  } finally {
    saving.value = false
  }
}

function handleCancelEdit() {
  if (contract.value) {
    fillEditForm(contract.value)
  }
  isEdit.value = false
}

async function handleAddBudget() {
  try {
    await budgetFormRef.value?.validate()
  } catch {
    return
  }
  try {
    await configApi.createBudgetVersion({
      contract_id: contractId.value,
      version: budgetForm.version,
      items: budgetForm.items.filter(i => i.name),
    })
    message.success('预算版本创建成功')
    showAddBudgetModal.value = false
    budgetForm.version = ''
    budgetForm.items = [{ name: '', amount: undefined, unit: '' }]
    loadData()
  } catch (e: any) {
    message.error(e?.data?.detail || '创建失败')
  }
}

async function handleAddInspection() {
  try {
    await inspectionFormRef.value?.validate()
  } catch {
    return
  }
  try {
    await inspectionApi.create({
      contract_id: contractId.value,
      node_name: inspectionForm.node_name,
      inspector_id: inspectionForm.inspector_id,
      template_id: inspectionForm.template_id,
      deadline: inspectionForm.deadline,
      status: 'pending',
    })
    message.success('巡检任务分派成功')
    showAddInspectionModal.value = false
    inspectionForm.node_name = ''
    inspectionForm.inspector_id = undefined
    inspectionForm.template_id = undefined
    inspectionForm.deadline = ''
    loadData()
  } catch (e: any) {
    message.error(e?.data?.detail || '分派失败')
  }
}

onMounted(() => {
  if (route.query.action === 'edit') {
    isEdit.value = true
  }
  loadData()
})
</script>
