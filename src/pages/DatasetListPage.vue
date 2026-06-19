<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const router = useRouter()
const { get, post, del } = useApi()

const search = ref('')
const statusFilter = ref('')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

interface Dataset {
  id: number
  name: string
  source: string
  status: string
  version: number
  createdByName: string
  updatedAt: string
}

const tableData = ref<Dataset[]>([])
const dialogVisible = ref(false)

const form = ref({
  name: '',
  description: '',
  source: '',
  fields: [] as Array<{ name: string; type: string; isDesensitized: boolean; desensitizationType: string; description: string }>,
})

onMounted(() => { fetchData() })

async function fetchData() {
  const params = new URLSearchParams({
    page: String(page.value),
    pageSize: String(pageSize.value),
  })
  if (search.value) params.set('search', search.value)
  if (statusFilter.value) params.set('status', statusFilter.value)

  const data = await get<any>(`/api/datasets?${params}`)
  if (data) {
    tableData.value = data.items
    total.value = data.total
  }
}

function statusType(s: string) {
  return s === 'active' ? 'success' : s === 'draft' ? 'warning' : 'info'
}

function statusLabel(s: string) {
  return s === 'active' ? '活跃' : s === 'draft' ? '草稿' : '已归档'
}

function handlePageChange(p: number) {
  page.value = p
  fetchData()
}

function addField() {
  form.value.fields.push({ name: '', type: 'string', isDesensitized: false, desensitizationType: '', description: '' })
}

function removeField(index: number) {
  form.value.fields.splice(index, 1)
}

function openCreateDialog() {
  form.value = { name: '', description: '', source: '', fields: [] }
  dialogVisible.value = true
}

async function handleCreate() {
  if (!form.value.name) {
    ElMessage.warning('请输入数据集名称')
    return
  }
  const ok = await post('/api/datasets', form.value)
  if (ok !== null) {
    ElMessage.success('创建成功')
    dialogVisible.value = false
    fetchData()
  }
}

function handleEdit(row: Dataset) {
  router.push(`/datasets/${row.id}`)
}

async function handleDelete(row: Dataset) {
  try {
    await ElMessageBox.confirm('确定要归档该数据集吗？', '确认', { type: 'warning' })
    const ok = await del(`/api/datasets/${row.id}`)
    if (ok !== null) {
      ElMessage.success('已归档')
      fetchData()
    }
  } catch { /* cancel */ }
}

function handleVersionHistory(row: Dataset) {
  router.push(`/datasets/${row.id}`)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <el-input v-model="search" placeholder="搜索数据集" clearable style="width: 240px" @clear="fetchData" @keyup.enter="fetchData" />
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 140px" @change="fetchData">
          <el-option label="活跃" value="active" />
          <el-option label="草稿" value="draft" />
          <el-option label="已归档" value="archived" />
        </el-select>
        <el-button type="primary" @click="fetchData">搜索</el-button>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建数据集</el-button>
    </div>

    <el-table :data="tableData" stripe>
      <el-table-column prop="name" label="名称" min-width="140" />
      <el-table-column prop="source" label="来源" width="120" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="version" label="版本" width="80">
        <template #default="{ row }">
          <span class="font-mono">v{{ row.version }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="createdByName" label="创建人" width="100" />
      <el-table-column prop="updatedAt" label="更新时间" width="170">
        <template #default="{ row }">
          <span class="text-xs" style="color: var(--color-text-muted)">{{ row.updatedAt }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button text type="primary" size="small" @click="handleVersionHistory(row)">版本历史</el-button>
          <el-button text type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="flex justify-end">
      <el-pagination
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>

    <el-dialog v-model="dialogVisible" title="新建数据集" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="请输入数据集名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="来源">
          <el-input v-model="form.source" placeholder="请输入数据来源" />
        </el-form-item>
        <el-form-item label="字段">
          <div class="w-full space-y-2">
            <div v-for="(field, index) in form.fields" :key="index" class="flex items-center gap-2">
              <el-input v-model="field.name" placeholder="字段名" style="width: 120px" />
              <el-select v-model="field.type" style="width: 100px">
                <el-option label="字符串" value="string" />
                <el-option label="整数" value="integer" />
                <el-option label="浮点数" value="float" />
                <el-option label="日期" value="date" />
                <el-option label="布尔" value="boolean" />
              </el-select>
              <el-input v-model="field.description" placeholder="描述" style="flex: 1" />
              <el-button :icon="Plus" text type="danger" @click="removeField(index)" />
            </div>
            <el-button size="small" @click="addField">+ 添加字段</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>
