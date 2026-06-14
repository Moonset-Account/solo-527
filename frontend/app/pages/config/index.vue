<template>
  <div>
    <n-tabs v-model:value="activeTab" type="line">
      <n-tab-pane name="acceptance" tab="验收反馈模板">
        <n-space justify="space-between" align="center" style="margin-bottom: 16px">
          <n-text strong style="font-size: 16px">验收反馈模板</n-text>
          <n-button type="primary" @click="openAcceptanceDialog">新增模板</n-button>
        </n-space>
        <n-data-table :columns="acceptanceColumns" :data="store.acceptanceTemplates" :loading="store.loading" :bordered="false" />
      </n-tab-pane>

      <n-tab-pane name="budget" tab="预算版本">
        <n-space justify="space-between" align="center" style="margin-bottom: 16px">
          <n-text strong style="font-size: 16px">预算版本</n-text>
          <n-button type="primary" @click="openBudgetDialog">新增版本</n-button>
        </n-space>
        <n-data-table :columns="budgetColumns" :data="store.budgetVersions" :loading="store.loading" :bordered="false" />
      </n-tab-pane>

      <n-tab-pane name="template" tab="巡检任务模板">
        <n-space justify="space-between" align="center" style="margin-bottom: 16px">
          <n-text strong style="font-size: 16px">巡检任务模板</n-text>
          <n-button type="primary" @click="openInspectionDialog">新增模板</n-button>
        </n-space>
        <n-data-table :columns="inspectionColumns" :data="store.inspectionTemplates" :loading="store.loading" :bordered="false" />
      </n-tab-pane>
    </n-tabs>

    <n-card title="变更日志" size="small" style="margin-top: 24px">
      <n-timeline>
        <n-timeline-item 
          v-for="log in store.changelog" 
          :key="log.id" 
          :title="getLogTitle(log)" 
          :time="log.created_at?.slice(0, 16) || ''"
          :type="getLogType(log.action)"
        >
          <n-text depth="3">{{ log.user_name || '未知用户' }} - {{ getLogDetail(log) }}</n-text>
        </n-timeline-item>
      </n-timeline>
      <n-empty v-if="store.changelog.length === 0" description="暂无变更记录" />
    </n-card>

    <n-modal v-model:show="showAcceptanceModal" preset="dialog" :title="editingAcceptanceId ? '编辑模板' : '新增模板'" positive-text="确认" negative-text="取消" @positive-click="handleAcceptanceSave">
      <n-form :model="acceptanceForm" label-placement="left" label-width="80">
        <n-form-item label="模板名称">
          <n-input v-model:value="acceptanceForm.name" placeholder="请输入模板名称" />
        </n-form-item>
        <n-form-item label="验收项目">
          <n-dynamic-input v-model:value="acceptanceForm.items" :on-create="() => ''" placeholder="请输入验收项目" />
        </n-form-item>
      </n-form>
    </n-modal>

    <n-modal v-model:show="showBudgetModal" preset="dialog" :title="editingBudgetId ? '编辑版本' : '新增版本'" positive-text="确认" negative-text="取消" @positive-click="handleBudgetSave">
      <n-form :model="budgetForm" label-placement="left" label-width="80">
        <n-form-item label="版本号">
          <n-input v-model:value="budgetForm.version" placeholder="请输入版本号" />
        </n-form-item>
        <n-form-item label="预算项目">
          <n-dynamic-input v-model:value="budgetItems" :on-create="() => ({ name: '', amount: 0, unit: '' })">
            <template #default="{ value, index }">
              <n-space>
                <n-input v-model:value="budgetItems[index].name" placeholder="项目名称" style="width: 120px" />
                <n-input-number v-model:value="budgetItems[index].amount" :min="0" placeholder="数量" style="width: 100px" />
                <n-input v-model:value="budgetItems[index].unit" placeholder="单位" style="width: 80px" />
              </n-space>
            </template>
          </n-dynamic-input>
        </n-form-item>
      </n-form>
    </n-modal>

    <n-modal v-model:show="showInspectionModal" preset="dialog" :title="editingInspectionId ? '编辑模板' : '新增模板'" positive-text="确认" negative-text="取消" @positive-click="handleInspectionSave">
      <n-form :model="inspectionForm" label-placement="left" label-width="80">
        <n-form-item label="模板名称">
          <n-input v-model:value="inspectionForm.name" placeholder="请输入模板名称" />
        </n-form-item>
        <n-form-item label="检查项">
          <n-dynamic-input v-model:value="inspectionForm.check_items" :on-create="() => ''" placeholder="请输入检查项" />
        </n-form-item>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, h } from 'vue'
