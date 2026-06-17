<template>
  <div class="batches-page">
    <n-space vertical :size="20" style="width: 100%">
      <n-card :bordered="false" size="small">
        <n-space :size="16">
          <n-input v-model:value="keyword" placeholder="搜索批次号/地块/品种" clearable style="width: 240px" />
          <n-select v-model:value="statusFilter" :options="statusOptions" placeholder="状态筛选" clearable style="width: 160px" />
          <n-select v-model:value="plotFilter" :options="plotOptions" placeholder="地块筛选" clearable style="width: 160px" />
          <n-select v-model:value="varietyFilter" :options="varietyOptions" placeholder="品种筛选" clearable style="width: 160px" />
          <n-button type="primary" @click="loadBatches">查询</n-button>
          <n-button @click="showCreateModal = true">新增批次</n-button>
        </n-space>
      </n-card>

      <n-grid :cols="4" :x-gap="16" :y-gap="16">
        <n-grid-item>
          <n-card hoverable>
            <n-statistic label="生长中批次" :value="stats.growing || 0" value-style="color: #18a058" />
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card hoverable>
            <n-statistic label="待采收批次" :value="stats.harvesting || 0" value-style="color: #f0a020" />
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card hoverable>
            <n-statistic label="已采收批次" :value="stats.harvested || 0" value-style="color: #18a058" />
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card hoverable>
            <n-statistic label="预计总产量(kg)" :value="stats.total_predicted || 0" :precision="0" value-style="color: #2080f0" />
          </n-card>
        </n-grid-item>
      </n-grid>

      <n-card :bordered="false" size="small">
        <n-data-table
          :columns="columns"
          :data="batches"
          :bordered="false"
          :pagination="{ pageSize: 10 }"
          size="small"
        />
      </n-card>
    </n-space>

    <n-modal v-model:show="showCreateModal" preset="card" :title="editingBatch ? '编辑批次' : '新增批次'" style="width: 640px">
      <n-form :model="formData" label-placement="left" label-width="110px">
        <n-form-item label="批次编号">
          <n-input v-model:value="formData.batch_no" placeholder="请输入批次编号" />
        </n-form-item>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="地块">
              <n-select v-model:value="formData.plot_id" :options="plotOptions" placeholder="请选择地块" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="品种">
              <n-select v-model:value="formData.variety_id" :options="varietyOptions" placeholder="请选择品种" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="定植日期">
              <n-date-picker v-model:value="formData.plant_date" type="date" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="预计采收">
              <n-date-picker v-model:value="formData.expected_harvest_date" type="date" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="状态">
              <n-select v-model:value="formData.status" :options="statusOptions" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="种植数量">
              <n-input-number v-model:value="formData.planting_quantity" :min="0" style="width: 100%" placeholder="株" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="预测产量(kg)">
              <n-input-number v-model:value="formData.predicted_yield" :min="0" :step="0.01" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="实际产量(kg)">
              <n-input-number v-model:value="formData.actual_yield" :min="0" :step="0.01" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="备注">
          <n-input v-model:value="formData.remark" type="textarea" :rows="2" placeholder="批次备注信息" />
        </n-form-item>
        <n-form-item label="处理结果">
          <n-input v-model:value="formData.process_result" type="textarea" :rows="2" placeholder="批次处理结果" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" @click="handleSubmit">确定</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { NTag, NButton, NPopconfirm, useMessage } from 'naive-ui'
import { useApi } from '@/composables/useApi'
import { useFormat } from '@/composables/useFormat'

const { get, post, put, del } = useApi()
const { formatDate, getStatusTagType, getStatusText } = useFormat()
const message = useMessage()

const keyword = ref('')
const statusFilter = ref<string | null>(null)
const plotFilter = ref<number | null>(null)
const varietyFilter = ref<number | null>(null)
const batches = ref<any[]>([])
const plotOptions = ref<any[]>([])
const varietyOptions = ref<any[]>([])
const showCreateModal = ref(false)
const editingBatch = ref<any>(null)

const formData = ref({
  batch_no: '',
  plot_id: null as any,
  variety_id: null as any,
  plant_date: null,
  expected_harvest_date: null,
  actual_harvest_date: null,
  status: 'growing',
  planting_quantity: null,
  predicted_yield: null,
  actual_yield: null,
  remark: '',
  process_result: '',
})

