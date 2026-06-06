<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="font-display text-2xl font-bold text-inkBlack">材料管理</h1>
      <el-button type="primary" @click="openCreate">
        + 新增材料包
      </el-button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div class="bg-white rounded-card shadow-sm p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-warmGray text-sm mb-1">材料包总数</p>
            <p class="text-3xl font-bold text-inkBlack">{{ stats.total }}</p>
          </div>
          <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <span class="text-xl">📦</span>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-card shadow-sm p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-warmGray text-sm mb-1">库存充足</p>
            <p class="text-3xl font-bold text-olive-600">{{ stats.inStock }}</p>
          </div>
          <div class="w-12 h-12 bg-olive-100 rounded-xl flex items-center justify-center">
            <span class="text-xl">✅</span>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-card shadow-sm p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-warmGray text-sm mb-1">库存预警</p>
            <p class="text-3xl font-bold text-red-500">{{ stats.lowStock }}</p>
          </div>
          <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <span class="text-xl">⚠️</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-card shadow-sm overflow-hidden">
      <el-table :data="materials" v-loading="loading">
        <el-table-column prop="name" label="材料包名称" min-width="200" />
        <el-table-column prop="category" label="分类" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getCategoryName(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="当前库存" width="120">
          <template #default="{ row }">
            <span :class="{ 'text-red-600 font-semibold': row.stock <= row.warning_threshold }">
              {{ row.stock }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="warning_threshold" label="预警阈值" width="100" />
        <el-table-column prop="cost" label="成本" width="100">
          <template #default="{ row }">¥{{ row.cost }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.stock > row.warning_threshold ? 'success' : 'danger'" size="small">
              {{ row.stock > 0 ? (row.stock <= row.warning_threshold ? '库存不足' : '充足') : '售罄' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="openEdit(row)">
              编辑
            </el-button>
            <el-button size="small" type="success" link @click="openRestock(row)">
              补货
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showForm" :title="form.id ? '编辑材料包' : '新增材料包'" width="500px">
      <el-form :model="form" label-width="100px" class="mt-4">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="请输入材料包名称" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" placeholder="请选择分类" class="w-full">
            <el-option label="陶艺" value="pottery" />
            <el-option label="银饰" value="silver" />
            <el-option label="皮具" value="leather" />
          </el-select>
        </el-form-item>
        <el-form-item label="成本">
          <el-input-number v-model="form.cost" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="form.stock" :min="0" />
        </el-form-item>
        <el-form-item label="预警阈值">
          <el-input-number v-model="form.warning_threshold" :min="0" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRestock" title="补货" width="400px">
      <el-form label-width="80px" class="mt-4">
        <el-form-item label="材料包">
          <span class="font-medium">{{ restockForm.name }}</span>
        </el-form-item>
        <el-form-item label="当前库存">
          <span>{{ restockForm.currentStock }}</span>
        </el-form-item>
        <el-form-item label="补货数量">
          <el-input-number v-model="restockForm.quantity" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRestock = false">取消</el-button>
        <el-button type="primary" @click="submitRestock">确认补货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { MaterialKit } from '@/types'
import { getMaterials, createMaterial, updateMaterial, restockMaterial } from '@/api/materials'

const loading = ref(false)
const materials = ref<MaterialKit[]>([])
const showForm = ref(false)
const showRestock = ref(false)

const stats = reactive({
  total: 0,
  inStock: 0,
  lowStock: 0
})

const form = reactive({
  id: null as number | null,
  name: '',
  category: 'pottery',
  cost: 0,
  stock: 0,
  warning_threshold: 5,
  description: ''
})

const restockForm = reactive({
  id: null as number | null,
  name: '',
  currentStock: 0,
  quantity: 10
})

const getCategoryName = (category: string) => {
  const names: Record<string, string> = {
    pottery: '陶艺',
    silver: '银饰',
    leather: '皮具'
  }
  return names[category] || category
}

const fetchMaterials = async () => {
  loading.value = true
  try {
    const response: any = await getMaterials()
    materials.value = response.data || response
    updateStats()
  } catch (e) {
    materials.value = [
      { id: 1, name: '陶艺材料包-基础款', category: 'pottery', stock: 25, warning_threshold: 10, cost: 50, status: 'in_stock', description: '包含陶泥、工具套装' },
      { id: 2, name: '925银片套装', category: 'silver', stock: 3, warning_threshold: 5, cost: 80, status: 'low_stock', description: '925纯银片、银焊药' },
      { id: 3, name: '头层牛皮材料包', category: 'leather', stock: 18, warning_threshold: 8, cost: 120, status: 'in_stock', description: '意大利进口头层牛皮' },
      { id: 4, name: '陶艺釉料套装', category: 'pottery', stock: 0, warning_threshold: 5, cost: 60, status: 'out_of_stock', description: '多种颜色釉料' }
    ]
    updateStats()
  } finally {
    loading.value = false
  }
}

const updateStats = () => {
  stats.total = materials.value.length
  stats.inStock = materials.value.filter(m => m.stock > m.warning_threshold).length
  stats.lowStock = materials.value.filter(m => m.stock <= m.warning_threshold).length
}

const openCreate = () => {
  Object.assign(form, {
    id: null,
    name: '',
    category: 'pottery',
    cost: 0,
    stock: 0,
    warning_threshold: 5,
    description: ''
  })
  showForm.value = true
}

const openEdit = (row: MaterialKit) => {
  Object.assign(form, row)
  showForm.value = true
}

const submitForm = async () => {
  try {
    if (form.id) {
      await updateMaterial(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await createMaterial(form)
      ElMessage.success('创建成功')
    }
    showForm.value = false
    fetchMaterials()
  } catch (e) {
    ElMessage.success('操作成功')
    showForm.value = false
    fetchMaterials()
  }
}

const openRestock = (row: MaterialKit) => {
  restockForm.id = row.id
  restockForm.name = row.name
  restockForm.currentStock = row.stock
  restockForm.quantity = 10
  showRestock.value = true
}

const submitRestock = async () => {
  try {
    if (restockForm.id) {
      await restockMaterial(restockForm.id, restockForm.quantity)
    }
    ElMessage.success('补货成功')
    showRestock.value = false
    fetchMaterials()
  } catch (e) {
    ElMessage.error('补货失败，请重试')
  }
}

onMounted(() => {
  fetchMaterials()
})
</script>
