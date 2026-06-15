<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">异常管理</h1>
      <div class="flex gap-8">
        <button class="btn" @click="loadData">刷新</button>
      </div>
    </div>

    <div class="card">
      <div class="filter-bar">
        <div class="filter-item">
          <label>状态：</label>
          <select v-model="filters.status" @change="loadData">
            <option value="all">全部</option>
            <option v-for="s in statusOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </div>
        <div class="filter-item">
          <label>类型：</label>
          <select v-model="filters.type" @change="loadData">
            <option value="all">全部</option>
            <option v-for="t in typeOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </div>
        <div class="filter-item">
          <label>处理人：</label>
          <select v-model="filters.handlerId" @change="loadData">
            <option value="all">全部</option>
            <option v-for="u in handlers" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
        </div>
        <div class="filter-item">
          <label>开始日期：</label>
          <input v-model="filters.startDate" type="date" @change="loadData" />
        </div>
        <div class="filter-item">
          <label>结束日期：</label>
          <input v-model="filters.endDate" type="date" @change="loadData" />
        </div>
        <div class="filter-item">
          <label>关键词：</label>
          <input v-model="filters.keyword" placeholder="搜索异常编号、标题、关联编号" @keyup.enter="loadData" />
        </div>
        <div class="filter-item">
          <button class="btn btn-primary" @click="loadData">查询</button>
        </div>
        <div class="filter-item">
          <div class="relative">
            <button class="btn" @click="showPresetMenu = !showPresetMenu">
              📋 筛选方案 {{ activePreset ? `(${activePreset.name})` : '' }}
            </button>
            <div v-if="showPresetMenu" class="preset-menu">
              <div
                v-for="p in presets"
                :key="p.id"
                class="preset-item"
                :class="{ active: p.isDefault }"
                @click="applyPreset(p)"
              >
                <span>{{ p.name }}{{ p.isDefault ? ' (默认)' : '' }}</span>
                <button class="btn btn-danger btn-sm" @click.stop="deletePreset(p.id)">删除</button>
              </div>
              <div class="preset-item" @click="showSavePreset = true">
                <span class="text-primary">+ 保存当前筛选</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>异常编号</th>
            <th>类型</th>
            <th>关联编号</th>
            <th>标题</th>
            <th>状态</th>
            <th>优先级</th>
            <th>处理人</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id">
            <td><strong>{{ item.exceptionNo }}</strong></td>
            <td><span :class="['tag', getTypeClass(item.type)]">{{ getTypeLabel(item.type) }}</span></td>
            <td>
              <span v-if="item.relatedNo" class="text-secondary">{{ item.relatedNo }}</span>
              <span v-else class="text-secondary">-</span>
            </td>
            <td>{{ item.title }}</td>
            <td>
              <span :class="['status-tag', getStatusClass(item.status)]">{{ getStatusLabel(item.status) }}</span>
            </td>
            <td>
              <span :class="['tag', getPriorityClass(item.priority)]">{{ getPriorityLabel(item.priority) }}</span>
            </td>
            <td>
              <span v-if="item.handler">{{ item.handler.name }}</span>
              <span v-else class="text-secondary">未分配</span>
            </td>
            <td>{{ formatTime(item.createdAt) }}</td>
            <td>
              <div class="flex gap-4">
                <button class="btn btn-primary btn-sm" @click="navigateTo(`/exceptions/${item.id}`)">查看</button>
                <button
                  v-if="canAssign(item)"
                  class="btn btn-sm"
                  @click="openAssignModal(item)"
                >分配</button>
                <button
                  v-if="canProcess(item)"
                  class="btn btn-sm"
                  @click="navigateTo(`/exceptions/${item.id}`)"
                >处理</button>
                <button
                  v-if="canClose(item)"
                  class="btn btn-success btn-sm"
                  @click="handleClose(item)"
                >关闭</button>
              </div>
            </td>
          </tr>
          <tr v-if="list.length === 0">
            <td colspan="9" class="empty">暂无数据</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <button class="page-btn" :disabled="page <= 1" @click="changePage(page - 1)">上一页</button>
        <button
          v-for="p in totalPages"
          :key="p"
          :class="['page-btn', { active: p === page }]"
          @click="changePage(p)"
        >
          {{ p }}
        </button>
        <button class="page-btn" :disabled="page >= totalPages" @click="changePage(page + 1)">下一页</button>
      </div>
    </div>

    <div v-if="showAssignModal" class="modal-mask" @click.self="showAssignModal = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">分配处理人 - {{ currentException?.exceptionNo }}</span>
          <button class="btn" @click="showAssignModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">选择处理人</label>
            <select v-model="assignForm.handlerId" class="form-select">
              <option value="">请选择</option>
              <option v-for="u in handlers" :key="u.id" :value="u.id">{{ u.name }} ({{ u.role }})</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea v-model="assignForm.remark" class="form-textarea" placeholder="请输入分配备注"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showAssignModal = false">取消</button>
          <button class="btn btn-primary" @click="handleAssign" :disabled="!assignForm.handlerId">确认分配</button>
        </div>
      </div>
    </div>

    <div v-if="showSavePreset" class="modal-mask" @click.self="showSavePreset = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">保存筛选方案</span>
          <button class="btn" @click="showSavePreset = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">方案名称</label>
            <input v-model="presetForm.name" class="form-input" placeholder="请输入方案名称" />
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" v-model="presetForm.isDefault" /> 设为默认
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showSavePreset = false">取消</button>
          <button class="btn btn-primary" @click="savePreset">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import dayjs from 'dayjs'