import { useMessage, useDialog, NTag, NButton, NSpace } from 'naive-ui'
import { useConfigStore } from '~/stores/config'
import type { ConfigChangeLog, BudgetItem } from '~/types'

definePageMeta({
  layout: 'default',
})

const message = useMessage()
const dialog = useDialog()
const store = useConfigStore()
const activeTab = ref('acceptance')

const showAcceptanceModal = ref(false)
const showBudgetModal = ref(false)
const showInspectionModal = ref(false)
const editingAcceptanceId = ref<number | null>(null)
const editingBudgetId = ref<number | null>(null)
const editingInspectionId = ref<number | null>(null)

const acceptanceForm = reactive({
  name: '',
  items: [''] as string[],
})

const budgetForm = reactive({
  version: '',
})
const budgetItems = ref<BudgetItem[]>([{ name: '', amount: 0, unit: '' }])

const inspectionForm = reactive({
  name: '',
  check_items: [''] as string[],
})

const acceptanceColumns = [
  { title: '模板名称', key: 'name' },
  {
    title: '验收项目', key: 'items',
    render: (row: any) => h('div', {}, (row.items || []).map((item: string) => h(NTag, { size: 'small', style: 'margin: 2px' }, { default: () => item }))),
  },
  { title: '创建时间', key: 'created_at', render: (row: any) => row.created_at?.slice(0, 10) ?? '' },
  {
    title: '操作', key: 'action', width: 120,
    render: (row: any) => h(NSpace, {}, {
      default: () => [
        h(NButton, { size: 'tiny', text: true, onClick: () => editAcceptance(row) }, { default: () => '编辑' }),
        h(NButton, { size: 'tiny', text: true, type: 'error', onClick: () => deleteAcceptance(row) }, { default: () => '删除' }),
      ],
    }),
  },
]

const budgetColumns = [
  { title: '版本号', key: 'version' },
  {
    title: '预算项目数', key: 'items',
    render: (row: any) => h(NTag, { size: 'small' }, { default: () => `${row.items?.length || 0} 项` }),
  },
  { title: '创建时间', key: 'created_at', render: (row: any) => row.created_at?.slice(0, 10) ?? '' },
  {
    title: '操作', key: 'action', width: 120,
    render: (row: any) => h(NSpace, {}, {
      default: () => [
        h(NButton, { size: 'tiny', text: true, onClick: () => editBudget(row) }, { default: () => '编辑' }),
        h(NButton, { size: 'tiny', text: true, type: 'error', onClick: () => deleteBudget(row) }, { default: () => '删除' }),
      ],
    }),
  },
]

const inspectionColumns = [
  { title: '模板名称', key: 'name' },
  {
    title: '检查项数', key: 'check_items',
    render: (row: any) => h(NTag, { size: 'small' }, { default: () => `${row.check_items?.length || 0} 项` }),
  },
  { title: '创建时间', key: 'created_at', render: (row: any) => row.created_at?.slice(0, 10) ?? '' },
  {
    title: '操作', key: 'action', width: 120,
    render: (row: any) => h(NSpace, {}, {
      default: () => [
        h(NButton, { size: 'tiny', text: true, onClick: () => editInspection(row) }, { default: () => '编辑' }),
        h(NButton, { size: 'tiny', text: true, type: 'error', onClick: () => deleteInspection(row) }, { default: () => '删除' }),
      ],
    }),
  },
]

function getLogTitle(log: ConfigChangeLog) {
  const typeMap: Record<string, string> = {
    acceptance_template: '验收反馈模板',
    budget_version: '预算版本',
    inspection_template: '巡检任务模板',
  }
  const actionMap: Record<string, string> = {
    create: '新增',
    update: '修改',
    delete: '删除',
  }
  return `${actionMap[log.action] || log.action} - ${typeMap[log.entity_type] || log.entity_type}`
}

function getLogType(action: string) {
  const map: Record<string, string> = {
    create: 'success',
    update: 'warning',
    delete: 'error',
  }
  return map[action] || 'default'
}

function getLogDetail(log: ConfigChangeLog) {
  if (log.action === 'create' && log.after_data) {
    return `创建了 ${log.after_data.name || '新记录'}`
  }
  if (log.action === 'update' && log.before_data && log.after_data) {
    const changes: string[] = []
    Object.keys(log.after_data).forEach(key => {
      if (log.before_data?.[key] !== log.after_data[key]) {
        changes.push(`${key} 变更`)
      }
    })
    return changes.length > 0 ? changes.join('、') : '更新了记录'
  }
  if (log.action === 'delete' && log.before_data) {
    return `删除了 ${log.before_data.name || '记录'}`
  }
  return '配置变更'
}

