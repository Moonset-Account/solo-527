<template>
  <div>
    <n-space justify="space-between" align="center" style="margin-bottom: 16px">
      <n-text strong style="font-size: 16px">巡检任务看板</n-text>
      <n-button type="primary" @click="showAddModal = true">新增任务</n-button>
    </n-space>

    <n-card size="small" style="margin-bottom: 16px">
      <n-grid :cols="4" :x-gap="16">
        <n-gi>
          <n-form-item label="合同">
            <n-select v-model:value="filterContract" :options="contractOptions" clearable placeholder="请选择合同" />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="巡检员">
            <n-select v-model:value="filterInspector" :options="inspectorOptions" clearable placeholder="请选择巡检员" />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label="状态">
            <n-select v-model:value="filterStatus" :options="statusOptions" clearable placeholder="请选择状态" />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-space style="margin-top: 22px">
            <n-button @click="handleFilter">查询</n-button>
            <n-button @click="handleReset">重置</n-button>
          </n-space>
        </n-gi>
      </n-grid>
    </n-card>

    <n-grid :cols="4" :x-gap="12" :y-gap="12">
      <n-gi>
        <n-card :title="`待分派 (${filteredPending.length})`" size="small" :style="{ borderTop: '3px solid #1B2A4A' }">
          <n-spin :show="store.loading">
            <n-card v-for="task in filteredPending" :key="task.id" size="small" hoverable style="margin-bottom: 8px">
              <n-space justify="space-between" align="center" style="margin-bottom: 4px">
                <n-text strong style="font-size: 13px">XJ-{{ String(task.id).padStart(4, '0') }}</n-text>
                <n-tag size="tiny" type="default">待分派</n-tag>
              </n-space>
              <n-text strong>{{ task.node_name }}</n-text>
              <div style="margin-top: 6px">
                <n-text depth="3" style="font-size: 12px">合同：{{ task.contract_name }}</n-text>
              </div>
              <div style="margin-top: 4px">
                <n-text depth="3" style="font-size: 12px">巡检员：{{ task.inspector_name || '未分配' }}</n-text>
              </div>
              <div style="margin-top: 4px">
                <n-text depth="3" style="font-size: 12px">计划日期：{{ task.deadline?.slice(0, 10) }}</n-text>
              </div>
              <n-space justify="space-between" style="margin-top: 8px">
                <n-button size="tiny" text type="primary" @click="router.push(`/inspections/${task.id}`)">查看</n-button>
                <n-button size="tiny" type="primary" @click="moveToNext(task)">开始巡检</n-button>
              </n-space>
            </n-card>
            <n-empty v-if="filteredPending.length === 0 && !store.loading" description="暂无任务" size="small" />
          </n-spin>
        </n-card>
      </n-gi>

      <n-gi>
        <n-card :title="`进行中 (${filteredInProgress.length})`" size="small" :style="{ borderTop: '3px solid #E8A838' }">
          <n-spin :show="store.loading">
            <n-card v-for="task in filteredInProgress" :key="task.id" size="small" hoverable style="margin-bottom: 8px">
              <n-space justify="space-between" align="center" style="margin-bottom: 4px">
                <n-text strong style="font-size: 13px">XJ-{{ String(task.id).padStart(4, '0') }}</n-text>
                <n-tag size="tiny" type="warning">进行中</n-tag>
              </n-space>
              <n-text strong>{{ task.node_name }}</n-text>
              <div style="margin-top: 6px">
                <n-text depth="3" style="font-size: 12px">合同：{{ task.contract_name }}</n-text>
              </div>
              <div style="margin-top: 4px">
                <n-text depth="3" style="font-size: 12px">巡检员：{{ task.inspector_name || '未分配' }}</n-text>
              </div>
              <div style="margin-top: 4px">
                <n-text depth="3" style="font-size: 12px">计划日期：{{ task.deadline?.slice(0, 10) }}</n-text>
              </div>
              <n-tag v-if="task.is_delayed" size="tiny" type="error" style="margin-top: 4px">已延期</n-tag>
              <n-space justify="space-between" style="margin-top: 8px">
                <n-button size="tiny" text type="primary" @click="router.push(`/inspections/${task.id}`)">查看</n-button>
                <n-button size="tiny" type="success" @click="moveToNext(task)">标记完成</n-button>
              </n-space>
            </n-card>
            <n-empty v-if="filteredInProgress.length === 0 && !store.loading" description="暂无任务" size="small" />
          </n-spin>
        </n-card>
      </n-gi>

      <n-gi>
        <n-card :title="`已完成 (${filteredCompleted.length})`" size="small" :style="{ borderTop: '3px solid #36B37E' }">
          <n-spin :show="store.loading">
            <n-card v-for="task in filteredCompleted" :key="task.id" size="small" hoverable style="margin-bottom: 8px">
              <n-space justify="space-between" align="center" style="margin-bottom: 4px">
                <n-text strong style="font-size: 13px">XJ-{{ String(task.id).padStart(4, '0') }}</n-text>
                <n-tag size="tiny" type="success">已完成</n-tag>
              </n-space>
              <n-text strong>{{ task.node_name }}</n-text>
              <div style="margin-top: 6px">
                <n-text depth="3" style="font-size: 12px">合同：{{ task.contract_name }}</n-text>
              </div>
              <div style="margin-top: 4px">
                <n-text depth="3" style="font-size: 12px">巡检员：{{ task.inspector_name || '未分配' }}</n-text>
              </div>
              <div style="margin-top: 4px">
                <n-text depth="3" style="font-size: 12px">计划日期：{{ task.deadline?.slice(0, 10) }}</n-text>
              </div>
              <n-space justify="space-between" style="margin-top: 8px">
                <n-button size="tiny" text type="primary" @click="router.push(`/inspections/${task.id}`)">查看</n-button>
                <n-button size="tiny" type="info" @click="moveToNext(task)">确认验收</n-button>
              </n-space>
            </n-card>
            <n-empty v-if="filteredCompleted.length === 0 && !store.loading" description="暂无任务" size="small" />
          </n-spin>
        </n-card>
      </n-gi>

      <n-gi>
        <n-card :title="`已验收 (${filteredAccepted.length})`" size="small" :style="{ borderTop: '3px solid #722ED1' }">
          <n-spin :show="store.loading">
            <n-card v-for="task in filteredAccepted" :key="task.id" size="small" hoverable style="margin-bottom: 8px">
              <n-space justify="space-between" align="center" style="margin-bottom: 4px">
                <n-text strong style="font-size: 13px">XJ-{{ String(task.id).padStart(4, '0') }}</n-text>
                <n-tag size="tiny" type="info">已验收</n-tag>
              </n-space>
              <n-text strong>{{ task.node_name }}</n-text>
              <div style="margin-top: 6px">
                <n-text depth="3" style="font-size: 12px">合同：{{ task.contract_name }}</n-text>
              </div>
              <div style="margin-top: 4px">
                <n-text depth="3" style="font-size: 12px">巡检员：{{ task.inspector_name || '未分配' }}</n-text>
              </div>
              <div style="margin-top: 4px">
                <n-text depth="3" style="font-size: 12px">计划日期：{{ task.deadline?.slice(0, 10) }}</n-text>
              </div>
              <n-space justify="end" style="margin-top: 8px">
                <n-button size="tiny" text type="primary" @click="router.push(`/inspections/${task.id}`)">查看</n-button>
              </n-space>
            </n-card>
            <n-empty v-if="filteredAccepted.length === 0 && !store.loading" description="暂无任务" size="small" />
          </n-spin>
        </n-card>
      </n-gi>
    </n-grid>

    <n-modal v-model:show="showAddModal" preset="dialog" title="新增巡检任务" positive-text="确认" negative-text="取消" @positive-click="handleAdd">
      <n-form :model="addForm" label-placement="left" label-width="100">
        <n-form-item label="节点名称">
          <n-input v-model:value="addForm.node_name" placeholder="请输入节点名称" />
        </n-form-item>
        <n-form-item label="合同">
          <n-select v-model:value="addForm.contract_id" :options="contractOptions" placeholder="请选择合同" />
        </n-form-item>
        <n-form-item label="巡检员">
          <n-select v-model:value="addForm.inspector_id" :options="inspectorOptions" placeholder="请选择巡检员" />
        </n-form-item>
        <n-form-item label="计划日期">
          <n-date-picker v-model:formatted-value="addForm.deadline" type="date" value-format="yyyy-MM-dd" style="width: 100%" />
        </n-form-item>
        <n-form-item label="巡检模板">
          <n-select v-model:value="addForm.template_id" :options="templateOptions" clearable placeholder="请选择模板" />
        </n-form-item>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from '#imports'
