<template>
  <div class="plots-page">
    <n-space vertical :size="20" style="width: 100%">
      <n-card :bordered="false" size="small">
        <n-space :size="16">
          <n-input v-model:value="keyword" placeholder="搜索地块名称/编号" clearable style="width: 240px" />
          <n-select v-model:value="statusFilter" :options="statusOptions" placeholder="状态筛选" clearable style="width: 160px" />
          <n-button type="primary" @click="loadPlots">查询</n-button>
          <n-button @click="showCreateModal = true">新增地块</n-button>
        </n-space>
      </n-card>

      <n-card :bordered="false" size="small">
        <n-data-table
          :columns="columns"
          :data="plots"
          :bordered="false"
          :pagination="{ pageSize: 10 }"
          size="small"
        />
      </n-card>
    </n-space>

    <n-modal v-model:show="showCreateModal" preset="card" :title="editingPlot ? '编辑地块' : '新增地块'" style="width: 560px">
      <n-form :model="formData" label-placement="left" label-width="100px">
        <n-form-item label="地块名称">
          <n-input v-model:value="formData.name" placeholder="请输入地块名称" />
        </n-form-item>
        <n-form-item label="地块编号">
          <n-input v-model:value="formData.code" placeholder="请输入地块编号" />
        </n-form-item>
        <n-form-item label="面积(亩)">
          <n-input-number v-model:value="formData.area" :min="0" style="width: 100%" />
        </n-form-item>
        <n-form-item label="大棚类型">
          <n-select v-model:value="formData.greenhouse_type" :options="greenhouseTypes" placeholder="请选择大棚类型" />
        </n-form-item>
        <n-form-item label="位置">
          <n-input v-model:value="formData.location" placeholder="请输入位置" />
        </n-form-item>
        <n-form-item label="状态">
          <n-select v-model:value="formData.status" :options="statusOptions" />
        </n-form-item>
        <n-form-item label="描述">
          <n-input v-model:value="formData.description" type="textarea" :rows="3" placeholder="请输入描述" />
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
const { getStatusTagType, getStatusText } = useFormat()
const message = useMessage()

const keyword = ref('')
const statusFilter = ref<string | null>(null)
const plots = ref<any[]>([])
const showCreateModal = ref(false)
const editingPlot = ref<any>(null)

const formData = ref({
  name: '',
  code: '',
  area: 0,
  greenhouse_type: '',
  location: '',
  status: 'active',
  description: '',
})

const statusOptions = [
  { label: '运行中', value: 'active' },
  { label: '已停用', value: 'inactive' },
]

const greenhouseTypes = [
  { label: '日光温室', value: 'solar_greenhouse' },
  { label: '塑料大棚', value: 'plastic_tunnel' },
  { label: '连栋温室', value: 'multi_span' },
  { label: '玻璃温室', value: 'glass_greenhouse' },
]

const columns = [
  { title: '编号', key: 'code', width: 120 },
  { title: '名称', key: 'name', width: 150 },
  { title: '面积(亩)', key: 'area', width: 100 },
  { title: '大棚类型', key: 'greenhouse_type', width: 120 },
  { title: '位置', key: 'location', ellipsis: { tooltip: true } },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row: any) =>
      h(NTag, { type: getStatusTagType(row.status), size: 'small' }, { default: () => getStatusText(row.status) }),
  },
  { title: '描述', key: 'description', ellipsis: { tooltip: true } },
  {
    title: '操作',
    key: 'action',
    width: 150,
    render: (row: any) =>
      h('div', { style: 'display: flex; gap: 8px' }, [
        h(NButton, { size: 'small', type: 'primary', quaternary: true, onClick: () => handleEdit(row) }, { default: () => '编辑' }),
        h(NPopconfirm, { onPositiveClick: () => handleDelete(row.id) }, {
          trigger: () => h(NButton, { size: 'small', type: 'error', quaternary: true }, { default: () => '删除' }),
          default: () => '确定删除该地块吗？',
        }),
      ]),
  },
]

async function loadPlots() {
  try {
    const params: any = {}
    if (keyword.value) params.keyword = keyword.value
    if (statusFilter.value) params.status = statusFilter.value
    plots.value = await get('/plots', params)
  } catch (e) {
    message.error('加载失败')
  }
}

function handleEdit(row: any) {
  editingPlot.value = row
  formData.value = { ...row }
  showCreateModal.value = true
}

async function handleDelete(id: number) {
  try {
    await del(`/plots/${id}`)
    message.success('删除成功')
    loadPlots()
  } catch (e) {
    message.error('删除失败')
  }
}

async function handleSubmit() {
  try {
    if (editingPlot.value) {
      await put(`/plots/${editingPlot.value.id}`, formData.value)
      message.success('更新成功')
    } else {
      await post('/plots', formData.value)
      message.success('创建成功')
    }
    showCreateModal.value = false
    editingPlot.value = null
    resetForm()
    loadPlots()
  } catch (e: any) {
    message.error(e.data?.detail || '操作失败')
  }
}

function resetForm() {
  formData.value = {
    name: '',
    code: '',
    area: 0,
    greenhouse_type: '',
    location: '',
    status: 'active',
    description: '',
  }
}

onMounted(() => {
  loadPlots()
})
</script>

<style scoped>
</style>