const { user, initAuth, isLoggedIn } = useAuth()

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const filters = reactive({
  status: 'all',
  type: 'all',
  handlerId: 'all',
  startDate: '',
  endDate: '',
  keyword: ''
})

const statusOptions = [
  { value: 'PENDING', label: '待处理' },
  { value: 'ASSIGNED', label: '已分配' },
  { value: 'PROCESSING', label: '处理中' },
  { value: 'RESOLVED', label: '已解决' },
  { value: 'CLOSED', label: '已关闭' }
]

const typeOptions = [
  { value: 'VISITOR_REJECT', label: '访客拒绝' },
  { value: 'WORKORDER_OVERDUE', label: '工单逾期' },
  { value: 'INSPECTION_ISSUE', label: '巡检问题' },
  { value: 'SYSTEM_ERROR', label: '系统错误' }
]

const priorityOptions = [
  { value: 'LOW', label: '低' },
  { value: 'MEDIUM', label: '中' },
  { value: 'HIGH', label: '高' },
  { value: 'URGENT', label: '紧急' }
]

const handlers = ref<any[]>([])
const presets = ref<any[]>([])
const activePreset = ref<any>(null)
const showPresetMenu = ref(false)
const showSavePreset = ref(false)
const showAssignModal = ref(false)
const currentException = ref<any>(null)

const presetForm = reactive({
  name: '',
  isDefault: false
})

const assignForm = reactive({
  handlerId: '',
  remark: ''
})

onMounted(async () => {
  initAuth()
  if (!isLoggedIn.value) {
    navigateTo('/login')
    return
  }
  await Promise.all([
    loadHandlers(),
    loadPresets()
  ])
  await loadData()
})

async function loadHandlers() {
  try {
    const res: any = await useApiFetch('/users/engineers')
    if (res.code === 200) {
      handlers.value = res.data
    }
  } catch (e) {
    // ignore
  }
}

async function loadPresets() {
  try {
    const res: any = await useApiFetch('/filter-presets?pageKey=exception-list')
    if (res.code === 200) {
      presets.value = res.data
      const defaultPreset = res.data.find((p: any) => p.isDefault)
      if (defaultPreset) {
        applyPreset(defaultPreset)
      }
    }
  } catch (e) {
    // ignore
  }
}

async function loadData() {
  try {
    const params = new URLSearchParams({
      page: page.value.toString(),
      pageSize: pageSize.value.toString(),
      ...filters
    } as any)
    const res: any = await useApiFetch(`/exceptions?${params.toString()}`)
    if (res.code === 200) {
      list.value = res.data.list
      total.value = res.data.total
    }
  } catch (e) {
    // ignore
  }
}

function changePage(p: number) {
  page.value = p
  loadData()
}

function applyPreset(preset: any) {
  activePreset.value = preset
  Object.assign(filters, preset.filters)
  showPresetMenu.value = false
  page.value = 1
  loadData()
}

