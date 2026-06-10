<template>
  <div class="dictionary-page">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>字典类型</span>
              <el-button type="primary" text @click="handleAddType">新增</el-button>
            </div>
          </template>
          <ul class="type-list">
            <li
              v-for="type in dictTypes"
              :key="type"
              :class="{ active: activeType === type }"
              @click="selectType(type)"
            >
              {{ type }}
            </li>
          </ul>
          <el-empty v-if="dictTypes.length === 0" description="暂无字典类型" :image-size="60" />
        </el-card>
      </el-col>
      <el-col :span="18">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>字典项 - {{ activeType || '请选择类型' }}</span>
              <el-button
                type="primary"
                :disabled="!activeType"
                @click="handleAddItem"
              >
                新增字典项
              </el-button>
            </div>
          </template>

          <el-table :data="dictItems" v-loading="loading" stripe>
            <el-table-column prop="dictLabel" label="标签" width="200" />
            <el-table-column prop="dictValue" label="值" width="200" />
            <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
            <el-table-column prop="sort" label="排序" width="80" />
            <el-table-column prop="enabled" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
                  {{ row.enabled ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" text @click="handleEditItem(row)">编辑</el-button>
                <el-button type="danger" size="small" text @click="handleDeleteItem(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="!activeType" description="请选择左侧字典类型" />
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="itemForm" label-width="100px">
        <el-form-item v-if="isNewType" label="字典类型" required>
          <el-input v-model="itemForm.dictType" placeholder="请输入字典类型，如：service_category" />
        </el-form-item>
        <el-form-item label="标签" required>
          <el-input v-model="itemForm.dictLabel" placeholder="请输入显示标签" />
        </el-form-item>
        <el-form-item label="值" required>
          <el-input v-model="itemForm.dictValue" placeholder="请输入字典值" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="itemForm.description" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="itemForm.sort" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="itemForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getDictionary,
  getDictTypes,
  createDictionaryItem,
  updateDictionaryItem,
  deleteDictionaryItem,
} from '@/api/dictionary'

const loading = ref(false)
const dictTypes = ref([])
const dictItems = ref([])
const activeType = ref('')

const dialogVisible = ref(false)
const dialogTitle = ref('新增字典项')
const submitting = ref(false)
const editingId = ref('')
const isNewType = ref(false)

const itemForm = reactive({
  dictType: '',
  dictLabel: '',
  dictValue: '',
  description: '',
  sort: 0,
  enabled: true,
})

async function loadDictTypes() {
  try {
    const data = await getDictTypes()
    dictTypes.value = data
    if (data.length > 0 && !activeType.value) {
      activeType.value = data[0]
      loadDictItems()
    }
  } catch (e) {}
}

async function loadDictItems() {
  if (!activeType.value) return
  
  loading.value = true
  try {
    const data = await getDictionary({ dictType: activeType.value })
    dictItems.value = data
  } catch (e) {
    dictItems.value = []
  } finally {
    loading.value = false
  }
}

function selectType(type) {
  activeType.value = type
  loadDictItems()
}

function handleAddType() {
  isNewType.value = true
  dialogTitle.value = '新增字典类型'
  editingId.value = ''
  itemForm.dictType = ''
  itemForm.dictLabel = ''
  itemForm.dictValue = ''
  itemForm.description = ''
  itemForm.sort = 0
  itemForm.enabled = true
  dialogVisible.value = true
}

function handleAddItem() {
  isNewType.value = false
  dialogTitle.value = '新增字典项'
  editingId.value = ''
  itemForm.dictType = activeType.value
  itemForm.dictLabel = ''
  itemForm.dictValue = ''
  itemForm.description = ''
  itemForm.sort = 0
  itemForm.enabled = true
  dialogVisible.value = true
}

function handleEditItem(row) {
  isNewType.value = false
  dialogTitle.value = '编辑字典项'
  editingId.value = row._id
  itemForm.dictType = row.dictType
  itemForm.dictLabel = row.dictLabel
  itemForm.dictValue = row.dictValue
  itemForm.description = row.description || ''
  itemForm.sort = row.sort || 0
  itemForm.enabled = row.enabled
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!itemForm.dictType) {
    ElMessage.warning('请输入字典类型')
    return
  }
  if (!itemForm.dictLabel) {
    ElMessage.warning('请输入标签')
    return
  }
  if (!itemForm.dictValue) {
    ElMessage.warning('请输入值')
    return
  }

  submitting.value = true
  try {
    if (editingId.value) {
      await updateDictionaryItem(editingId.value, itemForm)
      ElMessage.success('更新成功')
    } else {
      await createDictionaryItem(itemForm)
      ElMessage.success('创建成功')
      if (isNewType.value) {
        loadDictTypes()
      }
    }
    dialogVisible.value = false
    loadDictItems()
  } catch (e) {
    // 错误已处理
  } finally {
    submitting.value = false
  }
}

function handleDeleteItem(row) {
  ElMessageBox.confirm(`确定要删除「${row.dictLabel}」吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await deleteDictionaryItem(row._id)
      ElMessage.success('删除成功')
      loadDictItems()
    } catch (e) {}
  }).catch(() => {})
}

onMounted(() => {
  loadDictTypes()
})
</script>

<style scoped lang="scss">
.dictionary-page {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .type-list {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      padding: 12px 16px;
      cursor: pointer;
      border-radius: 6px;
      margin-bottom: 4px;
      transition: all 0.3s;

      &:hover {
        background: #f5f7fa;
      }

      &.active {
        background: #ecf5ff;
        color: #409eff;
      }
    }
  }
}
</style>
