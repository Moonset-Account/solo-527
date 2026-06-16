<template>
  <div class="process-page">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>流程定义列表</span>
          <el-button type="primary" @click="openDefDialog()">新建流程定义</el-button>
        </div>
      </template>
      <el-table :data="definitions" stripe style="width: 100%">
        <el-table-column prop="name" label="名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="selectDefinition(row)">查看节点</el-button>
            <el-button type="warning" link size="small" @click="openDefDialog(row)">编辑</el-button>
            <el-popconfirm title="确认删除?" @confirm="handleDeleteDef(row.id)">
              <template #reference>
                <el-button type="danger" link size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card v-if="selectedDef" shadow="hover" class="node-section">
      <template #header>
        <div class="card-header">
          <span>节点配置 - {{ selectedDef.name }}</span>
          <el-button type="primary" @click="openNodeDialog()">添加节点</el-button>
        </div>
      </template>
      <ProcessFlowChart :nodes="nodes" />
      <div class="node-list">
        <div
          v-for="(node, index) in nodes"
          :key="node.id"
          class="node-drag-item"
          draggable="true"
          @dragstart="onDragStart(index, $event)"
          @dragover.prevent
          @drop="onDrop(index)"
        >
          <ProcessNodeCard
            :node="node"
            @edit="openNodeDialog"
            @delete="handleDeleteNode"
          />
        </div>
      </div>
    </el-card>

    <el-dialog v-model="defDialogVisible" :title="editingDefId ? '编辑流程定义' : '新建流程定义'" width="500px">
      <el-form :model="defForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="defForm.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="defForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="defDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveDef">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="nodeDialogVisible" :title="editingNodeId ? '编辑节点' : '添加节点'" width="560px">
      <el-form :model="nodeForm" label-width="100px">
        <el-form-item label="节点名称">
          <el-input v-model="nodeForm.name" />
        </el-form-item>
        <el-form-item label="顺序号">
          <el-input-number v-model="nodeForm.order" :min="1" />
        </el-form-item>
        <el-form-item label="分配角色">
          <el-select v-model="nodeForm.roleId" placeholder="请选择角色" clearable style="width: 100%">
            <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="分配类型">
          <el-radio-group v-model="nodeForm.assignType">
            <el-radio value="ROLE">按角色</el-radio>
            <el-radio value="SPECIFIC_USER">指定人</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="nodeForm.assignType === 'SPECIFIC_USER'" label="指定人">
          <el-select v-model="nodeForm.specificUserId" placeholder="请选择人员" clearable style="width: 100%">
            <el-option v-for="user in users" :key="user.id" :label="user.realName" :value="user.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="自动提醒">
          <el-switch v-model="nodeForm.autoReminder" />
        </el-form-item>
        <el-form-item v-if="nodeForm.autoReminder" label="提醒时间">
          <div style="display: flex; align-items: center; gap: 8px">
            <el-input-number v-model="nodeForm.reminderHours" :min="1" :max="720" />
            <span>小时</span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="nodeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveNode">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  listDefinitions, createDefinition, updateDefinition, deleteDefinition,
  getNodes, addNode, updateNode, deleteNode, getUsers
} from '@/api/process'
import { getRoles } from '@/api/role'
import ProcessNodeCard from '@/components/process/ProcessNodeCard.vue'
import ProcessFlowChart from '@/components/process/ProcessFlowChart.vue'

const definitions = ref([])
const selectedDef = ref(null)
const nodes = ref([])
const roles = ref([])
const users = ref([])

const defDialogVisible = ref(false)
const nodeDialogVisible = ref(false)
const editingDefId = ref(null)
const editingNodeId = ref(null)

const defForm = ref({ name: '', description: '' })
const nodeForm = ref({
  name: '',
  order: 1,
  roleId: null,
  assignType: 'ROLE',
  specificUserId: null,
  autoReminder: false,
  reminderHours: 24
})

const dragIndex = ref(null)

const statusLabel = (s) => s === 1 ? '启用' : '停用'
const statusTagType = (s) => s === 1 ? 'success' : 'danger'

