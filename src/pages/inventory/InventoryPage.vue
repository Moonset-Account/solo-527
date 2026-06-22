<template>
  <div class="space-y-4">
    <h2 class="text-lg font-bold text-bark">库存管理</h2>

    <div class="flex gap-2">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="[
          'rounded-btn px-4 py-2 text-sm font-medium transition-colors',
          activeTab === tab.key ? 'bg-brand text-white' : 'bg-cream text-bark/60 hover:bg-brand/10',
        ]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
      <div class="flex-1" />
      <button v-if="activeTab === 'logs'" class="btn-primary" @click="showInbound = true">入库</button>
      <button v-if="activeTab === 'logs'" class="btn-secondary" @click="showOutbound = true">出库</button>
    </div>

    <div v-if="activeTab === 'overview'">
      <DataTable :columns="overviewColumns" :data="inventoryStore.items" :clickable="false">
        <template #currentStock="{ row }">
          <span :class="{ 'font-bold text-red-600': row.currentStock <= row.minStock }">
            {{ row.currentStock }}
          </span>
        </template>
        <template #currentCost="{ row }">
          {{ formatCurrency(row.currentCost) }}
        </template>
        <template #status="{ row }">
          <span
            v-if="row.currentStock <= row.minStock"
            class="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600"
          >
            低库存
          </span>
          <span v-else class="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600">正常</span>
        </template>
      </DataTable>
    </div>

    <div v-if="activeTab === 'logs'">
      <DataTable :columns="logColumns" :data="inventoryStore.logs" :clickable="false">
        <template #type="{ row }">
          <StatusBadge :status="row.type" />
        </template>
        <template #totalCost="{ row }">
          {{ formatCurrency(row.totalCost) }}
        </template>
        <template #createdAt="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </DataTable>
    </div>

    <div v-if="activeTab === 'scraps'">
      <DataTable :columns="scrapColumns" :data="inventoryStore.scraps" :clickable="false">
        <template #createdAt="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </DataTable>
    </div>

    <Modal :visible="showInbound" title="入库" @close="showInbound = false">
      <form class="space-y-4" @submit.prevent="handleInbound">
        <div>
          <label class="mb-1 block text-sm text-bark/70">原料</label>
          <select v-model="logForm.ingredientId" class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm">
            <option value="">请选择</option>
            <option v-for="item in inventoryStore.items" :key="item.ingredientId" :value="item.ingredientId">
              {{ item.ingredientName }}
            </option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-sm text-bark/70">数量</label>
          <input v-model.number="logForm.quantity" type="number" min="0" step="0.01" class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="mb-1 block text-sm text-bark/70">备注</label>
          <input v-model="logForm.note" type="text" class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm" />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="btn-secondary" @click="showInbound = false">取消</button>
          <button type="submit" class="btn-primary">确认入库</button>
        </div>
      </form>
    </Modal>

    <Modal :visible="showOutbound" title="出库" @close="showOutbound = false">
      <form class="space-y-4" @submit.prevent="handleOutbound">
        <div>
          <label class="mb-1 block text-sm text-bark/70">原料</label>
          <select v-model="logForm.ingredientId" class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm">
            <option value="">请选择</option>
            <option v-for="item in inventoryStore.items" :key="item.ingredientId" :value="item.ingredientId">
              {{ item.ingredientName }}
            </option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-sm text-bark/70">数量</label>
          <input v-model.number="logForm.quantity" type="number" min="0" step="0.01" class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="mb-1 block text-sm text-bark/70">备注</label>
          <input v-model="logForm.note" type="text" class="w-full rounded-btn border border-brand/20 px-3 py-2 text-sm" />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="btn-secondary" @click="showOutbound = false">取消</button>
          <button type="submit" class="btn-accent">确认出库</button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import Modal from '@/components/common/Modal.vue'
import { useInventoryStore } from '@/stores/inventory'
import { formatCurrency, formatDateTime } from '@/lib/utils'

const inventoryStore = useInventoryStore()

const activeTab = ref('overview')
const showInbound = ref(false)
const showOutbound = ref(false)

const logForm = ref({
  ingredientId: '',
  quantity: 0,
  note: '',
})

const tabs = [
  { key: 'overview', label: '库存总览' },
  { key: 'logs', label: '出入库流水' },
  { key: 'scraps', label: '报损记录' },
]

const overviewColumns = [
  { key: 'ingredientName', label: '原料', sortable: true },
  { key: 'category', label: '分类' },
  { key: 'unit', label: '单位' },
  { key: 'currentStock', label: '当前库存', sortable: true },
  { key: 'minStock', label: '最低库存' },
  { key: 'currentCost', label: '当前成本', sortable: true },
  { key: 'status', label: '状态' },
]

const logColumns = [
  { key: 'ingredientName', label: '原料' },
  { key: 'type', label: '类型' },
  { key: 'quantity', label: '数量' },
  { key: 'unit', label: '单位' },
  { key: 'totalCost', label: '金额' },
  { key: 'operator', label: '操作人' },
  { key: 'note', label: '备注' },
  { key: 'createdAt', label: '时间', sortable: true },
]

const scrapColumns = [
  { key: 'batchNo', label: '批次号' },
  { key: 'ingredientName', label: '原料' },
  { key: 'quantity', label: '数量' },
  { key: 'reason', label: '原因' },
  { key: 'operator', label: '操作人' },
  { key: 'createdAt', label: '时间', sortable: true },
]

const handleInbound = async () => {
  const item = inventoryStore.items.find(i => i.ingredientId === logForm.value.ingredientId)
  await inventoryStore.inbound({
    ingredientId: logForm.value.ingredientId,
    ingredientName: item?.ingredientName || '',
    quantity: logForm.value.quantity,
    unit: item?.unit || '',
    costPerUnit: item?.currentCost || 0,
    totalCost: (item?.currentCost || 0) * logForm.value.quantity,
    operator: 'system',
    note: logForm.value.note,
  } as any)
  showInbound.value = false
  logForm.value = { ingredientId: '', quantity: 0, note: '' }
}

const handleOutbound = async () => {
  const item = inventoryStore.items.find(i => i.ingredientId === logForm.value.ingredientId)
  await inventoryStore.outbound({
    ingredientId: logForm.value.ingredientId,
    ingredientName: item?.ingredientName || '',
    quantity: logForm.value.quantity,
    unit: item?.unit || '',
    costPerUnit: item?.currentCost || 0,
    totalCost: (item?.currentCost || 0) * logForm.value.quantity,
    operator: 'system',
    note: logForm.value.note,
  } as any)
  showOutbound.value = false
  logForm.value = { ingredientId: '', quantity: 0, note: '' }
}

onMounted(() => {
  inventoryStore.loadItems()
  inventoryStore.loadLogs()
  inventoryStore.loadScraps()
})
</script>