import { useMessage } from 'naive-ui'
import { useInspectionsStore } from '~/stores/inspections'
import { useAuthStore } from '~/stores/auth'
import { contractApi, authApi, configApi } from '~/utils/api'
import type { InspectionTask } from '~/types'

definePageMeta({
  layout: 'default',
})

const router = useRouter()
const message = useMessage()
const store = useInspectionsStore()
const authStore = useAuthStore()
const showAddModal = ref(false)

const filterContract = ref<number | null>(null)
const filterInspector = ref<number | null>(null)
const filterStatus = ref<string | null>(null)

const contractOptions = ref<any[]>([])
const inspectorOptions = ref<any[]>([])
const templateOptions = ref<any[]>([])

const statusOptions = [
  { label: '待分派', value: 'pending' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '已验收', value: 'accepted' },
]

const addForm = reactive({
  node_name: '',
  contract_id: undefined as number | undefined,
  inspector_id: undefined as number | undefined,
  deadline: '',
  template_id: undefined as number | undefined,
})

const nextStatusMap: Record<string, string> = {
  pending: 'in_progress',
  in_progress: 'completed',
  completed: 'accepted',
}

const filteredPending = computed(() => filterTasks(store.pending))
const filteredInProgress = computed(() => filterTasks(store.inProgress))
const filteredCompleted = computed(() => filterTasks(store.completed))
const filteredAccepted = computed(() => filterTasks(store.accepted))

