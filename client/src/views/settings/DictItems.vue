<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">字典项管理</h2>
      <el-button type="primary" @click="openDialog()">
        <el-icon><Plus /></el-icon>新增字典项
      </el-button>
    </div>

    <div class="filter-bar">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">字典编码：</span>
          <el-select v-model="filters.dictCode" placeholder="全部" style="width: 200px" clearable>
            <el-option v-for="c in dictCodes" :key="c.dictCode" :label="`${c.dictName} (${c.dictCode})`" :value="c.dictCode" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">关键词：</span>
          <el-input v-model="filters.keyword" placeholder="字典名称/标签" style="width: 200px" clearable @keyup.enter="loadList" />
        </div>
        <div class="filter-item">
          <span class="filter-label">状态：</span>
          <el-select v-model="filters.enabled" placeholder="全部" style="width: 120px" clearable>
            <el-option label="启用" :value="true" />
            <el-option label="停用" :value="false" />
          </el-select>
        </div>
        <el-button type="primary" @click="loadList">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>
    </div>

    <div class="card">
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="dictCode" label="字典编码" width="160" />
        <el-table-column prop="dictName" label="字典名称" width="160" />
        <el-table-column prop="itemValue" label="字典值" width="140" />
        <el-table-column prop="itemLabel" label="字典标签" width="160" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; text-align: right">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑字典项' : '新增字典项'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="字典编码" prop="dictCode">
          <el-input v-model="form.dictCode" placeholder="如：content_status" />
        </el-form-item>
        <el-form-item label="字典名称" prop="dictName">
          <el-input v-model="form.dictName" placeholder="如：内容状态" />
        </el-form-item>
        <el-form-item label="字典值" prop="itemValue">
          <el-input v-model="form.itemValue" placeholder="如：draft" />
        </el-form-item>
        <el-form-item label="字典标签" prop="itemLabel">
          <el-input v-model="form.itemLabel" placeholder="如：草稿" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { settingsApi } from '@/api'

const loading = ref(false)
const tableData = ref([])
const dictCodes = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const formRef = ref()

const filters = reactive({ dictCode: '', keyword: '', enabled: null })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const form = reactive({
  dictCode: '',
  dictName: '',
  itemValue: '',
  itemLabel: '',
  sort: 0,
  enabled: true,
  remark: ''
})
const rules = {
  dictCode: [{ required: true, message: '请输入字典编码', trigger: 'blur' }],
  dictName: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
  itemValue: [{ required: true, message: '请输入字典值', trigger: 'blur' }],
  itemLabel: [{ required: true, message: '请输入字典标签', trigger: 'blur' }]
}

async function loadDictCodes() {
  try {
    dictCodes.value = await settingsApi.dictCodes()
  } catch (e) {}
}

async function loadList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
      dictCode: filters.dictCode || undefined,
      enabled: filters.enabled === null ? undefined : filters.enabled
    }
    const res = await settingsApi.dictList(params)
    tableData.value = res.list
    pagination.total = res.total
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  Object.assign(filters, { dictCode: '', keyword: '', enabled: null })
  pagination.page = 1
  loadList()
}

function openDialog(row) {
  isEdit.value = !!row
  if (row) {
    editId.value = row._id
    Object.assign(form, { ...row })
  } else {
    editId.value = ''
    Object.assign(form, { dictCode: '', dictName: '', itemValue: '', itemLabel: '', sort: 0, enabled: true, remark: '' })
  }
  dialogVisible.value = true
}

async function handleSave() {
  await formRef.value?.validate()
  try {
    if (isEdit.value) {
      await settingsApi.updateDict(editId.value, form)
      ElMessage.success('修改成功')
    } else {
      await settingsApi.createDict(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadDictCodes()
    loadList()
  } catch (e) {}
}

async function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除字典项"${row.itemLabel}"吗?`, '提示', { type: 'warning' }).then(async () => {
    await settingsApi.removeDict(row._id)
    ElMessage.success('删除成功')
    loadDictCodes()
    loadList()
  }).catch(() => {})
}

onMounted(() => {
  loadDictCodes()
  loadList()
})
</script>
