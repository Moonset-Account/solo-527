<template>
  <div>
    <div class="stats-grid mb-4">
      <div class="stat-card">
        <div class="stat-label">合规缺口总数</div>
        <div class="stat-value text-primary">{{ stats.total || 0 }}</div>
        <div class="stat-change" :class="stats.open > 0 ? 'down' : 'up'">
          <span v-if="stats.open > 0" style="color:var(--danger)">{{ stats.open }} 项待处理</span>
          <span v-else style="color:var(--success)">全部已处理</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">严重/高危</div>
        <div class="stat-value text-danger">{{ (stats.critical || 0) + (stats.high || 0) }}</div>
        <div class="stat-change down">
          <span style="color:var(--danger)">严重 {{ stats.critical }} · 高 {{ stats.high }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">处理中</div>
        <div class="stat-value text-warning">{{ stats.inProgress || 0 }}</div>
        <div class="stat-change">
          <span style="color:var(--warning)">中低风险 {{ (stats.medium || 0) + (stats.low || 0) }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">已解决</div>
        <div class="stat-value text-success">{{ stats.resolved || 0 }}</div>
        <div class="stat-change up">
          解决率 {{ stats.total ? Math.round((stats.resolved || 0) / stats.total * 100) : 0 }}%
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header">
        <div class="card-title">缺口看板</div>
        <div class="flex items-center gap-3">
          <select v-model="filters.status" class="form-select" style="width:140px" @change="fetchGaps">
            <option value="ALL">全部状态</option>
            <option value="OPEN">待处理</option>
            <option value="IN_PROGRESS">处理中</option>
            <option value="RESOLVED">已解决</option>
            <option value="CLOSED">已关闭</option>
          </select>
          <select v-model="filters.severity" class="form-select" style="width:140px" @change="fetchGaps">
            <option value="ALL">全部严重程度</option>
            <option value="CRITICAL">严重</option>
            <option value="HIGH">高</option>
            <option value="MEDIUM">中</option>
            <option value="LOW">低</option>
          </select>
          <select v-model="filters.category" class="form-select" style="width:160px" @change="fetchGaps">
            <option value="ALL">全部类型</option>
            <option value="LAW_REVIEW">法律意见</option>
            <option value="FINAL_REVIEW">复核意见</option>
            <option value="RECTIFICATION">整改问题</option>
          </select>
          <input v-model="filters.keyword" class="form-input" style="width:200px" placeholder="搜索标题/描述" @keyup.enter="fetchGaps" />
        </div>
      </div>

      <div class="card-body">
        <div v-if="gaps.length === 0" class="empty-state py-12">
          <div style="font-size:48px;margin-bottom:16px">✅</div>
          <div>暂无合规缺口数据</div>
        </div>

        <div v-else class="kanban-grid">
          <div
            v-for="g in gaps"
            :key="g.id"
            class="gap-card"
            :class="getSeverityBorder(g.severity)"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="badge" :class="getGapSeverityClass(g.severity)">
                  {{ getGapSeverityLabel(g.severity) }}
                </span>
                <span class="badge" :class="getGapStatusClass(g.status)">
                  {{ getGapStatusLabel(g.status) }}
                </span>
                <span class="badge badge-info">{{ g.category }}</span>
              </div>
              <button class="btn btn-secondary btn-sm" @click="openResolve(g)">处理</button>
            </div>

            <h3 class="font-semibold mb-2 text-lg">{{ g.title }}</h3>
            <p class="text-sm text-gray-600 mb-3 line-clamp-3" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;line-height:1.6">
              {{ g.description }}
            </p>

            <div v-if="g.clauseRef || g.regulation" class="text-xs text-gray-500 mb-3 space-y-1">
              <div v-if="g.clauseRef">📌 条款: {{ g.clauseRef }}</div>
              <div v-if="g.regulation">📜 法规: {{ g.regulation }}</div>
            </div>

            <div class="border-t pt-3">
              <div class="flex items-center justify-between text-xs text-gray-500 mb-2">
                <div class="flex items-center gap-2">
                  <span class="mini-avatar" style="background:var(--primary)">{{ g.reporter?.name?.charAt(0) }}</span>
                  <span>{{ g.reporter?.name }}</span>
                  <span>·</span>
                  <span>{{ formatDate(g.createdAt, false) }}</span>
                </div>
                <NuxtLink :to="`/contracts/${g.contractId}`" class="text-primary">
                  {{ g.contract?.contractNo }}
                </NuxtLink>
              </div>
              <div v-if="g.resolution" class="text-sm p-2 rounded success-box" style="background:#dcfce7">
                <div class="text-xs text-success font-semibold mb-1">✓ 解决方案</div>
                <div class="line-clamp-2" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:#166534">
                  {{ g.resolution }}
                </div>
              </div>
              <div v-if="g.resolver" class="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <span>处理人:</span>
                <span class="mini-avatar" style="background:var(--success);color:white">{{ g.resolver?.name?.charAt(0) }}</span>
                <span class="font-semibold text-success">{{ g.resolver?.name }}</span>
                <span v-if="g.resolvedAt">· {{ formatDate(g.resolvedAt, false) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="card-header" style="border-top:1px solid var(--gray-200);border-bottom:none">
        <div class="text-sm text-gray-500">第 {{ page }} / {{ totalPages }} 页，共 {{ total }} 条</div>
        <div class="flex items-center gap-2">
          <button class="btn btn-secondary btn-sm" :disabled="page <= 1" @click="changePage(page - 1)">上一页</button>
          <button class="btn btn-secondary btn-sm" :disabled="page >= totalPages" @click="changePage(page + 1)">下一页</button>
        </div>
      </div>
    </div>

    <!-- 处理弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showResolveModal" class="modal-mask" @click.self="showResolveModal = false">
          <div class="modal">
            <div class="modal-header">
              <div class="modal-title">处理合规缺口</div>
              <button class="modal-close" @click="showResolveModal = false">×</button>
            </div>
            <div class="modal-body">
              <div class="mb-4 p-3 rounded-lg" style="background:var(--gray-50)">
                <div class="flex items-center gap-2 mb-2">
                  <span class="badge" :class="getGapSeverityClass(currentGap?.severity)">
                    {{ getGapSeverityLabel(currentGap?.severity) }}
                  </span>
                  <span class="badge" :class="getGapStatusClass(currentGap?.status)">
                    {{ getGapStatusLabel(currentGap?.status) }}
                  </span>
                </div>
                <div class="font-semibold mb-1">{{ currentGap?.title }}</div>
                <div class="text-sm text-gray-600">{{ currentGap?.description }}</div>
              </div>

              <div class="form-group">
                <label class="form-label">变更状态</label>
                <select v-model="resolveForm.status" class="form-select">
                  <option value="OPEN">待处理</option>
                  <option value="IN_PROGRESS">处理中</option>
                  <option value="RESOLVED">已解决</option>
                  <option value="CLOSED">已关闭</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">解决方案说明</label>
                <textarea v-model="resolveForm.resolution" class="form-textarea" rows="4" placeholder="请详细描述处理方案、修改条款内容等..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="showResolveModal = false">取消</button>
              <button class="btn btn-primary" @click="doResolve">保存处理结果</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

const ui = useUiStore()
const auth = useAuthStore()

const gaps = ref<any[]>([])
const stats = reactive<any>({})
const total = ref(0)
const page = ref(1)
const pageSize = ref(12)
const loading = ref(false)

const filters = reactive({
  status: 'ALL',
  severity: 'ALL',
  category: 'ALL',
  keyword: ''
})

const showResolveModal = ref(false)
const currentGap = ref<any>(null)
const resolveForm = reactive({ status: 'IN_PROGRESS', resolution: '' })

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

function getSeverityBorder(severity: string) {
  const map: Record<string, string> = {
    CRITICAL: 'border-critical',
    HIGH: 'border-high',
    MEDIUM: 'border-medium',
    LOW: 'border-low'
  }
  return map[severity] || 'border-low'
}

function openResolve(g: any) {
  currentGap.value = g
  resolveForm.status = g.status === 'OPEN' ? 'IN_PROGRESS' : g.status
  resolveForm.resolution = g.resolution || ''
  showResolveModal.value = true
}

async function doResolve() {
  if (!currentGap.value) return
  ui.showLoading('保存中...')
  try {
    await $fetch(`/api/compliance-gaps/${currentGap.value.id}`, {
      method: 'PATCH',
      body: {
        status: resolveForm.status,
        resolution: resolveForm.resolution,
        resolverId: auth.user?.id
      }
    })
    showResolveModal.value = false
    alert('处理完成！')
    fetchGaps()
  } catch (e: any) {
    alert(e?.data?.message || e?.message || '操作失败')
  } finally {
    ui.hideLoading()
  }
}

async function fetchGaps() {
  loading.value = true
  ui.showLoading()
  try {
    const res: any = await $fetch('/api/compliance-gaps', {
      params: {
        status: filters.status,
        severity: filters.severity,
        category: filters.category,
        page: page.value,
        pageSize: pageSize.value
      }
    })
    gaps.value = res.data || []
    total.value = res.total || 0
    Object.assign(stats, res.stats || {})
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
    ui.hideLoading()
  }
}

function changePage(p: number) {
  page.value = p
  fetchGaps()
}

onMounted(() => {
  ui.setPageTitle('合规缺口看板')
  ui.setActiveNav('compliance')
  fetchGaps()
})
</script>

<style scoped>
.kanban-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.gap-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  border: 2px solid var(--gray-200);
  border-left-width: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: all 0.2s;
}

.gap-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.border-critical { border-left-color: #dc2626; }
.border-high { border-left-color: #f59e0b; }
.border-medium { border-left-color: #3b82f6; }
.border-low { border-left-color: #10b981; }

.mini-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
}
</style>
