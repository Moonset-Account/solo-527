<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">访客预约管理</h1>
      <div class="flex gap-8">
        <button class="btn btn-primary" @click="navigateTo('/visitors/create')">
          + 新增预约
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
          <label>日期范围：</label>
          <input v-model="filters.startDate" type="date" @change="loadData" style="width: 120px;" />
          <span style="margin: 0 4px;">至</span>
          <input v-model="filters.endDate" type="date" @change="loadData" style="width: 120px;" />
        </div>
        <div class="filter-item">
          <label>访客姓名：</label>
          <input v-model="filters.visitorName" placeholder="请输入访客姓名" @keyup.enter="loadData" />
        </div>
        <div class="filter-item">
          <label>关键词：</label>
          <input v-model="filters.keyword" placeholder="搜索访客编号、手机号、身份证号" @keyup.enter="loadData" />
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
            <th>访客编号</th>
            <th>访客姓名</th>
            <th>身份证号</th>
            <th>手机号</th>
            <th>来访日期</th>
            <th>状态</th>
            <th>被访租户</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id">
            <td>{{ item.visitNo }}</td>
            <td>{{ item.visitorName }}</td>
            <td>{{ maskIdCard(item.visitorIdCard) }}</td>
            <td>{{ maskPhone(item.visitorPhone) }}</td>
            <td>{{ formatDate(item.visitDate) }}</td>
            <td><span :class="['status-tag', getStatusClass(item.status)]">{{ getStatusLabel(item.status) }}</span></td>
            <td>{{ item.tenant?.name }}</td>
            <td>
              <button class="btn btn-primary btn-sm" @click="navigateTo(`/visitors/${item.id}`)">查看</button>
              <button
                v-if="canApprove(item)"
                class="btn btn-success btn-sm"
                @click="handleApprove(item)"
              >批准</button>
              <button
                v-if="canReject(item)"
                class="btn btn-danger btn-sm"
                @click="handleRejectClick(item)"
              >拒绝</button>
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

    <div v-if="showRejectModal" class="modal-mask" @click.self="showRejectModal = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">拒绝预约</span>
          <button class="btn" @click="showRejectModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">拒绝原因 <span class="text-error">*</span></label>
            <textarea
              v-model="rejectForm.reason"
              class="form-textarea"
              placeholder="请详细说明拒绝原因，该原因将作为审核异常记录保存"
              rows="4"
              required
            ></textarea>
          </div>
          <div class="alert alert-warning">
            <strong>提示：</strong>拒绝后系统将自动创建审核异常记录，包含影响范围和处理顺序供后续处理人参考。
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showRejectModal = false">取消</button>
          <button class="btn btn-danger" @click="handleReject" :disabled="!rejectForm.reason">确认拒绝</button>
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
  startDate: '',
  endDate: '',
  visitorName: '',
  keyword: ''
})

const statusOptions = [
  { value: 'PENDING', label: '待审核' },
  { value: 'APPROVED', label: '已通过' },
  { value: 'REJECTED', label: '已拒绝' },
  { value: 'CHECKED_IN', label: '已签到' },
  { value: 'CHECKED_OUT', label: '已签退' },
  { value: 'CANCELLED', label: '已取消' }
]

const presets = ref<any[]>([])
const activePreset = ref<any>(null)
const showPresetMenu = ref(false)
const showSavePreset = ref(false)
const presetForm = reactive({
  name: '',
  isDefault: false
})

const showRejectModal = ref(false)
const currentVisitor = ref<any>(null)
const rejectForm = reactive({
  reason: ''
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
    const res: any = await useApiFetch('/filter-presets?pageKey=visitor-list')
    if (res.code === 200) {
      presets.value = res.data
      const defaultPreset = res.data.find((p: any) => p.isDefault)
      if (defaultPreset) {
        applyPreset(defaultPreset)
      }
    }
  } catch (e) {
  }
}

async function loadData() {
  try {
    const params = new URLSearchParams({
      page: page.value.toString(),
      pageSize: pageSize.value.toString(),
      ...filters
    } as any)
    const res: any = await useApiFetch(`/visitors?${params.toString()}`)
    if (res.code === 200) {
      list.value = res.data.list
      total.value = res.data.total
    }
  } catch (e) {
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
        pageKey: 'visitor-list',
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
  }
}

function canApprove(item: any) {
  return user.value && ['OPERATOR', 'ADMIN'].includes(user.value.role) &&
    item.status === 'PENDING'
}

function canReject(item: any) {
  return user.value && ['OPERATOR', 'ADMIN'].includes(user.value.role) &&
    item.status === 'PENDING'
}

async function handleApprove(item: any) {
  if (!confirm(`确定要批准访客「${item.visitorName}」的预约吗？`)) return
  try {
    const res: any = await useApiFetch(`/visitors/${item.id}/approve`, {
      method: 'POST'
    })
    if (res.code === 200) {
      loadData()
    }
  } catch (e: any) {
    alert(e.data?.message || '操作失败')
  }
}

function handleRejectClick(item: any) {
  currentVisitor.value = item
  rejectForm.reason = ''
  showRejectModal.value = true
}

async function handleReject() {
  if (!rejectForm.reason || !currentVisitor.value) return
  try {
    const res: any = await useApiFetch(`/visitors/${currentVisitor.value.id}/reject`, {
      method: 'POST',
      body: {
        reason: rejectForm.reason
      }
    })
    if (res.code === 200) {
      showRejectModal.value = false
      currentVisitor.value = null
      rejectForm.reason = ''
      loadData()
    }
  } catch (e: any) {
    alert(e.data?.message || '操作失败')
  }
}

function getStatusLabel(status: string) {
  const map: any = {
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
    CHECKED_IN: '已签到',
    CHECKED_OUT: '已签退',
    CANCELLED: '已取消'
  }
  return map[status] || status
}

function getStatusClass(status: string) {
  const map: any = {
    PENDING: 'status-pending',
    APPROVED: 'status-completed',
    REJECTED: 'status-overdue',
    CHECKED_IN: 'status-processing',
    CHECKED_OUT: 'status-closed',
    CANCELLED: 'status-closed'
  }
  return map[status] || ''
}

function maskIdCard(idCard: string) {
  if (!idCard || idCard.length < 8) return idCard
  return idCard.substring(0, 6) + '********' + idCard.substring(idCard.length - 4)
}

function maskPhone(phone: string) {
  if (!phone || phone.length < 11) return phone
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4)
}

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD')
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
