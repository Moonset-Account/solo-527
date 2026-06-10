<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">物料齐套</h2>
      <div v-if="canManage">
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          新增物料
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon primary">
            <el-icon><Goods /></el-icon>
          </div>
          <div class="stat-content">
            <div class="label">物料总数</div>
            <div class="value">{{ stats.total }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon warning">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-content">
            <div class="label">库存预警</div>
            <div class="value">{{ stats.lowStock }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon success">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="label">齐套工单</div>
            <div class="value">{{ stats.readyOrders }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon danger">
            <el-icon><CircleClose /></el-icon>
          </div>
          <div class="stat-content">
            <div class="label">缺料工单</div>
            <div class="value">{{ stats.shortageOrders }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" style="margin-top: 20px">
      <el-tab-pane label="物料清单" name="materials">
        <div class="filter-bar">
          <el-form :inline="true" :model="filters">
            <el-form-item label="关键词">
              <el-input v-model="filters.keyword" placeholder="编码/名称/规格" clearable style="width: 200px" />
            </el-form-item>
            <el-form-item>
              <el-checkbox v-model="filters.lowStock">仅显示库存预警</el-checkbox>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadMaterials">查询</el-button>
              <el-button @click="resetFilters">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="table-container">
          <el-table :data="materialList" v-loading="loading" stripe>
            <el-table-column prop="materialCode" label="物料编码" width="120" />
            <el-table-column prop="materialName" label="物料名称" min-width="150" />
            <el-table-column prop="specification" label="规格型号" width="150" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column label="库存数量" width="120" align="right">
              <template #default="{ row }">
                <span :class="{ 'text-danger': row.stockQuantity <= row.safetyStock }">
                  {{ row.stockQuantity }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="safetyStock" label="安全库存" width="100" align="right" />
            <el-table-column prop="supplier" label="供应商" width="150" />
            <el-table-column prop="unitPrice" label="单价" width="100" align="right">
              <template #default="{ row }">¥{{ row.unitPrice?.toFixed(2) || '-' }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.stockQuantity <= row.safetyStock ? 'danger' : 'success'" size="small">
                  {{ row.stockQuantity <= row.safetyStock ? '库存不足' : '正常' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right" v-if="canManage">
              <template #default="{ row }">
                <el-button type="primary" link @click="openEditDialog(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination">
            <el-pagination
              v-model:current-page="materialPagination.page"
              v-model:page-size="materialPagination.perPage"
              :page-sizes="[10, 20, 50, 100]"
              :total="materialPagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="loadMaterials"
              @current-change="loadMaterials"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="工单齐套检查" name="readiness">
        <div class="filter-bar">
          <el-form :inline="true">
            <el-form-item label="选择工单">
              <el-select v-model="selectedWorkOrder" filterable placeholder="请选择工单" style="width: 300px">
                <el-option
                  v-for="order in workOrderList"
                  :key="order.id"
                  :label="`${order.orderNo} - ${order.productName}`"
                  :value="order.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="checkReadiness">查询</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div v-if="readinessData" class="readiness-card">
          <el-card>
            <div class="readiness-header">
              <div class="readiness-info">
                <span class="label">齐套状态</span>
                <el-tag :type="readinessData.isAllReady ? 'success' : 'warning'" size="large">
                  {{ readinessData.isAllReady ? '全部齐套' : '存在缺料' }}
                </el-tag>
              </div>
              <div class="readiness-info">
                <span class="label">齐套率</span>
                <span class="value">{{ readinessData.readinessRate }}%</span>
              </div>
              <div class="readiness-info">
                <span class="label">已齐套</span>
                <span class="value">{{ readinessData.readyCount }}/{{ readinessData.totalCount }}</span>
              </div>
            </div>
          </el-card>

          <el-card style="margin-top: 20px">
            <template #header>
              <span>物料明细</span>
            </template>
            <el-table :data="workOrderMaterials || []" size="small">
              <el-table-column prop="material.materialCode" label="物料编码" width="120" />
              <el-table-column prop="material.materialName" label="物料名称" />
              <el-table-column prop="material.specification" label="规格" width="120" />
              <el-table-column prop="material.unit" label="单位" width="80" />
              <el-table-column prop="requiredQuantity" label="需求数量" width="100" align="right" />
              <el-table-column prop="allocatedQuantity" label="已分配" width="100" align="right" />
              <el-table-column prop="material.stockQuantity" label="当前库存" width="100" align="right" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.isReady ? 'success' : 'warning'" size="small">
                    {{ row.isReady ? '已齐套' : '缺料' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="物料编码" prop="materialCode">
          <el-input v-model="formData.materialCode" />
        </el-form-item>
        <el-form-item label="物料名称" prop="materialName">
          <el-input v-model="formData.materialName" />
        </el-form-item>
        <el-form-item label="规格型号">
          <el-input v-model="formData.specification" />
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="formData.unit" />
        </el-form-item>
        <el-form-item label="库存数量" prop="stockQuantity">
          <el-input-number v-model="formData.stockQuantity" :min="0" />
        </el-form-item>
        <el-form-item label="安全库存">
          <el-input-number v-model="formData.safetyStock" :min="0" />
        </el-form-item>
        <el-form-item label="供应商">
          <el-input v-model="formData.supplier" />
        </el-form-item>
        <el-form-item label="单价">
          <el-input-number v-model="formData.unitPrice" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remarks" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { materialApi, workOrderApi } from '@/api/modules'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const canManage = computed(() => userStore.canManage)

const activeTab = ref('materials')
const loading = ref(false)
const submitting = ref(false)

const stats = reactive({
  total: 0,
  lowStock: 0,
  readyOrders: 0,
  shortageOrders: 0,
})

const filters = reactive({
  keyword: '',
  lowStock: false,
})

const materialList = ref([])
const materialPagination = reactive({
  page: 1,
  perPage: 20,
  total: 0,
})

const workOrderList = ref([])
const selectedWorkOrder = ref(null)
const readinessData = ref(null)
const workOrderMaterials = ref([])

const dialogVisible = ref(false)
const dialogTitle = computed(() => (isEdit.value ? '编辑物料' : '新增物料'))
const isEdit = ref(false)
const formRef = ref(null)
const formData = reactive({
  id: null,
  materialCode: '',
  materialName: '',
  specification: '',
  unit: '',
  stockQuantity: 0,
  safetyStock: 0,
  supplier: '',
  unitPrice: 0,
  remarks: '',
})

const formRules = {
  materialCode: [{ required: true, message: '请输入物料编码', trigger: 'blur' }],
  materialName: [{ required: true, message: '请输入物料名称', trigger: 'blur' }],
  stockQuantity: [{ required: true, message: '请输入库存数量', trigger: 'blur' }],
}

async function loadMaterials() {
  loading.value = true
  try {
    const params = {
      page: materialPagination.page,
      perPage: materialPagination.perPage,
      keyword: filters.keyword,
      lowStock: filters.lowStock,
    }
    const res = await materialApi.list(params)
    materialList.value = res.data.data
    materialPagination.total = res.data.total || res.data.data?.length || 0
    stats.total = res.data.total || materialList.value.length
    stats.lowStock = materialList.value.filter((m) => m.stockQuantity <= m.safetyStock).length
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.lowStock = false
  materialPagination.page = 1
  loadMaterials()
}

async function loadWorkOrders() {
  try {
    const res = await workOrderApi.list({ perPage: 100 })
    workOrderList.value = res.data.data
  } catch (e) {}
}

async function checkReadiness() {
  if (!selectedWorkOrder.value) {
    ElMessage.warning('请先选择工单')
    return
  }
  try {
    const [readinessRes, materialsRes] = await Promise.all([
      materialApi.checkReadiness(selectedWorkOrder.value),
      workOrderApi.getMaterials(selectedWorkOrder.value),
    ])
    readinessData.value = readinessRes.data
    workOrderMaterials.value = materialsRes.data
  } catch (e) {}
}

function openCreateDialog() {
  isEdit.value = false
  Object.assign(formData, {
    id: null,
    materialCode: '',
    materialName: '',
    specification: '',
    unit: '',
    stockQuantity: 0,
    safetyStock: 0,
    supplier: '',
    unitPrice: 0,
    remarks: '',
  })
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  Object.assign(formData, {
    id: row.id,
    materialCode: row.materialCode,
    materialName: row.materialName,
    specification: row.specification || '',
    unit: row.unit || '',
    stockQuantity: row.stockQuantity,
    safetyStock: row.safetyStock,
    supplier: row.supplier || '',
    unitPrice: row.unitPrice || 0,
    remarks: row.remarks || '',
  })
  dialogVisible.value = true
}

async function submitForm() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitting.value = true

    if (isEdit.value) {
      await materialApi.update(formData.id, formData)
      ElMessage.success('物料更新成功')
    } else {
      await materialApi.create(formData)
      ElMessage.success('物料创建成功')
    }

    dialogVisible.value = false
    loadMaterials()
  } catch (e) {
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadMaterials()
  loadWorkOrders()
})
</script>

<style scoped>
.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
}

.stat-icon.primary { background: linear-gradient(135deg, #667eea, #764ba2); }
.stat-icon.warning { background: linear-gradient(135deg, #f6d365, #fda085); }
.stat-icon.success { background: linear-gradient(135deg, #a8edea, #fed6e3); color: #67c23a; }
.stat-icon.danger { background: linear-gradient(135deg, #ff9a9e, #fecfef); color: #f56c6c; }

.stat-content .label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-content .value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.text-danger {
  color: #f56c6c;
  font-weight: bold;
}

.readiness-card {
  margin-top: 20px;
}

.readiness-header {
  display: flex;
  gap: 40px;
}

.readiness-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.readiness-info .label {
  font-size: 14px;
  color: #909399;
}

.readiness-info .value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
