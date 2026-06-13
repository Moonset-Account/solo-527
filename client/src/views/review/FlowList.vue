<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">审稿流程配置</h2>
      <el-button type="primary" @click="openDialog()">
        <el-icon><Plus /></el-icon>新建流程
      </el-button>
    </div>

    <div class="card">
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="name" label="流程名称" min-width="180" />
        <el-table-column label="流程节点" min-width="400">
          <template #default="{ row }">
            <el-steps :active="0" finish-status="success" align-center size="small">
              <el-step v-for="(n, i) in row.nodes" :key="i" :title="n.name" :description="n.reviewers?.map(getUserName).join('、') || '未配置'" />
            </el-steps>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'">{{ row.isActive ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" width="200" show-overflow-tooltip />
        <el-table-column label="创建人" width="100">
          <template #default="{ row }">{{ getUserName(row.creator) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
            <el-button :type="row.isActive ? 'warning' : 'success'" link size="small" @click="toggleActive(row)">
              {{ row.isActive ? '停用' : '启用' }}
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑流程' : '新建流程'" width="700px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="流程名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入流程名称" />
        </el-form-item>
        <el-form-item label="流程描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="流程节点" prop="nodes">
          <div class="nodes-editor">
            <div v-for="(node, idx) in form.nodes" :key="idx" class="node-item">
              <el-input v-model="node.name" placeholder="节点名称" style="width: 160px" />
              <el-select v-model="node.reviewers" multiple placeholder="选择审核人" style="width: 280px">
                <el-option v-for="u in USERS" :key="u.id" :label="u.name" :value="u.id" />
              </el-select>
              <el-input-number v-model="node.order" :min="0" size="small" style="width: 100px" />
              <el-button type="danger" link @click="removeNode(idx)">删除</el-button>
            </div>
            <el-button type="primary" plain @click="addNode" style="width: 100%">
              <el-icon><Plus /></el-icon>添加节点
            </el-button>
          </div>
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
import { reviewApi } from '@/api'
import { USERS } from '@/utils/constants'

const loading = ref(false)
const list = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const formRef = ref()

const form = reactive({
  name: '',
  description: '',
  nodes: [],
  creator: 'u001'
})

const rules = {
  name: [{ required: true, message: '请输入流程名称', trigger: 'blur' }],
  nodes: [{
    validator: (r, v, cb) => {
      if (!v || v.length === 0) cb(new Error('请至少添加一个节点'))
      else cb()
    },
    trigger: 'change'
  }]
}

function getUserName(id) {
  return USERS.find(u => u.id === id)?.name || id
}

async function loadList() {
  loading.value = true
  try {
    list.value = await reviewApi.flowList()
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function openDialog(row) {
  isEdit.value = !!row
  if (row) {
    editId.value = row._id
    form.name = row.name
    form.description = row.description || ''
    form.nodes = (row.nodes || []).map(n => ({ ...n }))
  } else {
    editId.value = ''
    form.name = ''
    form.description = ''
    form.nodes = [{ name: '', reviewers: [], order: 0 }]
  }
  dialogVisible.value = true
}

function addNode() {
  form.nodes.push({ name: '', reviewers: [], order: form.nodes.length })
}

function removeNode(idx) {
  form.nodes.splice(idx, 1)
}

async function handleSave() {
  await formRef.value?.validate()
  try {
    if (isEdit.value) {
      await reviewApi.updateFlow(editId.value, form)
      ElMessage.success('修改成功')
    } else {
      await reviewApi.createFlow(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadList()
  } catch (e) {}
}

async function toggleActive(row) {
  await reviewApi.updateFlow(row._id, { isActive: !row.isActive })
  ElMessage.success('操作成功')
  loadList()
}

async function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除流程"${row.name}"吗?`, '提示', {
    type: 'warning'
  }).then(async () => {
    await reviewApi.removeFlow(row._id)
    ElMessage.success('删除成功')
    loadList()
  }).catch(() => {})
}

onMounted(loadList)
</script>

<style scoped lang="scss">
.nodes-editor {
  width: 100%;
  .node-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
}
</style>
