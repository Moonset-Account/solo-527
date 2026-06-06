<template>
  <div class="page-container">
    <div class="page-header">
      <h3>伤病备注</h3>
      <el-alert
        title="本页内容仅限教练查看"
        type="warning"
        :closable="false"
        style="flex: 1; margin-left: 20px"
      />
    </div>

    <el-card>
      <div class="toolbar">
        <el-select v-model="selectedRunner" placeholder="选择跑友" style="width: 200px" @change="loadNotes">
          <el-option v-for="runner in runners" :key="runner.id" :label="runner.full_name" :value="runner.id" />
        </el-select>
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          添加备注
        </el-button>
      </div>

      <el-table :data="notes" v-loading="loading" style="margin-top: 20px">
        <el-table-column label="跑友" prop="runner_id" width="120">
          <template #default="{ row }">
            跑友 #{{ row.runner_id }}
          </template>
        </el-table-column>
        <el-table-column label="伤病类型" prop="injury_type" width="120" />
        <el-table-column label="严重程度" prop="severity" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getSeverityType(row.severity)">
              {{ getSeverityText(row.severity) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="受伤日期" prop="injury_date" width="120">
          <template #default="{ row }">
            {{ formatDate(row.injury_date) }}
          </template>
        </el-table-column>
        <el-table-column label="预计恢复" prop="expected_recovery_date" width="120">
          <template #default="{ row }">
            {{ row.expected_recovery_date ? formatDate(row.expected_recovery_date) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.is_active ? 'danger' : 'success'">
              {{ row.is_active ? '受伤中' : '已康复' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="详情" prop="notes" />
      </el-table>
    </el-card>

    <el-dialog v-model="showAddDialog" title="添加伤病备注" width="500px">
      <el-form :model="noteForm" label-width="110px">
        <el-form-item label="跑友" required>
          <el-select v-model="noteForm.runner_id" style="width: 100%">
            <el-option v-for="runner in runners" :key="runner.id" :label="runner.full_name" :value="runner.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="伤病类型" required>
          <el-input v-model="noteForm.injury_type" placeholder="如：膝盖酸痛" />
        </el-form-item>
        <el-form-item label="严重程度" required>
          <el-select v-model="noteForm.severity" style="width: 100%">
            <el-option label="轻度" value="mild" />
            <el-option label="中度" value="moderate" />
            <el-option label="重度" value="severe" />
          </el-select>
        </el-form-item>
        <el-form-item label="受伤日期">
          <el-date-picker v-model="noteForm.injury_date" type="date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="预计恢复">
          <el-date-picker v-model="noteForm.expected_recovery_date" type="date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="康复建议">
          <el-input v-model="noteForm.treatment_notes" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="其他备注">
          <el-input v-model="noteForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addNote" :loading="adding">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const notes = ref([])
const runners = ref([])
const loading = ref(false)
const showAddDialog = ref(false)
const adding = ref(false)
const selectedRunner = ref('')

const noteForm = reactive({
  runner_id: null,
  injury_type: '',
  severity: 'mild',
  injury_date: '',
  expected_recovery_date: '',
  treatment_notes: '',
  notes: ''
})

const loadNotes = async () => {
  loading.value = true
  try {
    const params = selectedRunner.value ? { runner_id: selectedRunner.value } : {}
    const data = await request.get('/injury-notes/', { params })
    notes.value = data
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const loadRunners = async () => {
  try {
    const data = await request.get('/injury-notes/')
    const runnerIds = [...new Set(data.map(n => n.runner_id))]
    runners.value = runnerIds.map(id => ({ id, full_name: `跑友 ${id}` }))
  } catch (error) {
    console.error(error)
  }
}

const addNote = async () => {
  if (!noteForm.runner_id || !noteForm.injury_type) {
    ElMessage.warning('请填写跑友和伤病类型')
    return
  }
  adding.value = true
  try {
    await request.post('/injury-notes/', noteForm)
    ElMessage.success('伤病备注已添加')
    showAddDialog.value = false
    loadNotes()
  } catch (error) {
    console.error(error)
  } finally {
    adding.value = false
  }
}

const getSeverityText = (severity) => {
  const map = { mild: '轻度', moderate: '中度', severe: '重度' }
  return map[severity] || severity
}

const getSeverityType = (severity) => {
  const map = { mild: 'success', moderate: 'warning', severe: 'danger' }
  return map[severity] || 'info'
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD')
}

onMounted(() => {
  loadNotes()
  loadRunners()
})
</script>

<style scoped>
.page-container {
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h3 {
  margin: 0;
  color: #303133;
  white-space: nowrap;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
