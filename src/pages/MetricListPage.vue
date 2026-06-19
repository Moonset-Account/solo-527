<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const { get, post, put, del } = useApi()

const search = ref('')
const statusFilter = ref('')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

interface Metric {
  id: number
  name: string
  caliber: string
  datasetName: string
  status: string
  notifyOnChange: boolean
  dimensions?: Array<{ id: number; name: string; type: string; values: string }>
}

const tableData = ref<Metric[]>([])
const editDialogVisible = ref(false)
const caliberDialogVisible = ref(false)

const editForm = ref<any>({
  name: '',
  caliber: '',
  formula: '',
  datasetId: null,
  dimensions: [],
  notifyOnChange: true,
})

const caliberForm = ref({
  newCaliber: '',
  securityNote: '',
})

const originalCaliber = ref('')

onMounted(() => { fetchData() })

async function fetchData() {
  const params = new URLSearchParams({
    page: String(page.value),
    pageSize: String(pageSize.value),
  })
  if (search.value) params.set('search', search.value)
  if (statusFilter.value) params.set('status', statusFilter.value)

  const data = await get<any>(`/api/metrics?${params}`)
  if (data) {
    tableData.value = data.items
    total.value = data.total
  }
}

function statusType(s: string) {
  return s === 'normal' ? 'success' : s === 'changed' ? 'warning' : 'danger'
}

function statusLabel(s: string) {
  return s === 'normal' ? '正常' : s === 'changed' ? '已变更' : '已废弃'
}

function handlePageChange(p: number) {
  page.value = p
  fetchData()
}

function openEditDialog(row?: Metric) {
  if (row) {
    editForm.value = {
      id: row.id,
      name: row.name,
      caliber: row.caliber,
      formula: '',
      datasetId: null,
      dimensions: [],
      notifyOnChange: row.notifyOnChange,
    }
    originalCaliber.value = row.caliber
  } else {
    editForm.value = { name: '', caliber: '', formula: '', datasetId: null, dimensions: [], notifyOnChange: true }
    originalCaliber.value = ''
  }
  editDialogVisible.value = true
}

function addDimension() {
  editForm.value.dimensions.push({ name: '', type: 'enum', values: '' })
}

function removeDimension(index: number) {
  editForm.value.dimensions.splice(index, 1)
}

function handleCaliberChange() {
  if (editForm.value.caliber && editForm.value.caliber !== originalCaliber.value) {
    caliberForm.value.newCaliber = editForm.value.caliber
    caliberDialogVisible.value = true
  }
}

function confirmCaliberChange() {
  if (!caliberForm.value.securityNote) {
    ElMessage.warning('请填写安全备注')
    return
  }
  editForm.value.securityNote = caliberForm.value.securityNote
  caliberDialogVisible.value = false
  ElMessage.info('口径变更将通知供应链管理人员')
}

async function handleSave() {
  if (!editForm.value.name || !editForm.value.caliber) {
    ElMessage.warning('请填写必填项')
    return
  }

  if (editForm.value.id) {
    const ok = await put(`/api/metrics/${editForm.value.id}`, editForm.value)
    if (ok !== null) {
      ElMessage.success('更新成功')
      editDialogVisible.value = false
      fetchData()
    }
  } else {
    const ok = await post('/api/metrics', editForm.value)
    if (ok !== null) {
      ElMessage.success('创建成功')
      editDialogVisible.value = false
      fetchData()
    }
  }
}

async function handleDelete(row: Metric) {
  try {
    await ElMessageBox.confirm('确定要废弃该指标吗？', '确认', { type: 'warning' })
    const ok = await del(`/api/metrics/${row.id}`)
    if (ok !== null) {
      ElMessage.success('已废弃')
      fetchData()
    }
  } catch { /* cancel */ }
}

