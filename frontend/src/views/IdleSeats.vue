<template>
  <div class="idle-seats">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">闲置席位总数</div>
          <div class="stat-value">{{ stats.total || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">闲置7天以上</div>
          <div class="stat-value warning">{{ stats.over7Days || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">闲置15天以上</div>
          <div class="stat-value danger">{{ stats.over15Days || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">闲置30天以上</div>
          <div class="stat-value danger">{{ stats.over30Days || 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="table-card">
      <div class="table-header">
        <div class="header-left">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索席位编码/客户名称"
            clearable
            style="width: 250px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="header-right">
          <el-button
            type="primary"
            :disabled="selectedIds.length === 0"
            @click="showBatchDialog = true"
          >
            批量处理
          </el-button>
        </div>
      </div>

      <el-table
        :data="tableData"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="seatCode" label="席位编码" width="150" />
        <el-table-column prop="customerName" label="客户名称" min-width="150" />
        <el-table-column prop="planName" label="套餐" width="120" />
        <el-table-column prop="idleDays" label="闲置天数" width="100">
          <template #default="{ row }">
            <el-tag :type="getIdleDaysType(row.idleDays)">
              {{ row.idleDays }}天
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastActivityAt" label="最后活跃时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.lastActivityAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="apiCallsUsed" label="累计调用量" width="120">
          <template #default="{ row }">
            {{ formatNumber(row.apiCallsUsed) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openNoteDialog(row)">添加备注</el-button>
            <el-button type="success" link @click="handleMarkActive(row)">标记活跃</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="showNoteDialogRef" title="添加备注/处理结果" width="500px">
      <el-form :model="noteForm" :rules="noteRules" ref="noteFormRef" label-width="80px">
        <el-form-item label="处理结果" prop="result">
          <el-select v-model="noteForm.result" placeholder="请选择" style="width: 100%">
            <el-option label="已联系客户" value="contacted" />
            <el-option label="客户已续费" value="converted" />
            <el-option label="客户放弃" value="lost" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注内容" prop="content">
          <el-input v-model="noteForm.content" type="textarea" :rows="4" placeholder="请输入备注内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showNoteDialogRef = false">取消</el-button>
        <el-button type="primary" :loading="noteLoading" @click="handleAddNote">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showBatchDialog" title="批量处理" width="500px">
      <el-form label-width="100px">
        <el-form-item label="选中数量">
          <span>{{ selectedIds.length }} 条</span>
        </el-form-item>
        <el-form-item label="处理方式">
          <el-radio-group v-model="batchAction">
            <el-radio label="mark_active">标记为活跃</el-radio>
            <el-radio label="add_note">批量添加备注</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="batchAction === 'add_note'" label="备注内容">
          <el-input v-model="batchNote" type="textarea" :rows="3" placeholder="请输入备注内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBatchDialog = false">取消</el-button>
        <el-button type="primary" :loading="batchLoading" @click="handleBatchProcess">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getIdleSeats, addSeatNote, updateIdleStatus } from '../api/seats'

const loading = ref(false)
const noteLoading = ref(false)
const batchLoading = ref(false)
const showNoteDialogRef = ref(false)
const showBatchDialog = ref(false)
const noteFormRef = ref(null)
const currentSeatId = ref(null)
const searchKeyword = ref('')

const tableData = ref([])
const total = ref(0)
const selectedIds = ref([])
const batchAction = ref('mark_active')
const batchNote = ref('')

const stats = reactive({
  total: 0,
  over7Days: 0,
  over15Days: 0,
  over30Days: 0
})

const pagination = reactive({
  page: 1,
  pageSize: 10
})

const noteForm = reactive({
  type: 'result',
  result: '',
  content: ''
})

const noteRules = {
  result: [{ required: true, message: '请选择处理结果', trigger: 'change' }],
  content: [{ required: true, message: '请输入备注内容', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchKeyword.value
    }
    const res = await getIdleSeats(params)
    const data = res.data || res
    tableData.value = data.list || data.data || []
    total.value = data.total || 0
    if (data.stats) {
      Object.assign(stats, data.stats)
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadData()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}

const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(item => item.id)
}

const openNoteDialog = (row) => {
  currentSeatId.value = row.id
  noteForm.result = ''
  noteForm.content = ''
  showNoteDialogRef.value = true
}

const handleAddNote = async () => {
  try {
    await noteFormRef.value.validate()
    noteLoading.value = true
    await addSeatNote(currentSeatId.value, noteForm)
    ElMessage.success('添加成功')
    showNoteDialogRef.value = false
    loadData()
  } catch (e) {
    if (e !== false) {
      console.error(e)
    }
  } finally {
    noteLoading.value = false
  }
}

const handleMarkActive = async (row) => {
  try {
    await ElMessageBox.confirm('确定将该席位标记为活跃吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await updateIdleStatus(row.id, { isIdle: false })
    ElMessage.success('操作成功')
    loadData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

const handleBatchProcess = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请选择要处理的席位')
    return
  }
  if (batchAction.value === 'add_note' && !batchNote.value.trim()) {
    ElMessage.warning('请输入备注内容')
    return
  }
  
  batchLoading.value = true
  try {
    if (batchAction.value === 'mark_active') {
      await Promise.all(
        selectedIds.value.map(id => updateIdleStatus(id, { isIdle: false }))
      )
    } else {
      await Promise.all(
        selectedIds.value.map(id => addSeatNote(id, { content: batchNote.value, type: 'note' }))
      )
    }
    ElMessage.success('批量处理成功')
    showBatchDialog.value = false
    loadData()
  } catch (e) {
    console.error(e)
  } finally {
    batchLoading.value = false
  }
}

const getIdleDaysType = (days) => {
  if (days >= 30) return 'danger'
  if (days >= 15) return 'warning'
  if (days >= 7) return 'info'
  return 'success'
}

const formatNumber = (num) => {
  if (num === undefined || num === null) return '-'
  return Number(num).toLocaleString()
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.idle-seats {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card .stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.stat-card .stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
}

.stat-card .stat-value.warning {
  color: #e6a23c;
}

.stat-card .stat-value.danger {
  color: #f56c6c;
}

.table-card .table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