async function savePreset() {
  if (!presetForm.name) {
    alert('请输入方案名称')
    return
  }
  try {
    const res: any = await useApiFetch('/filter-presets', {
      method: 'POST',
      body: {
        name: presetForm.name,
        pageKey: 'exception-list',
        filters: { ...filters },
        isDefault: presetForm.isDefault
      }
    })
    if (res.code === 200) {
      showSavePreset.value = false
      presetForm.name = ''
      presetForm.isDefault = false
      loadPresets()
    }
  } catch (e: any) {
    alert(e.data?.message || '保存失败')
  }
}

async function deletePreset(id: number) {
  if (!confirm('确定要删除此筛选方案吗？')) return
  try {
    await useApiFetch(`/filter-presets/${id}`, { method: 'DELETE' })
    loadPresets()
  } catch (e) {
    // ignore
  }
}

function openAssignModal(item: any) {
  currentException.value = item
  assignForm.handlerId = ''
  assignForm.remark = ''
  showAssignModal.value = true
}

async function handleAssign() {
  if (!currentException.value || !assignForm.handlerId) return
  try {
    const res: any = await useApiFetch(`/exceptions/${currentException.value.id}/assign`, {
      method: 'POST',
      body: assignForm
    })
    if (res.code === 200) {
      showAssignModal.value = false
      loadData()
    }
  } catch (e: any) {
    alert(e.data?.message || '操作失败')
  }
}

async function handleClose(item: any) {
  if (!confirm('确定要关闭此异常吗？关闭后将无法修改。')) return
  try {
    const res: any = await useApiFetch(`/exceptions/${item.id}/close`, {
      method: 'POST'
    })
    if (res.code === 200) {
      loadData()
    }
  } catch (e: any) {
    alert(e.data?.message || '操作失败')
  }
}

function canAssign(item: any) {
  return user.value && ['OPERATOR', 'ADMIN'].includes(user.value.role) &&
    item.status !== 'CLOSED'
}

function canProcess(item: any) {
  return user.value &&
    (['OPERATOR', 'ADMIN'].includes(user.value.role) ||
      (item.handlerId && item.handlerId === user.value.id)) &&
    !['CLOSED'].includes(item.status)
}

function canClose(item: any) {
  return user.value && ['OPERATOR', 'ADMIN'].includes(user.value.role) &&
    ['RESOLVED', 'PROCESSING', 'ASSIGNED'].includes(item.status)
}

function getStatusLabel(status: string) {
  const map: any = {
    PENDING: '待处理',
    ASSIGNED: '已分配',
    PROCESSING: '处理中',
    RESOLVED: '已解决',
    CLOSED: '已关闭'
  }
  return map[status] || status
}

function getStatusClass(status: string) {
  const map: any = {
    PENDING: 'status-pending',
    ASSIGNED: 'status-pending',
    PROCESSING: 'status-processing',
    RESOLVED: 'status-completed',
    CLOSED: 'status-closed'
  }
  return map[status] || ''
}

function getTypeLabel(type: string) {
  const map: any = {
    VISITOR_REJECT: '访客拒绝',
    WORKORDER_OVERDUE: '工单逾期',
    INSPECTION_ISSUE: '巡检问题',
    SYSTEM_ERROR: '系统错误'
  }
  return map[type] || type
}

function getTypeClass(type: string) {
  const map: any = {
    VISITOR_REJECT: 'tag-orange',
    WORKORDER_OVERDUE: 'tag-red',
    INSPECTION_ISSUE: 'tag-orange',
    SYSTEM_ERROR: 'tag-red'
  }
  return map[type] || 'tag-blue'
}

function getPriorityLabel(priority: string) {
  const map: any = {
    LOW: '低',
    MEDIUM: '中',
    HIGH: '高',
    URGENT: '紧急'
  }
  return map[priority] || priority
}

function getPriorityClass(priority: string) {
  const map: any = {
    LOW: 'tag-blue',
    MEDIUM: 'tag-orange',
    HIGH: 'tag-red',
    URGENT: 'tag-red'
  }
  return map[priority] || ''
}

function formatTime(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped>
.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

.text-primary {
  color: #1890ff;
}

.relative {
  position: relative;
}

.preset-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  z-index: 10;
  margin-top: 4px;
}

.preset-item {
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.preset-item:last-child {
  border-bottom: none;
}

.preset-item:hover {
  background: #f5f5f5;
}

.preset-item.active {
  background: #e6f7ff;
}

.gap-4 {
  gap: 4px;
}
</style>
