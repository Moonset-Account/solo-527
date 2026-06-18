<template>
  <div class="dataset-page page-container">
    <div class="card-wrapper">
      <div class="card-header">
        <span class="title"><el-icon><Files /></el-icon> 数据集列表</span>
        <el-button type="primary" :icon="Plus" @click="showCreate = true">
          新建数据集
        </el-button>
      </div>

      <el-form :inline="true" :model="filters" class="filter-form" style="margin-bottom: 16px;">
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索名称/编码/描述..."
            clearable
            style="width: 240px"
            @change="loadData(1)"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="filters.category" placeholder="分类" clearable style="width: 140px" @change="loadData(1)" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 120px" @change="loadData(1)">
            <el-option label="正常" value="active" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="list" stripe>
        <el-table-column label="数据集" min-width="260">
          <template #default="{ row }">
            <div class="ds-main">
              <div class="ds-name-row">
                <a @click="router.push(`/datasets/${row._id}`)" class="ds-link">
                  <el-icon><Folder /></el-icon> {{ row.name }}
                </a>
                <el-tag size="small" type="info" effect="plain" style="margin-left: 8px;">
                  {{ row.code }}
                </el-tag>
              </div>
              <div class="ds-desc" v-if="row.description">{{ row.description }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="110">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.category || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数据源" width="110">
          <template #default="{ row }">{{ row.dataSource || '-' }}</template>
        </el-table-column>
        <el-table-column label="指标数" width="90" align="center">
          <template #default="{ row }">{{ row.metrics?.length || 0 }}</template>
        </el-table-column>
        <el-table-column label="权限人数" width="100" align="center">
          <template #default="{ row }">{{ row.permissions?.length || 0 }}</template>
        </el-table-column>
        <el-table-column label="拥有者" width="110">
          <template #default="{ row }">{{ row.ownerName || '-' }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="router.push(`/datasets/${row._id}`)">
              详情
            </el-button>
            <el-button link type="primary" @click="openPermDialog(row)">
              权限
            </el-button>
            <el-button link type="danger" @click="deleteDs(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="loadData(1)"
          @current-change="loadData()"
        />
      </div>
    </div>

    <el-dialog v-model="showCreate" title="新建数据集" width="520px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="数据集名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="编码" required>
          <el-input v-model="form.code" placeholder="唯一编码，如 ds_new_users" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="form.category" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="数据源">
          <el-input v-model="form.dataSource" placeholder="如：MySQL / ClickHouse" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPerm" :title="`【${currentDs?.name}】权限配置`" width="620px">
      <div style="margin-bottom: 14px;">
        <el-button type="primary" size="small" @click="showAddPerm = true">
          <el-icon><CirclePlus /></el-icon>添加权限
        </el-button>
      </div>
      <el-table v-loading="permLoading" :data="currentDs?.permissions || []" size="small">
        <el-table-column label="用户" min-width="140">
          <template #default="{ row }">{{ row.userName }}</template>
        </el-table-column>
        <el-table-column label="权限级别" width="140">
          <template #default="{ row }">
            <el-select v-model="row.level" size="small" @change="updatePerm(row)">
              <el-option label="读取" value="read" />
              <el-option label="读写" value="write" />
              <el-option label="管理" value="manage" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="有效期" width="200">
          <template #default="{ row }">
            <el-date-picker
              v-model="row.expireAt"
              type="date"
              size="small"
              placeholder="永久有效"
              style="width: 100%;"
              @change="updatePerm(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row }">
            <el-button link type="danger" size="small" @click="removePerm(row)">
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-dialog
        v-model="showAddPerm"
        title="添加用户权限"
        width="500px"
        append-to-body
      >
        <el-form label-width="80px">
          <el-form-item label="用户" required>
            <el-select v-model="newPerm.userId" filterable placeholder="请选择用户" style="width: 100%">
              <el-option
                v-for="u in users"
                :key="u._id"
                :label="u.name + '（' + u.department + '）'"
                :value="u._id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="权限" required>
            <el-select v-model="newPerm.level" style="width: 100%">
              <el-option label="读取" value="read" />
              <el-option label="读写" value="write" />
              <el-option label="管理" value="manage" />
            </el-select>
          </el-form-item>
          <el-form-item label="有效期">
            <el-date-picker
              v-model="newPerm.expireAt"
              type="date"
              placeholder="留空表示永久有效"
              style="width: 100%;"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showAddPerm = false">取消</el-button>
          <el-button type="primary" @click="confirmAddPerm">添加</el-button>
        </template>
      </el-dialog>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getDatasets, createDataset, deleteDataset,
  addDatasetPermissions, updateDatasetPermission, removeDatasetPermission
} from '@/api/datasets'
import { getUsers } from '@/api/users'
import { formatDate } from '@/utils'
import { Files, Plus, Folder, CirclePlus } from '@element-plus/icons-vue'

