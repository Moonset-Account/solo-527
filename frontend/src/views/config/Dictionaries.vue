<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">字典配置</h2>
      <el-alert
        title="集中管理所有下拉选项、分类枚举，避免硬编码在代码中。修改此处即可全局生效。"
        type="info"
        show-icon
        :closable="false"
        style="margin-left: 20px; max-width: 500px"
      />
      <el-button type="primary" @click="showDialog = true">
        <el-icon><Plus /></el-icon>新增字典
      </el-button>
    </div>

    <div class="card-shadow">
      <div class="filter-bar">
        <el-select v-model="filter.type" placeholder="字典类型" clearable style="width: 180px">
          <el-option label="试剂分类" value="reagent_category" />
          <el-option label="试剂单位" value="reagent_unit" />
          <el-option label="危化等级" value="hazardous_level" />
          <el-option label="部门" value="department" />
          <el-option label="实验室" value="laboratory" />
          <el-option label="岗位" value="position" />
          <el-option label="自定义" value="custom" />
        </el-select>
        <el-input v-model="filter.keyword" placeholder="搜索编码/名称" clearable style="width: 220px" />
        <el-button type="primary" @click="loadData">查询</el-button>
      </div>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="code" label="编码" width="180" />
        <el-table-column prop="name" label="名称" width="180" />
        <el-table-column prop="type" label="类型" width="140">
          <template #default="{ row }">{{ typeLabel(row.type) }}</template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column label="字典项">
          <template #default="{ row }">
            <el-tag v-for="item in row.items?.slice(0, 5)" :key="item.value" style="margin-right: 4px">
              {{ item.label }}
            </el-tag>
            <span v-if="row.items?.length > 5" style="color: #909399">+{{ row.items.length - 5 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="生效范围" width="140">
          <template #default="{ row }">
            <span v-if="row.scope?.length">{{ row.scope.join(', ') }}</span>
            <span v-else style="color: #909399">全部</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
              {{ row.enabled ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        style="margin-top: 16px"
        background
        @current-change="loadData"
      />
    </div>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑字典' : '新增字典'" width="700px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="字典编码" prop="code">
              <el-input v-model="form.code" :disabled="isEdit" placeholder="唯一标识，如 reagent_category" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="字典名称" prop="name">
              <el-input v-model="form.name" placeholder="如：试剂分类" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="字典类型" prop="type">
              <el-select v-model="form.type" style="width: 100%">
                <el-option label="试剂分类" value="reagent_category" />
                <el-option label="试剂单位" value="reagent_unit" />
                <el-option label="危化等级" value="hazardous_level" />
                <el-option label="部门" value="department" />
                <el-option label="实验室" value="laboratory" />
                <el-option label="岗位" value="position" />
                <el-option label="自定义" value="custom" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生效范围">
              <el-select v-model="form.scope" multiple placeholder="留空表示全部生效" style="width: 100%">
                <el-option label="门户端" value="portal" />
                <el-option label="管理台" value="admin" />
                <el-option label="配置中心" value="config" />
                <el-option label="维保看板" value="maintenance" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="描述">
              <el-input v-model="form.description" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="字典项" prop="items">
              <div>
                <el-table :data="form.items" border size="small">
                  <el-table-column label="值" width="160">
                    <template #default="{ row }">
                      <el-input v-model="row.value" size="small" />
                    </template>
                  </el-table-column>
                  <el-table-column label="显示名称">
                    <template #default="{ row }">
                      <el-input v-model="row.label" size="small" />
                    </template>
                  </el-table-column>
                  <el-table-column label="排序" width="100">
                    <template #default="{ row }">
                      <el-input-number v-model="row.sort" :min="0" size="small" style="width: 80px" />
                    </template>
                  </el-table-column>
                  <el-table-column label="启用" width="80">
                    <template #default="{ row }">
                      <el-switch v-model="row.enabled" />
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="80">
                    <template #default="{ $index }">
                      <el-button type="danger" link size="small" @click="removeItem($index)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
                <el-button style="margin-top: 8px" size="small" @click="addItem">
                  <el-icon><Plus /></el-icon>添加项
                </el-button>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { configApi } from '@/api'
import type { Dictionary } from '@/types'
import { Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const submitting = ref(false)
const list = ref<Dictionary[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const showDialog = ref(false)
const isEdit = ref(false)
const editId = ref('')

const filter = reactive({ type: '', keyword: '' })

const formRef = ref<FormInstance>()
const form = reactive<any>({
  type: 'custom',
  code: '',
  name: '',
  description: '',
  items: [{ value: '', label: '', sort: 0, enabled: true }],
  scope: [] as string[],
  enabled: true,
})

const rules: FormRules = {
  code: [{ required: true, message: '请输入编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
}

function typeLabel(t: string) {
  const map: Record<string, string> = {
    reagent_category: '试剂分类',
    reagent_unit: '试剂单位',
    hazardous_level: '危化等级',
    department: '部门',
    laboratory: '实验室',
    position: '岗位',
    custom: '自定义',
  }
  return map[t] || t
}

function addItem() {
  form.items.push({ value: '', label: '', sort: form.items.length, enabled: true })
}
function removeItem(i: number) {
  if (form.items.length > 1) form.items.splice(i, 1)
}

function resetForm() {
  Object.assign(form, {
    type: 'custom', code: '', name: '', description: '',
    items: [{ value: '', label: '', sort: 0, enabled: true }],
    scope: [], enabled: true,
  })
}

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: pageSize.value }
    if (filter.type) params.type = filter.type
    if (filter.keyword) params.code = filter.keyword
    const res = await configApi.listDictionaries(params)
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function handleEdit(row: Dictionary) {
  isEdit.value = true
  editId.value = row._id
  Object.assign(form, {
    type: row.type,
    code: row.code,
    name: row.name,
    description: row.description || '',
    items: row.items.length > 0 ? JSON.parse(JSON.stringify(row.items)) : [{ value: '', label: '', sort: 0, enabled: true }],
    scope: row.scope || [],
    enabled: row.enabled,
  })
  showDialog.value = true
}

async function handleDelete(row: Dictionary) {
  try {
    await ElMessageBox.confirm(`确定删除字典 ${row.name}？`, '提示', { type: 'warning' })
    await configApi.deleteDictionary(row._id)
    ElMessage.success('已删除')
    loadData()
  } catch {}
}

async function submitForm() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (isEdit.value) {
        await configApi.updateDictionary(editId.value, form)
        ElMessage.success('更新成功')
      } else {
        await configApi.createDictionary(form)
        ElMessage.success('创建成功')
      }
      showDialog.value = false
      loadData()
    } finally {
      submitting.value = false
    }
  })
}

onMounted(loadData)
</script>
