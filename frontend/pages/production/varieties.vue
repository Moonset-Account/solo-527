<template>
  <div class="varieties-page">
    <n-space vertical :size="20" style="width: 100%">
      <n-card :bordered="false" size="small">
        <n-space :size="16">
          <n-input v-model:value="keyword" placeholder="搜索品种名称/编号" clearable style="width: 240px" />
          <n-select v-model:value="categoryFilter" :options="categoryOptions" placeholder="类别筛选" clearable style="width: 160px" />
          <n-button type="primary" @click="loadVarieties">查询</n-button>
          <n-button @click="showCreateModal = true">新增品种</n-button>
        </n-space>
      </n-card>

      <n-card :bordered="false" size="small">
        <n-data-table
          :columns="columns"
          :data="varieties"
          :bordered="false"
          :pagination="{ pageSize: 10 }"
          size="small"
        />
      </n-card>
    </n-space>

    <n-modal v-model:show="showCreateModal" preset="card" :title="editingVariety ? '编辑品种' : '新增品种'" style="width: 560px">
      <n-form :model="formData" label-placement="left" label-width="110px">
        <n-form-item label="品种名称">
          <n-input v-model:value="formData.name" placeholder="请输入品种名称" />
        </n-form-item>
        <n-form-item label="品种编号">
          <n-input v-model:value="formData.code" placeholder="请输入品种编号" />
        </n-form-item>
        <n-form-item label="类别">
          <n-select v-model:value="formData.category" :options="categoryOptions" placeholder="请选择类别" />
        </n-form-item>
        <n-form-item label="生长周期(天)">
          <n-input-number v-model:value="formData.growth_cycle_days" :min="0" style="width: 100%" />
        </n-form-item>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="最适温度(℃)">
              <n-input-number v-model:value="formData.optimal_temp_min" placeholder="最低" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="~">
              <n-input-number v-model:value="formData.optimal_temp_max" placeholder="最高" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="最适湿度(%)">
              <n-input-number v-model:value="formData.optimal_humidity_min" placeholder="最低" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="~">
              <n-input-number v-model:value="formData.optimal_humidity_max" placeholder="最高" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="预期产量(kg/株)">
          <n-input-number v-model:value="formData.expected_yield" :min="0" :step="0.1" style="width: 100%" />
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
import { NButton, NPopconfirm, useMessage } from 'naive-ui'
import { useApi } from '@/composables/useApi'

const { get, post, put, del } = useApi()
const message = useMessage()

const keyword = ref('')
const categoryFilter = ref<string | null>(null)
const varieties = ref<any[]>([])
const showCreateModal = ref(false)
const editingVariety = ref<any>(null)

const formData = ref({
  name: '',
  code: '',
  category: '',
  growth_cycle_days: 0,
  optimal_temp_min: null,
  optimal_temp_max: null,
  optimal_humidity_min: null,
  optimal_humidity_max: null,
  expected_yield: null,
  description: '',
})

const categoryOptions = [
  { label: '叶菜类', value: 'leafy' },
  { label: '茄果类', value: 'solanaceous' },
  { label: '瓜类', value: 'cucurbit' },
  { label: '豆类', value: 'legume' },
  { label: '根茎类', value: 'root' },
  { label: '其他', value: 'other' },
]

const columns = [
  { title: '编号', key: 'code', width: 100 },
  { title: '名称', key: 'name', width: 120 },
  { title: '类别', key: 'category', width: 100 },
  { title: '生长周期(天)', key: 'growth_cycle_days', width: 120 },
  { title: '最适温度(℃)', key: 'temp_range', width: 120, render: (row: any) => `${row.optimal_temp_min || '-'} ~ ${row.optimal_temp_max || '-'}` },
  { title: '最适湿度(%)', key: 'humidity_range', width: 120, render: (row: any) => `${row.optimal_humidity_min || '-'} ~ ${row.optimal_humidity_max || '-'}` },
  { title: '预期产量', key: 'expected_yield', width: 110, render: (row: any) => row.expected_yield ? `${row.expected_yield} kg/株` : '-' },
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
          default: () => '确定删除该品种吗？',
        }),
      ]),
  },
]

async function loadVarieties() {
  try {
    const params: any = {}
    if (keyword.value) params.keyword = keyword.value
    if (categoryFilter.value) params.category = categoryFilter.value
    varieties.value = await get('/varieties', params)
  } catch (e) {
    message.error('加载失败')
  }
}

function handleEdit(row: any) {
  editingVariety.value = row
  formData.value = { ...row }
  showCreateModal.value = true
}

async function handleDelete(id: number) {
  try {
    await del(`/varieties/${id}`)
    message.success('删除成功')
    loadVarieties()
  } catch (e) {
    message.error('删除失败')
  }
}

async function handleSubmit() {
  try {
    if (editingVariety.value) {
      await put(`/varieties/${editingVariety.value.id}`, formData.value)
      message.success('更新成功')
    } else {
      await post('/varieties', formData.value)
      message.success('创建成功')
    }
    showCreateModal.value = false
    editingVariety.value = null
    resetForm()
    loadVarieties()
  } catch (e: any) {
    message.error(e.data?.detail || '操作失败')
  }
}

function resetForm() {
  formData.value = {
    name: '',
    code: '',
    category: '',
    growth_cycle_days: 0,
    optimal_temp_min: null,
    optimal_temp_max: null,
    optimal_humidity_min: null,
    optimal_humidity_max: null,
    expected_yield: null,
    description: '',
  }
}

onMounted(() => {
  loadVarieties()
})
</script>

<style scoped>
</style>
