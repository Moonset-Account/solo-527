<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ user?.role === 'ENGINEER' ? '我的巡检任务' : '巡检任务管理' }}</h1>
      <div class="flex gap-8">
        <button v-if="user?.role !== 'TENANT'" class="btn btn-primary" @click="navigateTo('/inspections/create')">
          + 新建巡检
        </button>
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
          <label>优先级：</label>
          <select v-model="filters.priority" @change="loadData">
            <option value="all">全部</option>
            <option v-for="p in priorityOptions" :key="p.value" :value="p.value">{{ p.label }}</option>
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
          <input v-model="filters.keyword" placeholder="搜索任务编号、标题、区域" @keyup.enter="loadData" />
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
            <th>任务编号</th>
            <th>标题</th>
            <th>区域</th>
            <th>状态</th>
            <th>优先级</th>
            <th>处理人</th>
            <th>截止时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id">
            <td>{{ item.taskNo }}</td>
            <td>{{ item.title }}</td>
            <td>{{ item.area }}</td>
            <td><span :class="['status-tag', getStatusClass(item.status)]">{{ getStatusLabel(item.status) }}</span></td>
            <td><span :class="['tag', getPriorityClass(item.priority)]">{{ getPriorityLabel(item.priority) }}</span></td>
            <td>
              <template v-if="item.assignee">
                {{ item.assignee.name }}
              </template>
              <span v-else class="text-secondary">未分配</span>
            </td>
            <td :class="{ 'text-error': isOverdue(item.deadline, item.status) }">{{ item.deadline ? formatTime(item.deadline) : '-' }}</td>
            <td>
              <button class="btn btn-primary btn-sm" @click="navigateTo(`/inspections/${item.id}`)">查看</button>
              <button
                v-if="canComplete(item.status)"
                class="btn btn-success btn-sm"
                @click="handleCompleteClick(item)"
              >完成</button>
            </td>
          </tr>
          <tr v-if="list.length === 0">
            <td colspan="8" class="empty">暂无数据</td>
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

    <div v-if="showCompleteModal" class="modal-mask" @click.self="showCompleteModal = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">完成巡检</span>
          <button class="btn" @click="showCompleteModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">巡检结果 <span class="text-error">*</span></label>
            <select v-model="completeForm.result" class="form-select" required>
              <option value="">请选择结果</option>
              <option value="NORMAL">正常</option>
              <option value="MINOR_ISSUES">轻微问题</option>
              <option value="MAJOR_ISSUES">严重问题</option>
              <option value="REPAIR_NEEDED">需维修</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea v-model="completeForm.remark" class="form-textarea" placeholder="请输入巡检备注，如发现的问题、处理建议等" rows="4"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showCompleteModal = false">取消</button>
          <button class="btn btn-primary" @click="handleComplete" :disabled="!completeForm.result">确认完成</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import dayjs from 'dayjs'

const route = useRoute()
const { user, initAuth, isLoggedIn } = useAuth()

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const filters = reactive({
  status: route.query.status as string || 'all',
  priority: 'all',
  startDate: '',
  endDate: '',
  keyword: ''
})

const statusOptions = [
  { value: 'PENDING', label: '待处理' },
  { value: 'IN_PROGRESS', label: '进行中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' }
]

const priorityOptions = [
  { value: 'LOW', label: '低' },
  { value: 'MEDIUM', label: '中' },
  { value: 'HIGH', label: '高' },
  { value: 'URGENT', label: '紧急' }
]

const presets = ref<any[]>([])
const activePreset = ref<any>(null)
const showPresetMenu = ref(false)
const showSavePreset = ref(false)
const showCompleteModal = ref(false)
const selectedTask = ref<any>(null)

const presetForm = reactive({
  name: '',
  isDefault: false
})

const completeForm = reactive({
  result: '',
  remark: ''
})

onMounted(async () => {
  initAuth()
  if (!isLoggedIn.value) {
    navigateTo('/login')
    return
  }
  await loadPresets()
  await loadData()
})

async function loadPresets() {
  try {
    const res: any = await useApiFetch('/filter-presets?pageKey=inspection-list')
    if (res.code === 200) {
      presets.value = res.data
      const defaultPreset = res.data.find((p: any) => p.isDefault)
      if (defaultPreset && !route.query.status) {
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
    const res: any = await useApiFetch(`/inspections?${params.toString()}`)
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
        pageKey: 'inspection-list',
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

function canComplete(status: string) {
  return user.value && ['ENGINEER', 'OPERATOR', 'ADMIN'].includes(user.value.role) &&
    ['PENDING', 'IN_PROGRESS'].includes(status)
}

function handleCompleteClick(item: any) {
  selectedTask.value = item
  completeForm.result = ''
  completeForm.remark = ''
  showCompleteModal.value = true
}

async function handleComplete() {
  if (!completeForm.result || !selectedTask.value) return
  try {
    const res: any = await useApiFetch(`/inspections/${selectedTask.value.id}/complete`, {
      method: 'POST',
      body: completeForm
    })
    if (res.code === 200) {
      showCompleteModal.value = false
      loadData()
    }
  } catch (e: any) {
    alert(e.data?.message || '操作失败')
  }
}

function isOverdue(deadline: string, status: string) {
  if (!deadline || ['COMPLETED', 'CANCELLED'].includes(status)) return false
  return new Date() > new Date(deadline)
}

function getStatusLabel(status: string) {
  const map: any = {
    PENDING: '待处理',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    CANCELLED: '已取消'
  }
  return map[status] || status
}

function getStatusClass(status: string) {
  const map: any = {
    PENDING: 'status-pending',
    IN_PROGRESS: 'status-processing',
    COMPLETED: 'status-completed',
    CANCELLED: 'status-closed'
  }
  return map[status] || ''
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
</style>
