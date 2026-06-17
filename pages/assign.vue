<template>
  <div>
    <div class="stats-grid mb-4">
      <div class="stat-card">
        <div class="stat-label">待分派合同</div>
        <div class="stat-value text-primary">{{ pendingContracts.length }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">在线律师</div>
        <div class="stat-value text-purple" style="color:var(--purple)">{{ lawyers.length }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">在线复核人</div>
        <div class="stat-value" style="color:var(--info)">{{ reviewers.length }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">已分派（本月）</div>
        <div class="stat-value text-success">{{ assignedThisMonth }}</div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header">
        <div class="card-title">待分派合同列表</div>
        <div class="flex items-center gap-2">
          <select v-model="filterStatus" class="form-select" style="width:180px" @change="filterContracts">
            <option value="PENDING">待分派</option>
            <option value="LAWYER_DONE">待复核分派</option>
            <option value="ALL">全部</option>
          </select>
        </div>
      </div>
      <div class="card-body" style="padding:0">
        <div v-if="filteredContracts.length === 0" class="empty-state py-8">
          <div style="font-size:40px;margin-bottom:12px">✅</div>
          <div>暂无待分派合同</div>
        </div>
        <div
          v-for="c in filteredContracts"
          :key="c.id"
          class="contract-row"
          :class="{ active: selectedContractId === c.id }"
          @click="selectContract(c)"
        >
          <div class="flex items-start justify-between flex-1">
            <div style="flex:1;min-width:0">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-semibold text-primary">{{ c.contractNo }}</span>
                <span class="badge" :class="getStatusBadgeClass(c.status)">{{ getStatusLabel(c.status) }}</span>
                <span v-if="c.priority === 'URGENT'" class="badge badge-error">紧急</span>
                <span v-else-if="c.priority === 'HIGH'" class="badge badge-warning">高优</span>
              </div>
              <div class="font-semibold truncate" style="max-width:400px">{{ c.title }}</div>
              <div class="text-sm text-gray-500 mt-1">
                甲方: {{ c.partyA }} · 乙方: {{ c.partyB }}
              </div>
              <div class="text-sm text-gray-500">
                类型: {{ c.contractType }} · 金额: {{ formatAmount(c.amount, c.currency) }} · 创建: {{ formatDate(c.createdAt, false) }}
              </div>
              <div class="flex items-center gap-3 mt-2 text-xs">
                <span v-if="c.rectifyDeadline">
                  <span class="text-gray-500">整改期限:</span>
                  <span :class="{
                    'text-danger': isDeadlineOverdue(c.rectifyDeadline),
                    'text-warning': isDeadlineNear(c.rectifyDeadline) && !isDeadlineOverdue(c.rectifyDeadline)
                  }">
                    {{ formatDate(c.rectifyDeadline, false) }}
                    <span v-if="isDeadlineOverdue(c.rectifyDeadline)">(逾期{{ -daysFromNow(c.rectifyDeadline) }}天)</span>
                    <span v-else-if="isDeadlineNear(c.rectifyDeadline)">(剩{{ daysFromNow(c.rectifyDeadline) }}天)</span>
                  </span>
                </span>
                <span v-if="c._count.opinions">意见: {{ c._count.opinions }}</span>
                <span v-if="c._count.downloads">下载: {{ c._count.downloads }}</span>
              </div>
            </div>
            <div class="flex flex-col items-end gap-2" style="margin-left:16px">
              <button
                v-if="['NEW', 'RECTIFYING'].includes(c.status)"
                class="btn btn-primary btn-sm"
                @click.stop="selectContract(c); assignMode = 'LAWYER'"
              >分派律师</button>
              <button
                v-if="['LAWYER_COMPLETED', 'RECTIFYING'].includes(c.status)"
                class="btn btn-primary btn-sm"
                @click.stop="selectContract(c); assignMode = 'REVIEWER'"
              >分派复核人</button>
              <NuxtLink :to="`/contracts/${c.id}`" class="btn btn-secondary btn-sm">查看详情</NuxtLink>
            </div>
          </div>

          <div v-if="c.assignments?.length" class="current-assign mt-3">
            <div v-for="a in c.assignments.slice(0,1)" :key="a.id" class="flex items-center gap-6">
              <div v-if="a.lawyer" class="flex items-center gap-2">
                <span class="badge badge-lawyer">律师</span>
                <div class="user-mini-avatar" style="background:var(--purple)">{{ a.lawyer.name?.charAt(0) }}</div>
                <div>
                  <div class="font-semibold text-sm">{{ a.lawyer.name }}</div>
                  <div class="text-xs text-gray-500">
                    {{ formatDate(a.lawyerAssignedAt, false) }}
                    <span v-if="a.lawyerDeadline" class="ml-1">截止: {{ formatDate(a.lawyerDeadline, false) }}</span>
                    <span v-if="a.lawyerCompletedAt" class="ml-1 text-success">✓ 已完成</span>
                  </div>
                </div>
              </div>
              <div v-if="a.reviewer" class="flex items-center gap-2">
                <span class="badge badge-reviewer">复核</span>
                <div class="user-mini-avatar" style="background:#db2777">{{ a.reviewer.name?.charAt(0) }}</div>
                <div>
                  <div class="font-semibold text-sm">{{ a.reviewer.name }}</div>
                  <div class="text-xs text-gray-500">
                    {{ a.reviewerAssignedAt ? formatDate(a.reviewerAssignedAt, false) : '-' }}
                    <span v-if="a.reviewerDeadline" class="ml-1">截止: {{ formatDate(a.reviewerDeadline, false) }}</span>
                    <span v-if="a.reviewerCompletedAt" class="ml-1 text-success">✓ 已完成</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedContract" class="card">
      <div class="card-header">
        <div class="card-title">
          分派 - {{ selectedContract.contractNo }}
          <span class="text-sm font-normal text-gray-500 ml-2">{{ selectedContract.title }}</span>
        </div>
      </div>
      <div class="card-body">
        <div class="tabs">
          <div class="tab-item" :class="{ active: assignMode === 'LAWYER' }" @click="assignMode = 'LAWYER'">分派律师</div>
          <div class="tab-item" :class="{ active: assignMode === 'REVIEWER' }" @click="assignMode = 'REVIEWER'">分派复核人</div>
        </div>

        <div class="grid-2" style="grid-template-columns:1.2fr 1fr">
          <div>
            <div class="font-semibold mb-3 flex items-center justify-between">
              <span>选择{{ assignMode === 'LAWYER' ? '律师' : '复核人' }}</span>
              <input
                v-model="userSearch"
                class="form-input"
                style="width:200px"
                placeholder="搜索姓名/部门..."
              />
            </div>
            <div class="user-list">
              <div
                v-for="u in filteredUsers"
                :key="u.id"
                class="user-card"
                :class="{ active: selectedUserId === u.id }"
                @click="selectedUserId = u.id"
              >
                <div class="user-avatar-lg" :style="{ background: assignMode === 'LAWYER' ? 'var(--purple)' : '#db2777' }">
                  {{ u.name?.charAt(0) }}
                </div>
                <div style="flex:1;min-width:0">
                  <div class="font-semibold">{{ u.name }}</div>
                  <div class="text-sm text-gray-500">
                    {{ u.department || '法务部' }} · {{ u.email }}
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    <span class="badge" :class="getRoleBadgeClass(u.role)">{{ getRoleLabel(u.role) }}</span>
                    <span class="ml-2">当前负责: {{ getActiveCount(u.id) }} 件</span>
                  </div>
                </div>
                <div v-if="selectedUserId === u.id" class="check-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="width:18px;height:18px">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>
              <div v-if="filteredUsers.length === 0" class="text-center py-8 text-gray-400">
                暂无匹配结果
              </div>
            </div>
          </div>

          <div>
            <div class="font-semibold mb-3">分派设置</div>
            <div class="assign-settings p-4 rounded-lg" style="background:var(--gray-50)">
              <div class="mb-4">
                <label class="form-label">
                  {{ assignMode === 'LAWYER' ? '律师' : '复核人' }}审阅截止日期
                </label>
                <input
                  v-model="assignForm.deadline"
                  type="date"
                  class="form-input"
                  :min="today"
                />
                <div class="text-xs text-gray-500 mt-1">
                  建议设置合理期限，系统将在截止前自动发送提醒
                </div>
              </div>

              <div class="mb-4">
                <label class="form-label">分派备注</label>
                <textarea
                  v-model="assignForm.note"
                  class="form-textarea"
                  rows="3"
                  placeholder="例如：请重点关注知识产权条款、违约责任等..."
                ></textarea>
              </div>

              <div class="mb-4 p-3 rounded-lg" style="background:white">
                <div class="text-sm text-gray-500 mb-2">分派摘要</div>
                <div class="text-sm">
                  <div class="flex justify-between py-1">
                    <span class="text-gray-500">合同</span>
                    <span class="font-semibold truncate ml-4" style="max-width:200px">{{ selectedContract.contractNo }}</span>
                  </div>
                  <div class="flex justify-between py-1">
                    <span class="text-gray-500">{{ assignMode === 'LAWYER' ? '律师' : '复核人' }}</span>
                    <span class="font-semibold">{{ selectedUser?.name || '未选择' }}</span>
                  </div>
                  <div class="flex justify-between py-1">
                    <span class="text-gray-500">截止日期</span>
                    <span class="font-semibold" :class="{ 'text-warning': assignForm.deadline && isDeadlineNear(assignForm.deadline) }">
                      {{ assignForm.deadline || '未设置' }}
                    </span>
                  </div>
                  <div class="flex justify-between py-1">
                    <span class="text-gray-500">优先级</span>
                    <span>
                      <span v-if="selectedContract.priority === 'URGENT'" class="badge badge-error">紧急</span>
                      <span v-else-if="selectedContract.priority === 'HIGH'" class="badge badge-warning">高</span>
                      <span v-else-if="selectedContract.priority === 'NORMAL'" class="badge badge-info">正常</span>
                      <span v-else class="badge badge-new">低</span>
                    </span>
                  </div>
                </div>
              </div>

              <button
                class="btn btn-primary w-full"
                style="width:100%;justify-content:center"
                :disabled="!selectedUserId || submitting"
                @click="doAssign"
              >
                {{ submitting ? '提交中...' : `确认分派${assignMode === 'LAWYER' ? '律师' : '复核人'}` }}
              </button>
            </div>

            <div class="mt-4 p-4 rounded-lg border" style="border-color:var(--gray-200)">
              <div class="font-semibold mb-2 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:var(--info)">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                分派提示
              </div>
              <ul class="text-sm text-gray-600 space-y-1 list-disc pl-5">
                <li>分派后系统会自动更新合同状态</li>
                <li>设置截止日期后会发送到期提醒</li>
                <li>律师完成后可继续分派复核人</li>
                <li>如需同时分派，可分别选择律师和复核人</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

const ui = useUiStore()
const route = useRoute()

const loading = ref(false)
const contracts = ref<any[]>([])
const lawyers = ref<any[]>([])
const reviewers = ref<any[]>([])
const selectedContractId = ref<string | null>(null)
const selectedUserId = ref<string | null>(null)
const assignMode = ref<'LAWYER' | 'REVIEWER'>('LAWYER')
const userSearch = ref('')
const filterStatus = ref('PENDING')
const submitting = ref(false)

const assignForm = reactive({
  deadline: '',
  note: ''
})

const today = computed(() => new Date().toISOString().slice(0, 10))

const pendingContracts = computed(() =>
  contracts.value.filter(c => ['NEW', 'LAWYER_COMPLETED', 'RECTIFYING'].includes(c.status))
)

const filteredContracts = computed(() => {
  if (filterStatus.value === 'PENDING') {
    return contracts.value.filter(c => ['NEW', 'RECTIFYING'].includes(c.status))
  }
  if (filterStatus.value === 'LAWYER_DONE') {
    return contracts.value.filter(c => c.status === 'LAWYER_COMPLETED')
  }
  return contracts.value
})

const selectedContract = computed(() =>
  contracts.value.find(c => c.id === selectedContractId.value) || null
)

const allUsers = computed(() =>
  assignMode.value === 'LAWYER' ? lawyers.value : reviewers.value
)

const filteredUsers = computed(() => {
  if (!userSearch.value) return allUsers.value
  const kw = userSearch.value.toLowerCase()
  return allUsers.value.filter(u =>
    u.name?.toLowerCase().includes(kw) ||
    u.department?.toLowerCase().includes(kw) ||
    u.email?.toLowerCase().includes(kw)
  )
})

const selectedUser = computed(() =>
  allUsers.value.find(u => u.id === selectedUserId.value) || null
)

const assignedThisMonth = computed(() => {
  const now = new Date()
  return contracts.value.filter(c => {
    const a = c.assignments?.[0]
    if (!a) return false
    const d = new Date(a.lawyerAssignedAt || a.reviewerAssignedAt || a.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
})

function getActiveCount(userId: string): number {
  return contracts.value.filter(c => {
    const a = c.assignments?.[0]
    if (!a) return false
    if (assignMode.value === 'LAWYER') {
      return a.lawyerId === userId && !a.lawyerCompletedAt && !['COMPLETED', 'ERROR'].includes(c.status)
    }
    return a.reviewerId === userId && !a.reviewerCompletedAt && !['COMPLETED', 'ERROR'].includes(c.status)
  }).length
}

function selectContract(c: any) {
  selectedContractId.value = c.id
  selectedUserId.value = null
  if (c.status === 'LAWYER_COMPLETED') {
    assignMode.value = 'REVIEWER'
  } else {
    assignMode.value = 'LAWYER'
  }
  const a = c.assignments?.[0]
  assignForm.deadline = ''
  assignForm.note = ''
}

function filterContracts() {
  fetchContracts()
}

async function fetchContracts() {
  loading.value = true
  try {
    const res: any = await $fetch('/api/contracts', { params: { pageSize: 100 } })
    contracts.value = res.data || []
    if (route.query.contractId) {
      selectContract(contracts.value.find((c: any) => c.id === route.query.contractId) || contracts.value[0])
    } else if (contracts.value.length > 0) {
      selectContract(pendingContracts.value[0] || contracts.value[0])
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function fetchUsers() {
  try {
    const [lawRes, revRes]: any = await Promise.all([
      $fetch('/api/users', { params: { role: 'LAWYER', pageSize: 100 } }),
      $fetch('/api/users', { params: { role: 'REVIEWER', pageSize: 100 } })
    ])
    lawyers.value = lawRes.data || []
    reviewers.value = revRes.data || []
    const [mgrRes, adminRes]: any = await Promise.all([
      $fetch('/api/users', { params: { role: 'LEGAL_MANAGER', pageSize: 100 } }),
      $fetch('/api/users', { params: { role: 'ADMIN', pageSize: 100 } })
    ])
    const extra = [...(mgrRes.data || []), ...(adminRes.data || [])]
    lawyers.value = [...lawyers.value, ...extra]
    reviewers.value = [...reviewers.value, ...extra]
  } catch (e) {
    console.error(e)
  }
}

async function doAssign() {
  if (!selectedContract.value || !selectedUserId.value) return
  submitting.value = true
  ui.showLoading('分派中...')
  try {
    const body: any = { note: assignForm.note }
    if (assignMode.value === 'LAWYER') {
      body.lawyerId = selectedUserId.value
      body.lawyerDeadline = assignForm.deadline || undefined
      if (selectedContract.value.status === 'RECTIFYING' && selectedContract.value.assignments?.[0]?.reviewerId) {
        body.reviewerId = selectedContract.value.assignments[0].reviewerId
      }
    } else {
      body.reviewerId = selectedUserId.value
      body.reviewerDeadline = assignForm.deadline || undefined
      if (selectedContract.value.assignments?.[0]?.lawyerId) {
        body.lawyerId = selectedContract.value.assignments[0].lawyerId
      }
    }
    await $fetch(`/api/contracts/${selectedContract.value.id}/assign`, {
      method: 'POST',
      body
    })
    alert('分派成功！')
    await fetchContracts()
  } catch (e: any) {
    alert(e?.data?.message || e?.message || '分派失败')
  } finally {
    submitting.value = false
    ui.hideLoading()
  }
}

onMounted(() => {
  ui.setPageTitle('分派管理')
  ui.setActiveNav('assign')
  fetchContracts()
  fetchUsers()
})
</script>

<style scoped>
.contract-row {
  padding: 16px 20px;
  border-bottom: 1px solid var(--gray-100);
  cursor: pointer;
  transition: background 0.15s;
}

.contract-row:hover {
  background: var(--gray-50);
}

.contract-row.active {
  background: #eff6ff;
}

.contract-row:last-child {
  border-bottom: none;
}

.current-assign {
  padding: 12px 16px;
  background: var(--gray-50);
  border-radius: 8px;
}

.user-mini-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-list {
  max-height: 480px;
  overflow-y: auto;
  border: 1px solid var(--gray-200);
  border-radius: 10px;
  padding: 8px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 6px;
  transition: all 0.15s;
  border: 2px solid transparent;
}

.user-card:hover {
  background: var(--gray-50);
}

.user-card.active {
  background: #eff6ff;
  border-color: var(--primary);
}

.user-avatar-lg {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
}

.check-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.space-y-1 > * + * {
  margin-top: 4px;
}
</style>
