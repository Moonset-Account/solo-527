<template>
  <div class="reservations-page">
    <n-space vertical :size="20" style="width: 100%">
      <n-card :bordered="false" size="small">
        <n-space :size="16">
          <n-input v-model:value="keyword" placeholder="搜索预约号/农机名称" clearable style="width: 240px" />
          <n-select v-model:value="statusFilter" :options="statusOptions" placeholder="状态筛选" clearable style="width: 160px" />
          <n-select v-model:value="typeFilter" :options="typeOptions" placeholder="农机类型" clearable style="width: 160px" />
          <n-button type="primary" @click="loadReservations">查询</n-button>
          <n-button @click="showCreateModal = true">新增预约</n-button>
        </n-space>
      </n-card>

      <n-card :bordered="false" size="small">
        <n-data-table
          :columns="columns"
          :data="reservations"
          :bordered="false"
          :pagination="{ pageSize: 10 }"
          size="small"
        />
      </n-card>
    </n-space>

    <n-modal v-model:show="showCreateModal" preset="card" :title="editingReservation ? '编辑预约' : '新增农机预约'" style="width: 560px">
      <n-form :model="formData" label-placement="left" label-width="110px">
        <n-form-item label="预约编号">
          <n-input v-model:value="formData.reservation_no" placeholder="请输入预约编号" />
        </n-form-item>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="农机名称">
              <n-input v-model:value="formData.machine_name" placeholder="请输入农机名称" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="农机类型">
              <n-select v-model:value="formData.machine_type" :options="typeOptions" placeholder="请选择类型" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="申请人">
              <n-input v-model:value="formData.applicant" placeholder="请输入申请人" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="地块">
              <n-select v-model:value="formData.plot_id" :options="plotOptions" placeholder="请选择地块" clearable />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="用途">
          <n-input v-model:value="formData.purpose" placeholder="请输入用途" />
        </n-form-item>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="开始时间">
              <n-date-picker v-model:value="formData.start_time" type="datetime" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="结束时间">
              <n-date-picker v-model:value="formData.end_time" type="datetime" style="width: 100%" />
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
            <n-form-item label="操作手">
              <n-input v-model:value="formData.operator" placeholder="请输入操作手" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="备注">
          <n-input v-model:value="formData.remark" type="textarea" :rows="3" placeholder="请输入备注" />
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
const { formatDateTime, getStatusTagType, getStatusText } = useFormat()
const message = useMessage()

const keyword = ref('')
const statusFilter = ref<string | null>(null)
const typeFilter = ref<string | null>(null)
const reservations = ref<any[]>([])
const plotOptions = ref<any[]>([])
const showCreateModal = ref(false)
const editingReservation = ref<any>(null)

const formData = ref({
  reservation_no: '',
  machine_name: '',
  machine_type: '',
  applicant: '',
  plot_id: null as any,
  purpose: '',
  start_time: null,
  end_time: null,
  status: 'pending',
  operator: '',
  remark: '',
})

const statusOptions = [
  { label: '待确认', value: 'pending' },
  { label: '已确认', value: 'confirmed' },
  { label: '进行中', value: 'processing' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]

const typeOptions = [
  { label: '耕作机械', value: 'tillage' },
  { label: '播种机械', value: 'seeding' },
  { label: '灌溉设备', value: 'irrigation' },
  { label: '植保机械', value: 'plant_protection' },
  { label: '采收机械', value: 'harvesting' },
  { label: '运输机械', value: 'transport' },
  { label: '其他', value: 'other' },
]

const columns = [
  { title: '预约号', key: 'reservation_no', width: 130 },
  { title: '农机名称', key: 'machine_name', width: 120 },
  { title: '类型', key: 'machine_type', width: 100 },
  { title: '申请人', key: 'applicant', width: 100 },
  { title: '用途', key: 'purpose', width: 150, ellipsis: { tooltip: true } },
  { title: '开始时间', key: 'start_time', width: 160, render: (row: any) => formatDateTime(row.start_time) },
  { title: '结束时间', key: 'end_time', width: 160, render: (row: any) => formatDateTime(row.end_time) },
  {
    title: '状态',
    key: 'status',
    width: 90,
    render: (row: any) =>
      h(NTag, { type: getStatusTagType(row.status), size: 'small' }, { default: () => getStatusText(row.status) }),
  },
  { title: '操作手', key: 'operator', width: 100 },
  {
    title: '操作',
    key: 'action',
    width: 150,
    render: (row: any) =>
      h('div', { style: 'display: flex; gap: 8px' }, [
        h(NButton, { size: 'small', type: 'primary', quaternary: true, onClick: () => handleEdit(row) }, { default: () => '编辑' }),
        h(NPopconfirm, { onPositiveClick: () => handleDelete(row.id) }, {
          trigger: () => h(NButton, { size: 'small', type: 'error', quaternary: true }, { default: () => '删除' }),
          default: () => '确定删除该预约吗？',
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

async function loadReservations() {
  try {
    const params: any = {}
    if (keyword.value) params.keyword = keyword.value
    if (statusFilter.value) params.status = statusFilter.value
    if (typeFilter.value) params.machine_type = typeFilter.value
    reservations.value = await get('/machine-reservations', params)
  } catch (e) {
    message.error('加载失败')
  }
}

function handleEdit(row: any) {
  editingReservation.value = row
  formData.value = { ...row }
  showCreateModal.value = true
}

async function handleDelete(id: number) {
  try {
    await del(`/machine-reservations/${id}`)
    message.success('删除成功')
    loadReservations()
  } catch (e) {
    message.error('删除失败')
  }
}

async function handleSubmit() {
  try {
    if (editingReservation.value) {
      await put(`/machine-reservations/${editingReservation.value.id}`, formData.value)
      message.success('更新成功')
    } else {
      await post('/machine-reservations', formData.value)
      message.success('创建成功')
    }
    showCreateModal.value = false
    editingReservation.value = null
    resetForm()
    loadReservations()
  } catch (e: any) {
    message.error(e.data?.detail || '操作失败')
  }
}

function resetForm() {
  formData.value = {
    reservation_no: '',
    machine_name: '',
    machine_type: '',
    applicant: '',
    plot_id: null,
    purpose: '',
    start_time: null,
    end_time: null,
    status: 'pending',
    operator: '',
    remark: '',
  }
}

onMounted(() => {
  loadPlots()
  loadReservations()
})
</script>

<style scoped>
</style>
