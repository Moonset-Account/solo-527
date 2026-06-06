<template>
  <div class="tools-page">
    <div class="page-header">
      <h1 class="page-title">公共工具</h1>
      <div class="header-actions">
        <el-button v-if="isAdmin" type="primary" :icon="Plus" @click="showAddTool = true">
          新增工具
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="14">
        <el-card class="card-wrapper">
          <div class="filter-bar">
            <el-select v-model="filterCategory" placeholder="分类筛选" clearable style="width: 150px">
              <el-option label="园艺工具" value="gardening" />
              <el-option label="浇水工具" value="watering" />
              <el-option label="收割工具" value="harvesting" />
              <el-option label="防护工具" value="protection" />
              <el-option label="其他" value="other" />
            </el-select>
            <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 150px">
              <el-option label="可用" value="available" />
              <el-option label="使用中" value="in_use" />
              <el-option label="维护中" value="maintenance" />
              <el-option label="损坏" value="damaged" />
            </el-select>
          </div>

          <el-table :data="filteredTools" stripe>
            <el-table-column prop="name" label="工具名称" width="150" />
            <el-table-column prop="category" label="分类" width="100">
              <template #default="{ row }">
                {{ getCategoryText(row.category) }}
              </template>
            </el-table-column>
            <el-table-column label="数量" width="120">
              <template #default="{ row }">
                {{ row.availableQuantity }} / {{ row.totalQuantity }}
              </template>
            </el-table-column>
            <el-table-column prop="location" label="存放位置" width="120" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button 
                  v-if="row.status === 'available' && row.availableQuantity > 0" 
                  type="primary" size="small" 
                  @click="borrowTool(row)"
                >
                  借用
                </el-button>
                <el-button v-if="isAdmin" type="warning" size="small" @click="setMaintenance(row)">
                  维护
                </el-button>
                <el-button size="small" @click="viewToolDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card class="card-wrapper">
          <template #header>
            <div class="card-header">
              <span>我的借用</span>
              <el-badge :value="activeBorrows.length" class="item" />
            </div>
          </template>
          <div class="borrow-list">
            <div v-if="myBorrows.length === 0" class="empty">
              <el-empty description="暂无借用记录" :image-size="80" />
            </div>
            <div v-for="borrow in myBorrows" :key="borrow.id" class="borrow-item">
              <div class="borrow-info">
                <div class="borrow-tool">{{ borrow.toolName }}</div>
                <div class="borrow-meta">
                  <span>数量：{{ borrow.quantity }}</span>
                  <span>借用：{{ formatDate(borrow.borrowTime) }}</span>
                </div>
              </div>
              <div class="borrow-actions">
                <el-tag :type="getBorrowStatusType(borrow.status)" size="small">
                  {{ getBorrowStatusText(borrow.status) }}
                </el-tag>
                <el-button 
                  v-if="borrow.status === 'borrowed' || borrow.status === 'overdue'" 
                  type="success" size="small" 
                  @click="returnTool(borrow)"
                >
                  归还
                </el-button>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="card-wrapper" style="margin-top: 20px">
          <template #header>
            <span>逾期提醒</span>
          </template>
          <div v-if="overdueBorrows.length === 0" class="empty">
            <el-empty description="暂无逾期" :image-size="60" />
          </div>
          <div v-else>
            <el-alert
              v-for="borrow in overdueBorrows"
              :key="borrow.id"
              :title="`${borrow.toolName} 已逾期，请尽快归还`"
              type="warning"
              :closable="false"
              style="margin-bottom: 10px"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showAddTool" title="新增工具" width="500px">
      <el-form :model="toolForm" label-width="100px">
        <el-form-item label="工具名称">
          <el-input v-model="toolForm.name" placeholder="请输入工具名称" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="toolForm.category" style="width: 100%">
            <el-option label="园艺工具" value="gardening" />
            <el-option label="浇水工具" value="watering" />
            <el-option label="收割工具" value="harvesting" />
            <el-option label="防护工具" value="protection" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="总数量">
          <el-input-number v-model="toolForm.totalQuantity" :min="1" />
        </el-form-item>
        <el-form-item label="存放位置">
          <el-input v-model="toolForm.location" placeholder="如：工具柜A" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="toolForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddTool = false">取消</el-button>
        <el-button type="primary" @click="createTool">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showBorrowDialog" title="借用工具" width="400px">
      <el-form :model="borrowForm" label-width="100px">
        <el-form-item label="工具名称">
          <span>{{ selectedTool?.name }}</span>
        </el-form-item>
        <el-form-item label="可借数量">
          <span>{{ selectedTool?.availableQuantity }}</span>
        </el-form-item>
        <el-form-item label="借用数量">
          <el-input-number v-model="borrowForm.quantity" :min="1" :max="selectedTool?.availableQuantity || 1" />
        </el-form-item>
        <el-form-item label="预计归还(天)">
          <el-input-number v-model="borrowForm.returnDays" :min="1" :max="14" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBorrowDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmBorrow">确认借用</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showToolDetail" title="工具详情" width="500px">
      <div v-if="selectedTool">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="工具名称">{{ selectedTool.name }}</el-descriptions-item>
          <el-descriptions-item label="分类">{{ getCategoryText(selectedTool.category) }}</el-descriptions-item>
          <el-descriptions-item label="总数量">{{ selectedTool.totalQuantity }}</el-descriptions-item>
          <el-descriptions-item label="可用数量">{{ selectedTool.availableQuantity }}</el-descriptions-item>
          <el-descriptions-item label="存放位置">{{ selectedTool.location }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedTool.status)">
              {{ getStatusText(selectedTool.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="上次维护">
            {{ selectedTool.lastMaintenanceDate ? formatDate(selectedTool.lastMaintenanceDate) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ selectedTool.description }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { toolService, toolBorrowService } from '@/services'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const authStore = useAuthStore()

const tools = ref([])
const myBorrows = ref([])
const overdueBorrows = ref([])
const filterCategory = ref('')
const filterStatus = ref('')
const showAddTool = ref(false)
const showBorrowDialog = ref(false)
const showToolDetail = ref(false)
const selectedTool = ref(null)

const toolForm = ref({
  name: '',
  category: 'gardening',
  totalQuantity: 1,
  location: '',
  description: ''
})

const borrowForm = ref({
  quantity: 1,
  returnDays: 3
})

const isAdmin = computed(() => authStore.isAdmin)
const userId = computed(() => authStore.userId)

const activeBorrows = computed(() => myBorrows.value.filter(b => b.status === 'borrowed' || b.status === 'overdue'))

const filteredTools = computed(() => {
  return tools.value.filter(tool => {
    if (filterCategory.value && tool.category !== filterCategory.value) return false
    if (filterStatus.value && tool.status !== filterStatus.value) return false
    return true
  })
})

onMounted(async () => {
  await loadTools()
  await loadMyBorrows()
  await loadOverdueBorrows()
})

async function loadTools() {
  tools.value = await toolService.getAll({ orderBy: ['name', 'asc'] })
}

async function loadMyBorrows() {
  if (userId.value) {
    myBorrows.value = await toolBorrowService.getBorrowsByUser(userId.value)
  }
}

async function loadOverdueBorrows() {
  overdueBorrows.value = await toolBorrowService.getOverdueBorrows()
}

function getCategoryText(category) {
  const map = {
    gardening: '园艺工具',
    watering: '浇水工具',
    harvesting: '收割工具',
    protection: '防护工具',
    other: '其他'
  }
  return map[category] || category
}

function getStatusType(status) {
  const map = {
    available: 'success',
    in_use: 'primary',
    maintenance: 'warning',
    damaged: 'danger'
  }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = {
    available: '可用',
    in_use: '使用中',
    maintenance: '维护中',
    damaged: '损坏'
  }
  return map[status] || status
}

function getBorrowStatusType(status) {
  const map = {
    borrowed: 'primary',
    returned: 'success',
    overdue: 'danger'
  }
  return map[status] || 'info'
}

function getBorrowStatusText(status) {
  const map = {
    borrowed: '借用中',
    returned: '已归还',
    overdue: '已逾期'
  }
  return map[status] || status
}

function formatDate(date) {
  if (!date) return ''
  return dayjs(date.seconds ? date.seconds * 1000 : date).format('MM-DD')
}

function borrowTool(tool) {
  selectedTool.value = tool
  borrowForm.value = { quantity: 1, returnDays: 3 }
  showBorrowDialog.value = true
}

async function confirmBorrow() {
  try {
    await toolBorrowService.borrowTool(
      selectedTool.value.id,
      selectedTool.value.name,
      userId.value,
      authStore.userData.name,
      borrowForm.value.quantity,
      borrowForm.value.returnDays
    )
    ElMessage.success('借用成功')
    showBorrowDialog.value = false
    await loadTools()
    await loadMyBorrows()
  } catch (error) {
    ElMessage.error('借用失败')
  }
}

async function returnTool(borrow) {
  try {
    await toolBorrowService.returnTool(borrow.id)
    ElMessage.success('归还成功')
    await loadTools()
    await loadMyBorrows()
    await loadOverdueBorrows()
  } catch (error) {
    ElMessage.error('归还失败')
  }
}

async function createTool() {
  try {
    await toolService.create({
      ...toolForm.value,
      availableQuantity: toolForm.value.totalQuantity,
      status: 'available'
    })
    ElMessage.success('工具添加成功')
    showAddTool.value = false
    await loadTools()
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

async function setMaintenance(tool) {
  try {
    await toolService.setMaintenance(tool.id)
    ElMessage.success('已设置维护')
    await loadTools()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

function viewToolDetail(tool) {
  selectedTool.value = tool
  showToolDetail.value = true
}
</script>

<style scoped>
.tools-page {
  padding: 0;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.borrow-list {
  max-height: 400px;
  overflow-y: auto;
}
.borrow-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}
.borrow-tool {
  font-weight: 600;
  margin-bottom: 4px;
}
.borrow-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  gap: 12px;
}
.borrow-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.empty {
  padding: 20px 0;
}
</style>
