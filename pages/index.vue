<template>
  <div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">全部合同</div>
        <div class="stat-value">{{ stats.total || 0 }}</div>
        <div class="stat-change up">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          </svg>
          {{ currentMonthCount }} 份本月新增
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">处理中</div>
        <div class="stat-value text-warning">{{ inProgressCount }}</div>
        <div class="stat-change">
          <span style="color:var(--warning)">律师审阅: {{ lawyerReviewingCount }}</span>
          <span style="color:var(--info)">复核: {{ reviewerReviewingCount }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">待整改</div>
        <div class="stat-value text-danger">{{ rectifyCount }}</div>
        <div class="stat-change" :class="urgentRectify > 0 ? 'down' : ''">
          {{ urgentRectify > 0 ? urgentRectify + ' 项已逾期' : '暂无逾期' }}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">已完成</div>
        <div class="stat-value text-success">{{ completedCount }}</div>
        <div class="stat-change up">
          完成率 {{ total > 0 ? Math.round(completedCount / total * 100) : 0 }}%
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title flex items-center gap-2">
          合同列表
          <span class="text-sm text-gray-500 font-normal">共 {{ total }} 条记录</span>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink to="/upload" class="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            上传合同
          </NuxtLink>
        </div>
      </div>

      <div class="card-body">
        <div class="filter-bar grid-4 mb-4">
          <div>
            <label class="form-label text-sm">关键词</label>
            <input v-model="filters.keyword" class="form-input" placeholder="合同号/名称/甲乙双方" @keyup.enter="fetchContracts" />
          </div>
          <div>
            <label class="form-label text-sm">状态</label>
            <select v-model="filters.status" class="form-select" @change="fetchContracts">
              <option value="ALL">全部状态</option>
              <option value="NEW">新建</option>
              <option value="ASSIGNED_LAWYER">已分派律师</option>
              <option value="LAWYER_REVIEWING">律师审阅中</option>
              <option value="LAWYER_COMPLETED">律师完成</option>
              <option value="ASSIGNED_REVIEWER">已分派复核</option>
              <option value="REVIEWER_REVIEWING">复核中</option>
              <option value="PENDING_RECTIFICATION">待整改</option>
              <option value="RECTIFYING">整改中</option>
              <option value="COMPLETED">已完成</option>
              <option value="ERROR">异常</option>
            </select>
          </div>
          <div>
            <label class="form-label text-sm">合同类型</label>
            <select v-model="filters.contractType" class="form-select" @change="fetchContracts">
              <option value="ALL">全部类型</option>
              <option v-for="t in CONTRACT_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div>
            <label class="form-label text-sm">优先级</label>
            <select v-model="filters.priority" class="form-select" @change="fetchContracts">
              <option value="ALL">全部</option>
              <option v-for="p in PRIORITY_OPTIONS" :key="p.value" :value="p.value">{{ p.label }}</option>
            </select>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>合同编号</th>
                <th>合同名称</th>
                <th>甲乙方</th>
                <th>类型</th>
                <th>金额</th>
                <th>状态</th>
                <th>分派</th>
                <th style="white-space:nowrap">整改期限</th>
                <th>意见</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in contracts" :key="c.id">
                <td>
                  <div class="font-semibold text-primary" style="cursor:pointer" @click="goDetail(c.id)">
                    {{ c.contractNo }}
                  </div>
                  <div class="text-sm text-gray-500">
                    <span v-if="c.priority === 'URGENT'" class="badge badge-error">紧急</span>
                    <span v-else-if="c.priority === 'HIGH'" class="badge badge-warning">高优</span>
                    <span v-else-if="c.priority === 'LOW'" class="badge badge-info">低</span>
                  </div>
                </td>
                <td style="min-width:200px">
                  <div class="font-semibold truncate" :title="c.title" style="max-width:280px">
                    {{ c.title }}
                  </div>
                  <div v-if="c.currentVersionId" class="text-sm text-gray-500">
                    <span v-for="v in c.versions" :key="v.id">v{{ v.versionNo }} · {{ v.fileName }}</span>
                  </div>
                </td>
                <td style="min-width:200px">
                  <div class="truncate" :title="c.partyA"><span class="text-gray-500">甲:</span> {{ c.partyA }}</div>
                  <div class="truncate" :title="c.partyB"><span class="text-gray-500">乙:</span> {{ c.partyB }}</div>
                </td>
                <td><span class="badge badge-info">{{ c.contractType }}</span></td>
                <td>{{ formatAmount(c.amount, c.currency) }}</td>
                <td>
                  <span class="badge" :class="getStatusBadgeClass(c.status)">
                    {{ getStatusLabel(c.status) }}
                  </span>
                </td>
                <td style="min-width:140px">
                  <div v-if="c.assignments?.length" v-for="a in c.assignments.slice(0,1)" :key="a.id">
                    <div class="flex items-center gap-2 mb-1" v-if="a.lawyer">
                      <span class="badge badge-lawyer">律</span>
                      <span class="text-sm truncate">{{ a.lawyer.name }}</span>
                    </div>
                    <div class="flex items-center gap-2" v-if="a.reviewer">
                      <span class="badge badge-reviewer">复</span>
                      <span class="text-sm truncate">{{ a.reviewer.name }}</span>
                    </div>
                  </div>
                  <span v-else class="text-sm text-gray-400">未分派</span>
                </td>
                <td style="white-space:nowrap">
                  <div v-if="c.rectifyDeadline"
                       :class="{
                         'text-danger': isDeadlineOverdue(c.rectifyDeadline),
                         'text-warning': isDeadlineNear(c.rectifyDeadline) && !isDeadlineOverdue(c.rectifyDeadline)
                       }">
                    <div>{{ formatDate(c.rectifyDeadline, false) }}</div>
                    <div class="text-sm">
                      <span v-if="isDeadlineOverdue(c.rectifyDeadline)" class="text-danger">
                        逾期{{ -daysFromNow(c.rectifyDeadline) }}天
                      </span>
                      <span v-else-if="isDeadlineNear(c.rectifyDeadline)" class="text-warning">
                        剩{{ daysFromNow(c.rectifyDeadline) }}天
                      </span>
                      <span v-else class="text-gray-500">
                        {{ daysFromNow(c.rectifyDeadline) }}天后
                      </span>
                    </div>
                  </div>
                  <span v-else class="text-gray-400 text-sm">-</span>
                </td>
                <td>
                  <span class="badge" :class="c._count.opinions > 0 ? 'badge-info' : 'badge-new'">
                    {{ c._count.opinions }} 条
                  </span>
                </td>
                <td style="white-space:nowrap">{{ formatDate(c.createdAt, false) }}</td>
                <td>
                  <div class="flex items-center gap-2">
                    <button class="btn btn-secondary btn-sm" @click="goDetail(c.id)">查看</button>
                    <button
                      v-if="showAssignButton(c)"
                      class="btn btn-primary btn-sm"
                      @click="goAssign(c.id)"
                    >分派</button>
                  </div>
                </td>
              </tr>
              <tr v-if="contracts.length === 0 && !loading">
                <td colspan="11">
                  <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <div>暂无合同数据</div>
                    <NuxtLink to="/upload" class="btn btn-primary mt-4" style="display:inline-flex">立即上传</NuxtLink>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination mt-4 flex items-center justify-between">
          <div class="text-sm text-gray-500">
            第 {{ page }} / {{ totalPages }} 页，共 {{ total }} 条
          </div>
          <div class="flex items-center gap-2">
            <button class="btn btn-secondary btn-sm" :disabled="page <= 1" @click="changePage(page - 1)">上一页</button>
            <template v-for="p in pageRange" :key="p">
              <button v-if="p !== '...'" class="btn btn-sm"
                      :class="p === page ? 'btn-primary' : 'btn-secondary'"
                      @click="changePage(p)">{{ p }}</button>
              <span v-else class="px-2 text-gray-400">...</span>
            </template>
            <button class="btn btn-secondary btn-sm" :disabled="page >= totalPages" @click="changePage(page + 1)">下一页</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const ui = useUiStore()
