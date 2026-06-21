<script setup lang="ts">
import { computed } from 'vue'
import { Eye, Download, X } from 'lucide-vue-next'
import { useBatchStore } from '@/stores/batch'
import DataTable from '@/components/DataTable.vue'

const store = useBatchStore()

const columns = [
  { key: 'id', label: '批次号', sortable: true, width: '140px' },
  { key: 'reagentName', label: '试剂名称', sortable: true },
  { key: 'spec', label: '规格', width: '120px' },
  { key: 'supplier', label: '供应商', width: '100px' },
  { key: 'remaining', label: '剩余数量', sortable: true, width: '100px' },
  { key: 'expiryDate', label: '有效期至', sortable: true, width: '120px' },
  { key: 'status', label: '状态', width: '80px' },
]

const statusCls: Record<string, string> = {
  '正常': 'tag-success',
  '低库存': 'tag-warn',
  '临期': 'tag-danger',
}

const detail = computed(() => {
  if (!store.detailBatchId) return null
  return store.batches.find(b => b.id === store.detailBatchId) || null
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">试剂批次</h2>
      <div v-if="store.selectedBatchIds.length" class="batch-toolbar">
        <button class="btn btn-secondary"><Eye :size="14" /> 批量查看 ({{ store.selectedBatchIds.length }})</button>
        <button class="btn btn-secondary"><Download :size="14" /> 导出选中</button>
      </div>
    </div>

    <div class="card filter-panel">
      <div class="filter-row">
        <div class="filter-item">
          <label class="filter-label">试剂名称</label>
          <input class="input" v-model="store.filters.reagentName" placeholder="搜索试剂..." />
        </div>
        <div class="filter-item">
          <label class="filter-label">有效期起</label>
          <input type="date" class="input" v-model="store.filters.expiryDateStart" />
        </div>
        <div class="filter-item">
          <label class="filter-label">有效期止</label>
          <input type="date" class="input" v-model="store.filters.expiryDateEnd" />
        </div>
        <div class="filter-item">
          <label class="filter-label">供应商</label>
          <input class="input" v-model="store.filters.supplier" placeholder="供应商..." />
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: 16px">
      <DataTable
        :columns="columns"
        :data="store.batches"
        row-key="id"
        :selectable="true"
        :selected-keys="store.selectedBatchIds"
        @update:selected-keys="(keys: (string|number)[]) => store.selectedBatchIds = keys as string[]"
        @row-click="(row: any) => store.openDetail(row.id)"
      >
        <template #id="{ row }">
          <span class="font-data text-xs">{{ row.id }}</span>
        </template>
        <template #status="{ row }">
          <span class="tag" :class="statusCls[row.status] || 'tag-info'">{{ row.status }}</span>
        </template>
        <template #remaining="{ row }">
          <span class="font-data" :class="row.remaining <= 5 ? 'text-danger-400' : ''">{{ row.remaining }}</span>
        </template>
      </DataTable>
    </div>

    <Teleport to="body">
      <div v-if="store.showDetailPanel" class="slide-overlay" @click.self="store.closeDetail">
        <div class="slide-panel">
          <div class="slide-header">
            <h3 class="slide-title">批次详情</h3>
            <button class="slide-close" @click="store.closeDetail"><X :size="18" /></button>
          </div>
          <div v-if="detail" class="slide-body">
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">批次号</span><span class="font-data">{{ detail.id }}</span></div>
              <div class="detail-item"><span class="detail-label">试剂名称</span><span>{{ detail.reagentName }}</span></div>
              <div class="detail-item"><span class="detail-label">规格</span><span>{{ detail.spec }}</span></div>
              <div class="detail-item"><span class="detail-label">供应商</span><span>{{ detail.supplier }}</span></div>
              <div class="detail-item"><span class="detail-label">入库数量</span><span class="font-data">{{ detail.quantity }}</span></div>
              <div class="detail-item"><span class="detail-label">剩余数量</span><span class="font-data">{{ detail.remaining }}</span></div>
              <div class="detail-item"><span class="detail-label">入库日期</span><span>{{ detail.entryDate }}</span></div>
              <div class="detail-item"><span class="detail-label">有效期至</span><span>{{ detail.expiryDate }}</span></div>
              <div class="detail-item"><span class="detail-label">存放位置</span><span>{{ detail.location }}</span></div>
              <div class="detail-item"><span class="detail-label">状态</span><span class="tag" :class="statusCls[detail.status]">{{ detail.status }}</span></div>
            </div>
            <div class="detail-section">
              <h4 class="detail-section-title">关联记录</h4>
              <div class="linked-records">
                <div class="linked-item">
                  <span class="linked-type">入库</span>
                  <span>2026-06-15 入库 {{ detail.quantity }} 瓶</span>
                </div>
                <div class="linked-item">
                  <span class="linked-type">出库</span>
                  <span>2026-06-18 领用 3 瓶 - 课题A</span>
                </div>
                <div class="linked-item">
                  <span class="linked-type">出库</span>
                  <span>2026-06-20 领用 2 瓶 - 课题B</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.page-container { padding: 24px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.page-title { font-size: 22px; font-weight: 600; color: var(--color-text-primary); }
.batch-toolbar { display: flex; gap: 10px; }
.filter-panel { margin-bottom: 0; }
.filter-row { display: flex; gap: 12px; flex-wrap: wrap; }
.filter-item { flex: 1; min-width: 160px; }
.filter-label { display: block; font-size: 13px; color: var(--color-text-muted); margin-bottom: 6px; }
.slide-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50; display: flex; justify-content: flex-end; }
.slide-panel { width: 420px; max-width: 90vw; background: var(--color-bg-card); border-left: 1px solid var(--color-border); height: 100vh; overflow-y: auto; }
.slide-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--color-border); }
.slide-title { font-size: 16px; font-weight: 600; color: var(--color-text-primary); }
.slide-close { background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px; }
.slide-close:hover { color: var(--color-text-primary); }
.slide-body { padding: 20px; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
.detail-label { display: block; font-size: 12px; color: var(--color-text-muted); margin-bottom: 4px; }
.detail-section { border-top: 1px solid var(--color-border); padding-top: 16px; }
.detail-section-title { font-size: 14px; font-weight: 500; color: var(--color-text-secondary); margin-bottom: 12px; }
.linked-records { display: flex; flex-direction: column; gap: 8px; }
.linked-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--color-text-secondary); }
.linked-type { padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 500; background: rgba(13,148,136,0.15); color: #2DD4BF; }
</style>
