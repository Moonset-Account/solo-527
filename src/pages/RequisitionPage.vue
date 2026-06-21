<script setup lang="ts">
import { computed } from 'vue'
import { Search, FileText, ClipboardList, Check, X, Download } from 'lucide-vue-next'
import { useRequisitionStore } from '@/stores/requisition'
import DataTable from '@/components/DataTable.vue'

const store = useRequisitionStore()

const statusMap: Record<string, { label: string; cls: string }> = {
  approved: { label: '已通过', cls: 'tag-success' },
  rejected: { label: '已驳回', cls: 'tag-danger' },
  pending: { label: '待审批', cls: 'tag-warn' },
}

const formColumns = [
  { key: 'applicant', label: '申请人', sortable: true },
  { key: 'reagent', label: '试剂', sortable: true },
  { key: 'quantity', label: '数量', width: '80px' },
  { key: 'project', label: '课题' },
  { key: 'date', label: '日期', width: '120px' },
  { key: 'status', label: '状态', width: '100px' },
]

const recordColumns = formColumns

function getStatusInfo(status: string) {
  return statusMap[status] || { label: status, cls: 'tag-info' }
}
</script>

<template>
  <div class="page-container">
    <h2 class="page-title">领用申请</h2>

    <div class="tab-bar">
      <button class="tab-btn" :class="{ active: store.activeTab === 'form' }" @click="store.activeTab = 'form'">
        <FileText :size="16" /> 申请表单
      </button>
      <button class="tab-btn" :class="{ active: store.activeTab === 'records' }" @click="store.activeTab = 'records'">
        <ClipboardList :size="16" /> 领用记录
      </button>
    </div>

    <div v-if="store.activeTab === 'form'" class="form-section">
      <div class="form-grid">
        <div class="card">
          <h3 class="card-title">领用申请</h3>
          <div class="form-group">
            <label class="form-label">搜索试剂</label>
            <div class="search-wrap">
              <Search :size="16" class="search-icon" />
              <input class="input search-input" v-model="store.reagentSearch" placeholder="输入试剂名称搜索..." />
            </div>
            <div v-if="store.reagentSearch" class="search-results">
              <div v-for="r in store.searchResults" :key="r.id" class="search-item" @click="store.formData.reagentId = r.id; store.formData.reagentName = r.name">
                <span>{{ r.name }}</span>
                <span class="text-xs text-primary-400">{{ r.spec }} | 库存: {{ r.stock }}</span>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">领用数量</label>
            <input type="number" class="input" v-model.number="store.formData.quantity" min="1" />
          </div>
          <div class="form-group">
            <label class="form-label">所属课题</label>
            <select class="input" v-model="store.formData.projectId">
              <option :value="null" disabled>请选择课题</option>
              <option v-for="p in store.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">用途说明</label>
            <textarea class="input" v-model="store.formData.purpose" placeholder="请说明领用用途..."></textarea>
          </div>
          <button class="btn btn-primary">提交申请</button>
        </div>

        <div class="card">
          <h3 class="card-title">审批流程</h3>
          <div class="steps">
            <div v-for="(step, i) in store.approvalSteps" :key="step.step" class="step" :class="step.status">
              <div class="step-dot">{{ i + 1 }}</div>
              <span class="step-label">{{ step.label }}</span>
            </div>
          </div>

          <h3 class="card-title" style="margin-top: 24px">待审批项</h3>
          <div v-for="item in store.pendingItems" :key="item.id" class="pending-item">
            <div class="pending-info">
              <span class="pending-name">{{ item.applicant }}</span>
              <span class="pending-detail">申请领用 {{ item.reagent }} × {{ item.quantity }}</span>
              <span class="pending-project">{{ item.project }}</span>
            </div>
            <div class="pending-actions">
              <button class="btn-icon approve" @click="store.approveItem(item.id)">
                <Check :size="16" />
              </button>
              <button class="btn-icon reject" @click="store.rejectItem(item.id)">
                <X :size="16" />
              </button>
            </div>
          </div>
          <div v-if="!store.pendingItems.length" class="empty-text">暂无待审批项</div>
        </div>
      </div>
    </div>

    <div v-else class="card">
      <div class="table-header">
        <h3 class="card-title">领用记录</h3>
        <button class="btn btn-secondary"><Download :size="14" /> 导出</button>
      </div>
      <DataTable :columns="recordColumns" :data="store.records">
        <template #status="{ row }">
          <span class="tag" :class="getStatusInfo(row.status).cls">{{ getStatusInfo(row.status).label }}</span>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.page-container { padding: 24px; }
.page-title { font-size: 22px; font-weight: 600; margin-bottom: 20px; color: var(--color-text-primary); }
.tab-bar { display: flex; gap: 4px; margin-bottom: 20px; background: var(--color-bg-secondary); border-radius: 8px; padding: 4px; width: fit-content; }
.tab-btn { display: flex; align-items: center; gap: 6px; padding: 8px 20px; border-radius: 6px; font-size: 14px; cursor: pointer; background: none; border: none; color: var(--color-text-muted); transition: all 0.2s; }
.tab-btn.active { background: var(--color-accent); color: white; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.card-title { font-size: 15px; font-weight: 500; color: var(--color-text-secondary); margin-bottom: 16px; }
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 13px; color: var(--color-text-muted); margin-bottom: 6px; }
.search-wrap { position: relative; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--color-text-muted); }
.search-input { padding-left: 32px; width: 100%; }
.search-results { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 6px; margin-top: 4px; max-height: 160px; overflow-y: auto; }
.search-item { padding: 8px 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
.search-item:hover { background: var(--color-bg-hover); }
.steps { display: flex; gap: 0; align-items: center; }
.step { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; }
.step::after { content: ''; position: absolute; top: 14px; left: 50%; width: 100%; height: 2px; background: var(--color-border); }
.step:last-child::after { display: none; }
.step.done .step-dot { background: var(--color-accent); color: white; }
.step.done::after { background: var(--color-accent); }
.step.active .step-dot { background: var(--color-accent); color: white; box-shadow: 0 0 0 4px rgba(13,148,136,0.2); }
.step.waiting .step-dot { background: var(--color-bg-hover); color: var(--color-text-muted); }
.step-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; z-index: 1; }
.step-label { font-size: 12px; color: var(--color-text-muted); margin-top: 8px; text-align: center; }
.pending-item { display: flex; align-items: center; justify-content: space-between; padding: 12px; border: 1px solid var(--color-border); border-radius: 6px; margin-bottom: 8px; }
.pending-info { display: flex; flex-direction: column; gap: 2px; }
.pending-name { font-weight: 500; color: var(--color-text-primary); }
.pending-detail { font-size: 13px; color: var(--color-text-secondary); }
.pending-project { font-size: 12px; color: var(--color-text-muted); }
.pending-actions { display: flex; gap: 6px; }
.btn-icon { width: 32px; height: 32px; border-radius: 6px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.btn-icon.approve { background: rgba(16,185,129,0.15); color: #34D399; }
.btn-icon.approve:hover { background: rgba(16,185,129,0.25); }
.btn-icon.reject { background: rgba(220,38,38,0.15); color: #F87171; }
.btn-icon.reject:hover { background: rgba(220,38,38,0.25); }
.empty-text { color: var(--color-text-muted); font-size: 14px; text-align: center; padding: 20px; }
.table-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
@media (max-width: 1024px) { .form-grid { grid-template-columns: 1fr; } }
</style>
