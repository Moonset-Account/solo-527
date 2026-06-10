<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">服务配置</h2>
      <el-button type="primary" @click="showEdit = true"><el-icon><Plus /></el-icon> 新增服务</el-button>
    </div>
    <div class="section-card">
      <div class="card-body">
        <div class="search-bar">
          <el-tag type="success">服务项目总数：{{ list.length }}</el-tag>
        </div>
        <el-table :data="list" v-loading="loading" stripe style="width:100%">
          <el-table-column label="服务项目" min-width="220">
            <template #default="{ row }">
              <div style="font-weight:500">{{ row.name }}</div>
              <div style="font-size:12px;color:#909399">编码：{{ row.code }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="服务描述" min-width="240" show-overflow-tooltip />
          <el-table-column label="时长" width="120">
            <template #default="{ row }">
              <el-tag size="small" effect="light">{{ row.duration_minutes }} 分钟</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="价格" width="120">
            <template #default="{ row }">
              <span style="font-size:16px;font-weight:700;color:#2ab99f">¥{{ Number(row.price).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="容量" width="100">
            <template #default="{ row }">
              <el-tag :type="row.capacity > 1 ? 'warning' : 'success'" size="small" effect="light">
                每时段 {{ row.capacity }} 人
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-switch v-model="row.is_active" @change="() => toggleActive(row)" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="warning" size="small" @click="edit(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog v-model="showEdit" :title="editing.id ? '编辑服务' : '新增服务'" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="editing" :rules="formRules" label-width="100px">
        <el-form-item label="服务名称" prop="name"><el-input v-model="editing.name" maxlength="100" /></el-form-item>
        <el-form-item label="服务编码" prop="code"><el-input v-model="editing.code" maxlength="50" placeholder="英文编码，如 SCALING_01" /></el-form-item>
        <el-form-item label="服务描述">
          <el-input v-model="editing.description" type="textarea" :rows="3" maxlength="500" />
        </el-form-item>
        <el-form-item label="服务时长(分钟)" prop="durationMinutes">
          <el-input-number v-model="editing.durationMinutes" :min="15" :max="480" :step="15" />
        </el-form-item>
        <el-form-item label="服务价格(元)" prop="price">
          <el-input-number v-model="editing.price" :min="0" :precision="2" :step="10" />
        </el-form-item>
        <el-form-item label="时段容量(人)" prop="capacity">
          <el-input-number v-model="editing.capacity" :min="1" :max="20" />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="editing.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitEdit">确认保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getServiceList, createService, updateService, deleteService } from '@/api/service'

const loading = ref(false)
const submitting = ref(false)
const showEdit = ref(false)
const formRef = ref<FormInstance>()
const list = ref<any[]>([])

const editing = reactive<any>({ id: null, name: '', code: '', description: '', durationMinutes: 30, price: 0, capacity: 1, isActive: true })
const formRules: FormRules = {
  name: [{ required: true, message: '请输入服务名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入服务编码', trigger: 'blur' }],
  durationMinutes: [{ required: true, message: '请设置服务时长', trigger: 'blur' }],
  price: [{ required: true, message: '请设置价格', trigger: 'blur' }],
  capacity: [{ required: true, message: '请设置容量', trigger: 'blur' }],
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getServiceList()
    list.value = res.data
  } finally { loading.value = false }
}

const toggleActive = async (row: any) => {
  try {
    await updateService(row.id, { isActive: row.is_active })
    ElMessage.success('状态已更新')
  } catch (_) { row.is_active = !row.is_active }
}
const edit = (row: any) => {
  editing.id = row.id
  editing.name = row.name
  editing.code = row.code
  editing.description = row.description || ''
  editing.durationMinutes = row.duration_minutes
  editing.price = Number(row.price)
  editing.capacity = row.capacity
  editing.isActive = row.is_active
  showEdit.value = true
}
const submitEdit = async () => {
  await formRef.value?.validate()
  submitting.value = true
  try {
    if (editing.id) {
      await updateService(editing.id, { ...editing })
      ElMessage.success('更新成功')
    } else {
      await createService({ ...editing })
      ElMessage.success('创建成功')
    }
    showEdit.value = false
    fetchList()
  } finally { submitting.value = false }
}
const remove = async (row: any) => {
  await ElMessageBox.confirm(`确认删除服务「${row.name}」吗？`, '提示', { type: 'warning' })
  await deleteService(row.id)
  ElMessage.success('已删除')
  fetchList()
}
onMounted(fetchList)
</script>