async function handleNotifyChange(row: Metric) {
  await put(`/api/metrics/${row.id}`, { notifyOnChange: row.notifyOnChange })
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <el-input v-model="search" placeholder="搜索指标" clearable style="width: 240px" @clear="fetchData" @keyup.enter="fetchData" />
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 140px" @change="fetchData">
          <el-option label="正常" value="normal" />
          <el-option label="已变更" value="changed" />
          <el-option label="已废弃" value="deprecated" />
        </el-select>
        <el-button type="primary" @click="fetchData">搜索</el-button>
      </div>
      <el-button type="primary" :icon="Plus" @click="openEditDialog()">新建指标</el-button>
    </div>

    <el-table :data="tableData" stripe row-key="id">
      <el-table-column type="expand">
        <template #default="{ row }">
          <div class="px-6 py-3">
            <div class="text-sm font-medium mb-2" style="color: var(--color-text-secondary)">维度列表</div>
            <div v-if="row.dimensions?.length" class="flex flex-wrap gap-2">
              <el-tag v-for="dim in row.dimensions" :key="dim.id" size="small">
                {{ dim.name }} ({{ dim.type }})
              </el-tag>
            </div>
            <div v-else class="text-sm" style="color: var(--color-text-muted)">暂无维度</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="指标名称" min-width="140" />
      <el-table-column prop="caliber" label="口径说明" min-width="200">
        <template #default="{ row }">
          <span class="text-sm truncate block max-w-[260px]" :title="row.caliber">{{ row.caliber }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="datasetName" label="关联数据集" width="140" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="变更通知" width="100">
        <template #default="{ row }">
          <el-switch v-model="row.notifyOnChange" size="small" @change="handleNotifyChange(row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
          <el-button text type="danger" size="small" @click="handleDelete(row)">废弃</el-button>
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

    <el-dialog v-model="editDialogVisible" title="编辑指标" width="600px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="名称">
          <el-input v-model="editForm.name" placeholder="请输入指标名称" />
        </el-form-item>
        <el-form-item label="口径说明">
          <el-input v-model="editForm.caliber" type="textarea" :rows="2" placeholder="请输入口径说明" @change="handleCaliberChange" />
        </el-form-item>
        <el-form-item label="公式">
          <el-input v-model="editForm.formula" placeholder="请输入计算公式" class="font-mono" />
        </el-form-item>
        <el-form-item label="变更通知">
          <el-switch v-model="editForm.notifyOnChange" />
        </el-form-item>
        <el-form-item label="维度">
          <div class="w-full space-y-2">
            <div v-for="(dim, index) in editForm.dimensions" :key="index" class="flex items-center gap-2">
              <el-input v-model="dim.name" placeholder="维度名" style="width: 120px" />
              <el-select v-model="dim.type" style="width: 100px">
                <el-option label="枚举" value="enum" />
                <el-option label="范围" value="range" />
                <el-option label="时间" value="time" />
              </el-select>
              <el-input v-model="dim.values" placeholder="值(逗号分隔)" style="flex: 1" />
              <el-button text type="danger" @click="removeDimension(index)">删除</el-button>
            </div>
            <el-button size="small" @click="addDimension">+ 添加维度</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="caliberDialogVisible" title="口径变更确认" width="500px" :close-on-click-modal="false">
      <el-alert title="口径变更将通知供应链管理人员" type="warning" :closable="false" show-icon class="mb-4" />
      <el-form :model="caliberForm" label-width="100px">
        <el-form-item label="新口径">
          <el-input v-model="caliberForm.newCaliber" type="textarea" :rows="2" readonly />
        </el-form-item>
        <el-form-item label="安全备注">
          <el-input v-model="caliberForm.securityNote" type="textarea" :rows="2" placeholder="请说明变更原因和安全评估" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="caliberDialogVisible = false; editForm.caliber = originalCaliber">取消变更</el-button>
        <el-button type="primary" @click="confirmCaliberChange">确认变更</el-button>
      </template>
    </el-dialog>
  </div>
</template>
