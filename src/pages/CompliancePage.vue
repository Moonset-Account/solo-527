<script setup lang="ts">
import { computed } from 'vue'
import { X, ChevronRight, Info, AlertTriangle, AlertOctagon, CheckCircle } from 'lucide-vue-next'
import { useComplianceStore } from '@/stores/compliance'
import DataTable from '@/components/DataTable.vue'

const store = useComplianceStore()

const columns = [
  { key: 'name', label: '试剂名称', sortable: true },
  { key: 'cas', label: 'CAS号', width: '120px' },
  { key: 'dangerLevel', label: '危险等级', width: '100px' },
  { key: 'controlled', label: '管制类别', width: '100px' },
  { key: 'status', label: '合规状态', width: '100px' },
  { key: 'location', label: '位置', width: '80px' },
]

const statusCls: Record<string, string> = {
  '合规': 'tag-success',
  '待审查': 'tag-warn',
  '不合规': 'tag-danger',
}

const levelCls: Record<string, string> = {
  '剧毒': 'tag-danger',
  '高毒': 'tag-warn',
  '中等毒': 'tag-warn',
  '低毒': 'tag-info',
  '无毒': 'tag-success',
}

const typeIcon: Record<string, any> = {
  info: Info,
  warn: AlertTriangle,
  danger: AlertOctagon,
  success: CheckCircle,
}

const typeCls: Record<string, string> = {
  info: 'text-accent-400',
  warn: 'text-warn-400',
  danger: 'text-danger-400',
  success: 'text-green-400',
}

const expandedRows = ref<Set<number>>(new Set())

function toggleExpand(id: number) {
  if (expandedRows.value.has(id)) expandedRows.value.delete(id)
  else expandedRows.value.add(id)
}

import { ref } from 'vue'
</script>

<template>
  <div class="page-container">
    <h2 class="page-title">安全合规</h2>

    <div class="card filter-panel">
      <div class="filter-section">
        <label class="filter-label">危险等级</label>
        <div class="checkbox-group">
          <label v-for="opt in store.dangerLevelOptions" :key="opt" class="checkbox-item">
            <input type="checkbox" :value="opt" v-model="store.filters.dangerLevels" />
            <span>{{ opt }}</span>
          </label>
        </div>
      </div>
      <div class="filter-row">
        <div class="filter-section">
          <label class="filter-label">管制类别</label>
          <select class="input" v-model="store.filters.controlledCategory">
            <option value="">全部</option>
            <option v-for="opt in store.controlledCategoryOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>
        <div class="filter-section">
          <label class="filter-label">合规状态</label>
          <select class="input" v-model="store.filters.complianceStatus">
            <option value="">全部</option>
            <option v-for="opt in store.complianceStatusOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="store.selectedFilters.length" class="selected-filters">
      <span
        v-for="f in store.selectedFilters"
        :key="f.key + f.value"
        class="filter-tag"
      >
        {{ f.label }}: {{ f.value }}
        <button class="tag-remove" @click="store.removeFilter(f.key, f.value)"><X :size="12" /></button>
      </span>
    </div>

    <div class="drilldown-breadcrumb">
      <span v-for="(crumb, i) in store.drilldownPath" :key="crumb.id" class="breadcrumb-item">
        <span v-if="i > 0" class="breadcrumb-sep"><ChevronRight :size="14" /></span>
        {{ crumb.label }}
      </span>
    </div>

    <div class="card" style="margin-top: 12px">
      <DataTable :columns="columns" :data="store.filteredReagents" @row-click="(row: any) => toggleExpand(row.id)">
        <template #dangerLevel="{ row }">
          <span class="tag" :class="levelCls[row.dangerLevel] || 'tag-info'">{{ row.dangerLevel }}</span>
        </template>
        <template #controlled="{ row }">
          <span class="tag tag-info">{{ row.controlled }}</span>
        </template>
        <template #status="{ row }">
          <span class="tag" :class="statusCls[row.status] || 'tag-info'">{{ row.status }}</span>
        </template>
      </DataTable>
      <div v-for="row in store.filteredReagents" :key="'detail-' + row.id">
        <div v-if="expandedRows.has(row.id)" class="expand-row">
          <div class="expand-grid">
            <div class="expand-item"><span class="expand-label">有效期至</span><span>{{ row.expiry }}</span></div>
            <div class="expand-item"><span class="expand-label">许可证号</span><span class="font-data">{{ row.certNo }}</span></div>
            <div class="expand-item"><span class="expand-label">上次审查</span><span>{{ row.lastAudit }}</span></div>
            <div class="expand-item"><span class="expand-label">存放位置</span><span>{{ row.location }}</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: 16px">
      <h3 class="card-title">审计日志</h3>
      <div class="audit-timeline">
        <div v-for="log in store.auditLog" :key="log.id" class="audit-item">
          <div class="audit-icon" :class="typeCls[log.type]">
            <component :is="typeIcon[log.type]" :size="16" />
          </div>
          <div class="audit-content">
            <div class="audit-action">{{ log.action }} - {{ log.target }}</div>
            <div class="audit-meta">{{ log.operator }} · {{ log.time }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container { padding: 24px; }
.page-title { font-size: 22px; font-weight: 600; margin-bottom: 20px; color: var(--color-text-primary); }
.filter-panel { margin-bottom: 12px; }
.filter-section { margin-bottom: 12px; }
.filter-label { display: block; font-size: 13px; color: var(--color-text-muted); margin-bottom: 6px; }
.filter-row { display: flex; gap: 16px; }
.checkbox-group { display: flex; flex-wrap: wrap; gap: 12px; }
.checkbox-item { display: flex; align-items: center; gap: 6px; font-size: 14px; color: var(--color-text-secondary); cursor: pointer; }
.checkbox-item input { accent-color: var(--color-accent); }
.selected-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.filter-tag { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: rgba(13,148,136,0.15); color: #2DD4BF; border-radius: 14px; font-size: 12px; }
.tag-remove { background: none; border: none; color: #2DD4BF; cursor: pointer; padding: 0; display: flex; }
.drilldown-breadcrumb { display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--color-text-muted); }
.breadcrumb-sep { color: var(--color-text-muted); }
.card-title { font-size: 15px; font-weight: 500; color: var(--color-text-secondary); margin-bottom: 16px; }
.expand-row { padding: 12px 16px; background: rgba(15,23,42,0.5); border-bottom: 1px solid var(--color-border); }
.expand-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.expand-label { font-size: 12px; color: var(--color-text-muted); display: block; margin-bottom: 2px; }
.audit-timeline { display: flex; flex-direction: column; gap: 12px; }
.audit-item { display: flex; gap: 12px; align-items: flex-start; }
.audit-icon { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(51,78,104,0.3); flex-shrink: 0; }
.audit-content { flex: 1; }
.audit-action { font-size: 14px; color: var(--color-text-primary); }
.audit-meta { font-size: 12px; color: var(--color-text-muted); margin-top: 2px; }
</style>