function filterTasks(tasks: InspectionTask[]) {
  return tasks.filter(task => {
    if (filterContract.value && task.contract_id !== filterContract.value) return false
    if (filterInspector.value && task.inspector_id !== filterInspector.value) return false
    return true
  })
}

async function loadOptions() {
  try {
    const [contractRes, inspectorRes, templateRes] = await Promise.all([
      contractApi.list({ page_size: 100 }),
      authApi.inspectors(),
      configApi.inspectionTemplates({ page_size: 100 }),
    ])
    contractOptions.value = contractRes.items.map((c: any) => ({ label: c.name, value: c.id }))
    inspectorOptions.value = inspectorRes.map((u: any) => ({ label: u.display_name, value: u.id }))
    templateOptions.value = templateRes.items.map((t: any) => ({ label: t.name, value: t.id }))
  } catch {}
}

async function handleFilter() {
  const params: Record<string, any> = {}
  if (filterContract.value) params.contract_id = filterContract.value
  if (filterStatus.value) params.status = filterStatus.value
  await store.fetchList(params)
}

function handleReset() {
  filterContract.value = null
  filterInspector.value = null
  filterStatus.value = null
  store.fetchList()
}

async function moveToNext(task: InspectionTask) {
  const nextStatus = nextStatusMap[task.status]
  if (!nextStatus) return
  try {
    await store.updateStatus(task.id, nextStatus)
    message.success('状态更新成功')
    store.fetchList()
  } catch (e: any) {
    message.error(e?.data?.detail || '状态更新失败')
  }
}

async function handleAdd() {
  if (!addForm.node_name) {
    message.warning('请输入节点名称')
    return
  }
  if (!addForm.contract_id) {
    message.warning('请选择合同')
    return
  }
  if (!addForm.inspector_id) {
    message.warning('请选择巡检员')
    return
  }
  if (!addForm.deadline) {
    message.warning('请选择计划日期')
    return
  }
  try {
    await store.createTask(addForm)
    message.success('任务创建成功')
    showAddModal.value = false
    Object.assign(addForm, { node_name: '', contract_id: undefined, inspector_id: undefined, deadline: '', template_id: undefined })
    store.fetchList()
  } catch (e: any) {
    message.error(e?.data?.detail || '创建失败')
  }
}

onMounted(() => {
  authStore.init()
  loadOptions()
  store.fetchList()
})
</script>