const router = useRouter()

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const filters = reactive({ keyword: '', category: '', status: '' })

const users = ref<any[]>([])
const showCreate = ref(false)
const saving = ref(false)
const form = reactive({
  name: '', code: '', category: '', description: '', dataSource: ''
})

const showPerm = ref(false)
const permLoading = ref(false)
const currentDs = ref<any>(null)
const showAddPerm = ref(false)
const newPerm = reactive({ userId: '', level: 'read' as const, expireAt: '' })

async function loadUsers() {
  try {
    const res = await getUsers({ pageSize: 500 })
    users.value = res.list
  } catch (e) {}
}

async function loadData(p?: number) {
  if (p) page.value = p
  loading.value = true
  try {
    const res = await getDatasets({
      ...filters, page: page.value, pageSize: pageSize.value
    })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.category = ''
  filters.status = ''
  loadData(1)
}

async function submitForm() {
  if (!form.name || !form.code) {
    ElMessage.warning('请填写必填项')
    return
  }
  saving.value = true
  try {
    await createDataset(form)
    ElMessage.success('创建成功')
    showCreate.value = false
    Object.assign(form, { name: '', code: '', category: '', description: '', dataSource: '' })
    loadData(1)
  } finally {
    saving.value = false
  }
}

async function deleteDs(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除【${row.name}】？`, '提示', {
      type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消'
    })
    await deleteDataset(row._id)
    ElMessage.success('已删除')
    loadData()
  } catch (e) {}
}

async function openPermDialog(row: any) {
  permLoading.value = true
  try {
    currentDs.value = await getDatasets({ _id: row._id } as any).then(() => null) || row
    const detail = await (await fetch(`/api/datasets/${row._id}`)).json()
    currentDs.value = detail.data || row
    showPerm.value = true
  } finally {
    permLoading.value = false
  }
}

async function updatePerm(row: any) {
  try {
    await updateDatasetPermission(currentDs.value._id, {
      userId: row.userId, level: row.level, expireAt: row.expireAt
    })
    ElMessage.success('已更新')
  } catch (e) {}
}

async function removePerm(row: any) {
  try {
    await ElMessageBox.confirm('确认移除该用户权限？', '提示', { type: 'warning' })
    await removeDatasetPermission(currentDs.value._id, row.userId)
    currentDs.value.permissions = currentDs.value.permissions.filter(
      (p: any) => p.userId !== row.userId
    )
    ElMessage.success('已移除')
  } catch (e) {}
}

function confirmAddPerm() {
  if (!newPerm.userId) {
    ElMessage.warning('请选择用户')
    return
  }
  showAddPerm.value = false
  const user = users.value.find(u => u._id === newPerm.userId)
  currentDs.value.permissions.push({
    userId: newPerm.userId,
    userName: user?.name || '未知用户',
    level: newPerm.level,
    expireAt: newPerm.expireAt
  })
  addDatasetPermissions(currentDs.value._id, {
    permissions: [{ ...newPerm, userName: user?.name }]
  })
  Object.assign(newPerm, { userId: '', level: 'read', expireAt: '' })
  ElMessage.success('已添加')
}

onMounted(() => {
  loadData()
  loadUsers()
})
</script>

<style lang="scss" scoped>
.filter-form {
  padding: 16px;
  background: #fafbfc;
  border-radius: 6px;
  :deep(.el-form-item) { margin-bottom: 10px; margin-right: 12px; }
}
.ds-main {
  .ds-name-row {
    display: flex;
    align-items: center;
    .el-icon { margin-right: 4px; color: $primary-color; }
  }
  .ds-link {
    color: $primary-color;
    font-weight: 500;
    &:hover { text-decoration: underline; }
  }
  .ds-desc {
    font-size: 12px;
    color: $text-secondary;
    margin-top: 4px;
  }
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
