<template>
  <div>
    <el-card shadow="never">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <el-input
            v-model="searchQuery"
            placeholder="搜索试剂名称、CAS号"
            clearable
            style="width: 300px"
            @clear="loadReagents"
            @keyup.enter="loadReagents"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select v-model="filterHazard" placeholder="危险等级" clearable style="width: 150px" @change="loadReagents">
            <el-option label="无危害" value="NONE" />
            <el-option label="低危" value="LOW" />
            <el-option label="中危" value="MEDIUM" />
            <el-option label="高危" value="HIGH" />
            <el-option label="极危" value="EXTREME" />
          </el-select>
          <el-checkbox v-model="filterLowStock" @change="loadReagents">低库存</el-checkbox>
          <el-checkbox v-model="filterExpiring" @change="loadReagents">即将过期</el-checkbox>
        </div>
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon class="mr-1"><Plus /></el-icon>
          新增试剂
        </el-button>
      </div>
      
      <el-table :data="reagents" v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column label="试剂名称" min-width="180">
          <template #default="{ row }">
            <div class="flex items-center">
              <span class="font-medium">{{ row.name }}</span>
              <el-tag v-if="row.requires_double_confirm" type="danger" size="small" class="ml-2">需双人确认</el-tag>
            </div>
            <div class="text-xs text-gray-500">CAS: {{ row.cas_number || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column label="危险等级" width="100">
          <template #default="{ row }">
            <el-tag :class="`bg-hazard-level-${row.hazard_level?.toLowerCase()}`" size="small">
              {{ row.hazard_level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="总库存" width="100">
          <template #default="{ row }">
            <span :class="{ 'text-orange-500 font-medium': isLowStock(row) }">
              {{ row.total_quantity || 0 }} {{ row.unit }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="min_stock" label="最低库存" width="100" />
        <el-table-column label="批次" width="80">
          <template #default="{ row }">
            {{ row.batches_count || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="$router.push(`/reagents/${row.id}`)">详情</el-button>
            <el-button type="primary" link @click="editReagent(row)">编辑</el-button>
            <el-button v-if="isAdmin" type="danger" link @click="deleteReagent(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="mt-4 flex justify-center">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadReagents"
          @current-change="loadReagents"
        />
      </div>
    </el-card>
    
    <el-dialog v-model="showAddDialog" :title="editingReagent ? '编辑试剂' : '新增试剂'" width="600px">
      <el-form :model="reagentForm" label-width="100px">
        <el-form-item label="试剂名称">
          <el-input v-model="reagentForm.name" placeholder="输入试剂名称" />
        </el-form-item>
        <el-form-item label="CAS号">
          <el-input v-model="reagentForm.cas_number" placeholder="输入CAS号" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="reagentForm.category" placeholder="如：酸类、碱类、溶剂" />
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="reagentForm.unit" placeholder="如: g, mL, L" />
        </el-form-item>
        <el-form-item label="危险等级">
          <el-select v-model="reagentForm.hazard_level" placeholder="选择危险等级" style="width: 100%">
            <el-option label="无危害" value="NONE" />
            <el-option label="低危" value="LOW" />
            <el-option label="中危" value="MEDIUM" />
            <el-option label="高危" value="HIGH" />
            <el-option label="极危" value="EXTREME" />
          </el-select>
        </el-form-item>
        <el-form-item label="最低库存">
          <el-input-number v-model="reagentForm.min_stock" :min="0" :step="1" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="reagentForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="MSDS链接">
          <el-input v-model="reagentForm.msds_url" placeholder="MSDS文档链接" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveReagent">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import api from '@/api'
import { Search, Plus } from '@element-plus/icons-vue'

const userStore = useUserStore()
const isAdmin = ref(userStore.isAdmin)

const loading = ref(false)
const reagents = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const searchQuery = ref('')
const filterHazard = ref('')
const filterLowStock = ref(false)
const filterExpiring = ref(false)

const showAddDialog = ref(false)
const editingReagent = ref<any>(null)
const reagentForm = reactive({
  name: '',
  cas_number: '',
  category: '',
  unit: 'g',
  hazard_level: 'LOW',
  min_stock: 100,
  description: '',
  msds_url: ''
})

function isLowStock(row: any) {
  return (row.total_quantity || 0) <= (row.min_stock || 0)
}

function handleSelectionChange(val: any[]) {
  console.log(val)
}

async function loadReagents() {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      limit: pageSize.value,
      search: searchQuery.value
    }
    if (filterHazard.value) {
      params.hazard_level = filterHazard.value
    }
    if (filterLowStock.value) {
      params.low_stock_only = true
    }
    if (filterExpiring.value) {
      params.expiring_only = true
    }
    
    const data = await api.get('/reagents', { params }) as any
    reagents.value = data.items || data || []
    total.value = data.total || data.length || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function editReagent(row: any) {
  editingReagent.value = row
  Object.assign(reagentForm, {
    name: row.name,
    cas_number: row.cas_number || '',
    category: row.category || '',
    unit: row.unit || 'g',
    hazard_level: row.hazard_level,
    min_stock: row.min_stock,
    description: row.description || '',
    msds_url: row.msds_url || ''
  })
  showAddDialog.value = true
}

async function saveReagent() {
  try {
    if (editingReagent.value) {
      await api.put(`/reagents/${editingReagent.value.id}`, reagentForm)
      ElMessage.success('更新成功')
    } else {
      await api.post('/reagents', reagentForm)
      ElMessage.success('创建成功')
    }
    showAddDialog.value = false
    loadReagents()
  } catch (e) {
    console.error(e)
  }
}

async function deleteReagent(row: any) {
  try {
    await ElMessageBox.confirm(`确定要删除试剂 "${row.name}" 吗？`, '确认删除', { type: 'warning' })
    await api.delete(`/reagents/${row.id}`)
    ElMessage.success('删除成功')
    loadReagents()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadReagents()
})
</script>
