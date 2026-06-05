<template>
  <div>
    <el-card shadow="never">
      <div class="flex items-center justify-between mb-4">
        <div class="text-lg font-medium">柜位管理</div>
        <el-button type="primary" @click="showAdd = true" v-if="isAdmin">
          <el-icon class="mr-1"><Plus /></el-icon>
          新增柜位
        </el-button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="cab in cabinets" :key="cab.id" class="p-4 border rounded-lg hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-2">
            <div class="text-lg font-bold text-blue-600">{{ cab.code }}</div>
            <el-tag :type="cabinetTypeColor(cab.type)" size="small">{{ cabinetTypeText(cab.type) }}</el-tag>
          </div>
          <div class="text-sm text-gray-600 mb-1">位置：{{ cab.location }}</div>
          <div v-if="cab.temperature" class="text-sm text-gray-600 mb-2">温度：{{ cab.temperature }}°C</div>
          <div class="text-sm text-gray-500">存储批次：{{ cab.batches_count || 0 }}</div>
          <div class="mt-3 pt-3 border-t flex gap-2">
            <el-button type="primary" link size="small" @click="editCabinet(cab)" v-if="isAdmin">编辑</el-button>
            <el-button type="danger" link size="small" @click="deleteCabinet(cab)" v-if="isAdmin">删除</el-button>
          </div>
        </div>
      </div>
    </el-card>
    
    <el-dialog v-model="showAdd" :title="editing ? '编辑柜位' : '新增柜位'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="柜位编号">
          <el-input v-model="form.code" placeholder="如: F-001" />
        </el-form-item>
        <el-form-item label="柜位类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="普通柜" value="GENERAL" />
            <el-option label="易燃品柜" value="FLAMMABLE" />
            <el-option label="腐蚀品柜" value="CORROSIVE" />
            <el-option label="毒品柜" value="TOXIC" />
            <el-option label="冷藏柜" value="REFRIGERATOR" />
            <el-option label="冷冻柜" value="FREEZER" />
          </el-select>
        </el-form-item>
        <el-form-item label="位置">
          <el-input v-model="form.location" placeholder="如: 实验室A区" />
        </el-form-item>
        <el-form-item label="温度(°C)">
          <el-input-number v-model="form.temperature" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" @click="saveCabinet">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import api from '@/api'
import { Plus } from '@element-plus/icons-vue'

const userStore = useUserStore()
const isAdmin = ref(userStore.isAdmin)
const cabinets = ref<any[]>([])
const showAdd = ref(false)
const editing = ref<any>(null)

const form = reactive({
  code: '',
  type: 'GENERAL',
  location: '',
  temperature: null as number | null,
  description: ''
})

function cabinetTypeText(type: string) {
  const map: Record<string, string> = {
    GENERAL: '普通柜',
    FLAMMABLE: '易燃品',
    CORROSIVE: '腐蚀品',
    TOXIC: '毒品',
    REFRIGERATOR: '冷藏',
    FREEZER: '冷冻'
  }
  return map[type] || type
}

function cabinetTypeColor(type: string) {
  const map: Record<string, string> = {
    GENERAL: '',
    FLAMMABLE: 'danger',
    CORROSIVE: 'warning',
    TOXIC: 'danger',
    REFRIGERATOR: 'primary',
    FREEZER: 'info'
  }
  return map[type] || ''
}

async function loadCabinets() {
  try {
    const data = await api.get('/storage/cabinets') as any
    cabinets.value = data || []
  } catch (e) {
    console.error(e)
  }
}

function editCabinet(cab: any) {
  editing.value = cab
  Object.assign(form, {
    code: cab.code,
    type: cab.type,
    location: cab.location,
    temperature: cab.temperature,
    description: cab.description || ''
  })
  showAdd.value = true
}

async function saveCabinet() {
  try {
    if (editing.value) {
      await api.put(`/storage/cabinets/${editing.value.id}`, form)
      ElMessage.success('更新成功')
    } else {
      await api.post('/storage/cabinets', form)
      ElMessage.success('创建成功')
    }
    showAdd.value = false
    editing.value = null
    loadCabinets()
  } catch (e) {
    console.error(e)
  }
}

async function deleteCabinet(cab: any) {
  try {
    await ElMessageBox.confirm(`确定删除柜位 "${cab.code}" 吗？`, '确认删除', { type: 'warning' })
    await api.delete(`/storage/cabinets/${cab.id}`)
    ElMessage.success('删除成功')
    loadCabinets()
  } catch (e) {}
}

onMounted(() => {
  loadCabinets()
})
</script>