const statusOptions = [
  { label: '生长中', value: 'growing' },
  { label: '待采收', value: 'harvesting' },
  { label: '已采收', value: 'harvested' },
  { label: '已结束', value: 'finished' },
]

const stats = computed(() => {
  const result: Record<string, number> = {
    growing: 0,
    harvesting: 0,
    harvested: 0,
    total_predicted: 0,
  }
  batches.value.forEach((b) => {
    if (b.status === 'growing') result.growing++
    if (b.status === 'harvesting') result.harvesting++
    if (b.status === 'harvested') result.harvested++
    if (b.predicted_yield) result.total_predicted += b.predicted_yield
  })
  return result
})

const columns = [
  { title: '批次号', key: 'batch_no', width: 130 },
  { title: '地块', key: 'plot_name', width: 100 },
  { title: '品种', key: 'variety_name', width: 100 },
  { title: '定植日期', key: 'plant_date', width: 110, render: (row: any) => formatDate(row.plant_date) },
  { title: '预计采收', key: 'expected_harvest_date', width: 110, render: (row: any) => formatDate(row.expected_harvest_date) },
  {
    title: '状态',
    key: 'status',
    width: 90,
    render: (row: any) =>
      h(NTag, { type: getStatusTagType(row.status), size: 'small' }, { default: () => getStatusText(row.status) }),
  },
  { title: '种植数量', key: 'planting_quantity', width: 100, render: (row: any) => row.planting_quantity ? `${row.planting_quantity} 株` : '-' },
  { title: '预测产量', key: 'predicted_yield', width: 100, render: (row: any) => row.predicted_yield ? `${row.predicted_yield} kg` : '-' },
  { title: '备注', key: 'remark', width: 120, ellipsis: { tooltip: true } },
  {
    title: '操作',
    key: 'action',
    width: 150,
    render: (row: any) =>
      h('div', { style: 'display: flex; gap: 8px' }, [
        h(NButton, { size: 'small', type: 'primary', quaternary: true, onClick: () => handleEdit(row) }, { default: () => '编辑' }),
        h(NPopconfirm, { onPositiveClick: () => handleDelete(row.id) }, {
          trigger: () => h(NButton, { size: 'small', type: 'error', quaternary: true }, { default: () => '删除' }),
          default: () => '确定删除该批次吗？',
        }),
      ]),
  },
]

async function loadPlots() {
  try {
    const plots: any = await get('/plots', { status: 'active' })
    plotOptions.value = plots.map((p: any) => ({ label: p.name, value: p.id }))
  } catch (e) {
    console.error(e)
  }
}

async function loadVarieties() {
  try {
    const varieties: any = await get('/varieties')
    varietyOptions.value = varieties.map((v: any) => ({ label: v.name, value: v.id }))
  } catch (e) {
    console.error(e)
  }
}

async function loadBatches() {
  try {
    const params: any = {}
    if (keyword.value) params.keyword = keyword.value
    if (statusFilter.value) params.status = statusFilter.value
    if (plotFilter.value) params.plot_id = plotFilter.value
    if (varietyFilter.value) params.variety_id = varietyFilter.value
    batches.value = await get('/batches', params)
  } catch (e) {
    message.error('加载失败')
  }
}

function handleEdit(row: any) {
  editingBatch.value = row
  formData.value = { ...row }
  showCreateModal.value = true
}

async function handleDelete(id: number) {
  try {
    await del(`/batches/${id}`)
    message.success('删除成功')
    loadBatches()
  } catch (e) {
    message.error('删除失败')
  }
}

async function handleSubmit() {
  try {
    if (editingBatch.value) {
      await put(`/batches/${editingBatch.value.id}`, formData.value)
      message.success('更新成功')
    } else {
      await post('/batches', formData.value)
      message.success('创建成功')
    }
    showCreateModal.value = false
    editingBatch.value = null
    resetForm()
    loadBatches()
  } catch (e: any) {
    message.error(e.data?.detail || '操作失败')
  }
}

function resetForm() {
  formData.value = {
    batch_no: '',
    plot_id: null,
    variety_id: null,
    plant_date: null,
    expected_harvest_date: null,
    actual_harvest_date: null,
    status: 'growing',
    planting_quantity: null,
    predicted_yield: null,
    actual_yield: null,
    remark: '',
    process_result: '',
  }
}

onMounted(() => {
  loadPlots()
  loadVarieties()
  loadBatches()
})
</script>

<style scoped>
</style>