function openAcceptanceDialog() {
  editingAcceptanceId.value = null
  acceptanceForm.name = ''
  acceptanceForm.items = ['']
  showAcceptanceModal.value = true
}

function editAcceptance(row: any) {
  editingAcceptanceId.value = row.id
  acceptanceForm.name = row.name
  acceptanceForm.items = [...row.items]
  showAcceptanceModal.value = true
}

async function handleAcceptanceSave() {
  if (!acceptanceForm.name) {
    message.warning('请输入模板名称')
    return
  }
  try {
    if (editingAcceptanceId.value) {
      await store.updateAcceptanceTemplate(editingAcceptanceId.value, acceptanceForm)
      message.success('更新成功')
    } else {
      await store.createAcceptanceTemplate(acceptanceForm)
      message.success('创建成功')
    }
    showAcceptanceModal.value = false
    loadTabData()
    store.fetchChangelog()
  } catch (e: any) {
    message.error(e?.data?.detail || '保存失败')
  }
}

function deleteAcceptance(row: any) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除模板「${row.name}」吗？此操作不可恢复。`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await store.deleteAcceptanceTemplate(row.id)
        message.success('删除成功')
        loadTabData()
        store.fetchChangelog()
      } catch (e: any) {
        message.error(e?.data?.detail || '删除失败')
      }
    },
  })
}

function openBudgetDialog() {
  editingBudgetId.value = null
  budgetForm.version = ''
  budgetItems.value = [{ name: '', amount: 0, unit: '' }]
  showBudgetModal.value = true
}

function editBudget(row: any) {
  editingBudgetId.value = row.id
  budgetForm.version = row.version
  budgetItems.value = [...row.items]
  showBudgetModal.value = true
}

async function handleBudgetSave() {
  if (!budgetForm.version) {
    message.warning('请输入版本号')
    return
  }
  try {
    const data = { ...budgetForm, items: budgetItems.value.filter(i => i.name) }
    if (editingBudgetId.value) {
      await store.updateBudgetVersion(editingBudgetId.value, data)
      message.success('更新成功')
    } else {
      await store.createBudgetVersion(data)
      message.success('创建成功')
    }
    showBudgetModal.value = false
    loadTabData()
    store.fetchChangelog()
  } catch (e: any) {
    message.error(e?.data?.detail || '保存失败')
  }
}

function deleteBudget(row: any) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除预算版本「${row.version}」吗？此操作不可恢复。`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await store.deleteBudgetVersion(row.id)
        message.success('删除成功')
        loadTabData()
        store.fetchChangelog()
      } catch (e: any) {
        message.error(e?.data?.detail || '删除失败')
      }
    },
  })
}

function openInspectionDialog() {
  editingInspectionId.value = null
  inspectionForm.name = ''
  inspectionForm.check_items = ['']
  showInspectionModal.value = true
}

function editInspection(row: any) {
  editingInspectionId.value = row.id
  inspectionForm.name = row.name
  inspectionForm.check_items = [...row.check_items]
  showInspectionModal.value = true
}

async function handleInspectionSave() {
  if (!inspectionForm.name) {
    message.warning('请输入模板名称')
    return
  }
  try {
    if (editingInspectionId.value) {
      await store.updateInspectionTemplate(editingInspectionId.value, inspectionForm)
      message.success('更新成功')
    } else {
      await store.createInspectionTemplate(inspectionForm)
      message.success('创建成功')
    }
    showInspectionModal.value = false
    loadTabData()
    store.fetchChangelog()
  } catch (e: any) {
    message.error(e?.data?.detail || '保存失败')
  }
}

function deleteInspection(row: any) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除模板「${row.name}」吗？此操作不可恢复。`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await store.deleteInspectionTemplate(row.id)
        message.success('删除成功')
        loadTabData()
        store.fetchChangelog()
      } catch (e: any) {
        message.error(e?.data?.detail || '删除失败')
      }
    },
  })
}

function loadTabData() {
  if (activeTab.value === 'acceptance') {
    store.fetchAcceptanceTemplates()
  } else if (activeTab.value === 'budget') {
    store.fetchBudgetVersions()
  } else if (activeTab.value === 'template') {
    store.fetchInspectionTemplates()
  }
}

watch(activeTab, () => {
  loadTabData()
})

onMounted(() => {
  loadTabData()
  store.fetchChangelog()
})
</script>