async function fetchDefinitions() {
  try {
    const res = await listDefinitions()
    definitions.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

async function fetchNodes() {
  if (!selectedDef.value) return
  try {
    const res = await getNodes(selectedDef.value.id)
    const list = res.data || []
    nodes.value = list
      .sort((a, b) => a.order - b.order)
      .map(n => ({
        ...n,
        roleName: roles.value.find(r => r.id === n.roleId)?.name || ''
      }))
  } catch (e) {
    console.error(e)
  }
}

async function fetchRoles() {
  try {
    const res = await getRoles()
    roles.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

async function fetchUsers() {
  try {
    const res = await getUsers()
    users.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

function selectDefinition(row) {
  selectedDef.value = row
  fetchNodes()
}

function openDefDialog(row) {
  if (row) {
    editingDefId.value = row.id
    defForm.value = { name: row.name, description: row.description }
  } else {
    editingDefId.value = null
    defForm.value = { name: '', description: '' }
  }
  defDialogVisible.value = true
}

async function handleSaveDef() {
  try {
    if (editingDefId.value) {
      await updateDefinition(editingDefId.value, defForm.value)
      ElMessage.success('更新成功')
    } else {
      await createDefinition(defForm.value)
      ElMessage.success('创建成功')
    }
    defDialogVisible.value = false
    fetchDefinitions()
  } catch (e) {
    console.error(e)
  }
}

async function handleDeleteDef(id) {
  try {
    await deleteDefinition(id)
    ElMessage.success('删除成功')
    if (selectedDef.value?.id === id) {
      selectedDef.value = null
      nodes.value = []
    }
    fetchDefinitions()
  } catch (e) {
    console.error(e)
  }
}

function openNodeDialog(row) {
  if (row) {
    editingNodeId.value = row.id
    nodeForm.value = {
      name: row.name,
      order: row.order,
      roleId: row.roleId,
      assignType: row.assignType || 'ROLE',
      specificUserId: row.specificUserId,
      autoReminder: row.autoReminder || false,
      reminderHours: row.reminderHours || 24
    }
  } else {
    editingNodeId.value = null
    nodeForm.value = {
      name: '',
      order: nodes.value.length + 1,
      roleId: null,
      assignType: 'ROLE',
      specificUserId: null,
      autoReminder: false,
      reminderHours: 24
    }
  }
  nodeDialogVisible.value = true
}

async function handleSaveNode() {
  if (!selectedDef.value) return
  try {
    if (editingNodeId.value) {
      await updateNode(editingNodeId.value, nodeForm.value)
      ElMessage.success('更新成功')
    } else {
      await addNode(selectedDef.value.id, nodeForm.value)
      ElMessage.success('添加成功')
    }
    nodeDialogVisible.value = false
    fetchNodes()
  } catch (e) {
    console.error(e)
  }
}

async function handleDeleteNode(node) {
  if (!selectedDef.value) return
  try {
    await deleteNode(node.id)
    ElMessage.success('删除成功')
    fetchNodes()
  } catch (e) {
    console.error(e)
  }
}

function onDragStart(index, event) {
  dragIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
}

function onDrop(index) {
  if (dragIndex.value === null || dragIndex.value === index) return
  const list = [...nodes.value]
  const [moved] = list.splice(dragIndex.value, 1)
  list.splice(index, 0, moved)
  list.forEach((n, i) => {
    n.order = i + 1
  })
  nodes.value = list
  dragIndex.value = null
  saveNodeOrders()
}

async function saveNodeOrders() {
  if (!selectedDef.value) return
  try {
    await Promise.all(
      nodes.value.map(n =>
        updateNode(n.id, {
          name: n.name,
          order: n.order,
          roleId: n.roleId,
          assignType: n.assignType,
          specificUserId: n.specificUserId,
          autoReminder: n.autoReminder,
          reminderHours: n.reminderHours
        })
      )
    )
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchDefinitions()
  fetchRoles()
  fetchUsers()
})
</script>

<style scoped>
.process-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.node-section {
  margin-top: 20px;
}

.node-list {
  margin-top: 16px;
}

.node-drag-item {
  transition: transform 0.2s;
}

.node-drag-item:active {
  opacity: 0.7;
}
</style>