const router = useRouter()

const contracts = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(15)
const loading = ref(false)

const filters = reactive({
  keyword: '',
  status: 'ALL',
  contractType: 'ALL',
  priority: 'ALL'
})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

const stats = computed(() => ({
  total: total.value
}))

const currentMonthCount = computed(() => {
  const now = new Date()
  return contracts.value.filter(c => {
    const d = new Date(c.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
})

const inProgressCount = computed(() =>
  contracts.value.filter(c =>
    ['ASSIGNED_LAWYER', 'LAWYER_REVIEWING', 'LAWYER_COMPLETED', 'ASSIGNED_REVIEWER', 'REVIEWER_REVIEWING', 'REVIEWER_COMPLETED', 'PENDING_RECTIFICATION', 'RECTIFYING'].includes(c.status)
  ).length
)

const lawyerReviewingCount = computed(() =>
  contracts.value.filter(c => c.status === 'LAWYER_REVIEWING').length
)

const reviewerReviewingCount = computed(() =>
  contracts.value.filter(c => c.status === 'REVIEWER_REVIEWING').length
)

const rectifyCount = computed(() =>
  contracts.value.filter(c => ['PENDING_RECTIFICATION', 'RECTIFYING'].includes(c.status)).length
)

const urgentRectify = computed(() =>
  contracts.value.filter(c =>
    ['PENDING_RECTIFICATION', 'RECTIFYING'].includes(c.status) &&
    c.rectifyDeadline && isDeadlineOverdue(c.rectifyDeadline)
  ).length
)

const completedCount = computed(() =>
  contracts.value.filter(c => c.status === 'COMPLETED').length
)

const pageRange = computed(() => {
  const pages: (number | string)[] = []
  const totalP = totalPages.value
  const current = page.value

  if (totalP <= 7) {
    for (let i = 1; i <= totalP; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    const start = Math.max(2, current - 1)
    const end = Math.min(totalP - 1, current + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (current < totalP - 2) pages.push('...')
    pages.push(totalP)
  }
  return pages
})

async function fetchContracts() {
  loading.value = true
  ui.showLoading('加载中...')
  try {
    const res: any = await $fetch('/api/contracts', {
      params: {
        ...filters,
        page: page.value,
        pageSize: pageSize.value
      }
    })
    contracts.value = res.data || []
    total.value = res.total || 0
    page.value = res.page || 1
  } catch (e: any) {
    showError({ message: e?.message || '加载合同列表失败' })
  } finally {
    loading.value = false
    ui.hideLoading()
  }
}

function changePage(p: number) {
  page.value = p
  fetchContracts()
}

function goDetail(id: string) {
  router.push(`/contracts/${id}`)
}

function goAssign(id: string) {
  router.push(`/assign?contractId=${id}`)
}

function showAssignButton(c: any) {
  return ['NEW', 'LAWYER_COMPLETED', 'RECTIFYING'].includes(c.status)
}

onMounted(() => {
  ui.setPageTitle('合同管理')
  ui.setActiveNav('contracts')
  fetchContracts()
})
</script>

<style scoped>
.filter-bar > div label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  font-size: 13px;
  color: var(--gray-600);
}

.pagination .btn {
  min-width: 36px;
  justify-content: center;
}
</style>
