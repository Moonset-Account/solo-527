<template>
  <div class="records-page">
    <n-space vertical :size="20" style="width: 100%">
      <n-card :bordered="false" size="small">
        <n-space :size="16" wrap>
          <n-input v-model:value="keyword" placeholder="搜索记录号/标题/批次" clearable style="width: 240px" />
          <n-select v-model:value="typeFilter" :options="typeOptions" placeholder="类型筛选" clearable style="width: 160px" />
          <n-date-picker
            v-model:value="dateRange"
            type="daterange"
            placeholder="时间范围"
            clearable
            style="width: 280px"
          />
          <n-button type="primary" @click="loadRecords">查询</n-button>
          <n-button @click="showCreateModal = true">新增记录</n-button>
        </n-space>
      </n-card>

      <n-card :bordered="false" size="small">
        <template #header>
          <div class="card-header">
            <span>农事记录列表</span>
            <n-tag type="info" size="small">共 {{ records.length }} 条记录</n-tag>
          </div>
        </template>
        <n-data-table
          :columns="columns"
          :data="records"
          :bordered="false"
          :pagination="{ pageSize: 10 }"
          size="small"
        />
      </n-card>
    </n-space>

    <n-modal v-model:show="showCreateModal" preset="card" :title="editingRecord ? '编辑记录' : '新增农事记录'" style="width: 600px">
      <n-form :model="formData" label-placement="left" label-width="110px">
        <n-form-item label="记录编号">
          <n-input v-model:value="formData.record_no" placeholder="请输入记录编号" />
        </n-form-item>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="关联批次">
              <n-select v-model:value="formData.batch_id" :options="batchOptions" placeholder="请选择批次" filterable />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="记录类型">
              <n-select v-model:value="formData.record_type" :options="typeOptions" placeholder="请选择类型" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="标题">
          <n-input v-model:value="formData.title" placeholder="请输入记录标题" />
        </n-form-item>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="记录时间">
              <n-date-picker v-model:value="formData.record_time" type="datetime" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="天气">
              <n-select v-model:value="formData.weather" :options="weatherOptions" placeholder="请选择天气" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="内容">
          <n-input v-model:value="formData.content" type="textarea" :rows="4" placeholder="请输入记录内容" />
        </n-form-item>
        <n-form-item label="使用物资">
          <n-input v-model:value="formData.materials_used" type="textarea" :rows="2" placeholder="请输入使用的农资物资" />
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
import { ref, onMounted, h } from 'vue'
import { NTag, NButton, NPopconfirm, useMessage } from 'naive-ui'
import { useApi } from '@/composables/useApi'
import { useFormat } from '@/composables/useFormat'

const { get, post, put, del } = useApi()
const { formatDateTime, getRecordTypeText } = useFormat()
const message = useMessage()

const keyword = ref('')
const typeFilter = ref<string | null>(null)
const dateRange = ref<[number, number] | null>(null)
const records = ref<any[]>([])
const batchOptions = ref<any[]>([])
const showCreateModal = ref(false)
const editingRecord = ref<any>(null)

const formData = ref({
  record_no: '',
  batch_id: null as any,
  record_type: '',
  title: '',
  content: '',
  operator_id: null,
  record_time: null,
  weather: '',
  materials_used: '',
})

const typeOptions = [
  { label: '播种', value: 'planting' },
  { label: '移栽', value: 'transplanting' },
  { label: '浇水', value: 'watering' },
  { label: '施肥', value: 'fertilizing' },
  { label: '病虫害防治', value: 'pest_control' },
  { label: '整枝打杈', value: 'pruning' },
  { label: '采收', value: 'harvesting' },
  { label: '巡查', value: 'inspection' },
  { label: '环境调控', value: 'environment' },
  { label: '其他', value: 'other' },
]

const weatherOptions = [
  { label: '晴', value: 'sunny' },
  { label: '多云', value: 'cloudy' },
  { label: '阴', value: 'overcast' },
  { label: '小雨', value: 'light_rain' },
  { label: '中雨', value: 'moderate_rain' },
  { label: '大雨', value: 'heavy_rain' },
]

const columns = [
  { title: '记录号', key: 'record_no', width: 120 },
  {
    title: '类型',
    key: 'record_type',
    width: 100,
    render: (row: any) =>
      h(NTag, { type: 'info', size: 'small' }, { default: () => getRecordTypeText(row.record_type) }),
  },
  { title: '标题', key: 'title', width: 200, ellipsis: { tooltip: true } },
  { title: '批次号', key: 'batch_no', width: 120 },
  { title: '品种', key: 'variety_name', width: 100 },
  { title: '操作人', key: 'operator_name', width: 100 },
  { title: '天气', key: 'weather', width: 80 },
  { title: '记录时间', key: 'record_time', width: 160, render: (row: any) => formatDateTime(row.record_time) },
  {
    title: '操作',
    key: 'action',
    width: 150,
    render: (row: any) =>
      h('div', { style: 'display: flex; gap: 8px' }, [
        h(NButton, { size: 'small', type: 'primary', quaternary: true, onClick: () => handleEdit(row) }, { default: () => '编辑' }),
        h(NPopconfirm, { onPositiveClick: () => handleDelete(row.id) }, {
          trigger: () => h(NButton, { size: 'small', type: 'error', quaternary: true }, { default: () => '删除' }),
          default: () => '确定删除该记录吗？',
        }),
      ]),
  },
]

async function loadBatches() {
  try {
    const batches: any = await get('/batches')
    batchOptions.value = batches.map((b: any) => ({
      label: `${b.batch_no} - ${b.variety_name}`,
      value: b.id,
    }))
  } catch (e) {
    console.error(e)
  }
}

async function loadRecords() {
  try {
    const params: any = {}
    if (keyword.value) params.keyword = keyword.value
    if (typeFilter.value) params.record_type = typeFilter.value
    if (dateRange.value) {
      params.start_date = new Date(dateRange.value[0]).toISOString()
      params.end_date = new Date(dateRange.value[1]).toISOString()
    }
    records.value = await get('/farm-records', params)
  } catch (e) {
    message.error('加载失败')
  }
}

function handleEdit(row: any) {
  editingRecord.value = row
  formData.value = { ...row }
  showCreateModal.value = true
}

async function handleDelete(id: number) {
  try {
    await del(`/farm-records/${id}`)
    message.success('删除成功')
    loadRecords()
  } catch (e) {
    message.error('删除失败')
  }
}

async function handleSubmit() {
  try {
    if (editingRecord.value) {
      await put(`/farm-records/${editingRecord.value.id}`, formData.value)
      message.success('更新成功')
    } else {
      await post('/farm-records', formData.value)
      message.success('创建成功')
    }
    showCreateModal.value = false
    editingRecord.value = null
    resetForm()
    loadRecords()
  } catch (e: any) {
    message.error(e.data?.detail || '操作失败')
  }
}

function resetForm() {
  formData.value = {
    record_no: '',
    batch_id: null,
    record_type: '',
    title: '',
    content: '',
    operator_id: null,
    record_time: null,
    weather: '',
    materials_used: '',
  }
}

onMounted(() => {
  loadBatches()
  loadRecords()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>
