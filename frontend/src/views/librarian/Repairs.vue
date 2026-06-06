<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">修复管理</h3>
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          录入破损
        </el-button>
      </div>
      <el-table :data="repairs" stripe>
        <el-table-column prop="book_title" label="绘本名称" />
        <el-table-column prop="book_isbn" label="ISBN" width="140" />
        <el-table-column label="破损程度" width="120">
          <template #default="{ row }">
            <el-tag :type="getDamageTagType(row.damage_level)" size="small">
              {{ row.damage_level_display || row.damage_level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="修复状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ row.status_display || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reporter_name" label="录入人" width="100" />
        <el-table-column label="录入时间" width="160">
          <template #default="{ row }">{{ formatDate(row.create_time) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'pending' || row.status === 'off_shelf'" 
              size="small" 
              type="primary"
              @click="handleStartRepair(row)"
            >
              开始修复
            </el-button>
            <el-button 
              v-if="row.status === 'repairing'" 
              size="small" 
              type="success"
              @click="handleCompleteRepair(row)"
            >
              完成修复
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showAddDialog" title="录入破损绘本" width="600px">
      <el-form :model="repairForm" label-width="100px">
        <el-form-item label="选择绘本" required>
          <el-select v-model="repairForm.book" placeholder="请选择绘本" style="width: 100%">
            <el-option 
              v-for="book in availableBooks" 
              :key="book.id" 
              :label="`${book.title} (${book.isbn})`" 
              :value="book.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="破损程度" required>
          <el-radio-group v-model="repairForm.damage_level">
            <el-radio value="light">轻微磨损</el-radio>
            <el-radio value="affect_read">影响阅读</el-radio>
            <el-radio value="need_off">需下架</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="破损描述">
          <el-input v-model="repairForm.description" type="textarea" :rows="3" placeholder="请描述破损情况" />
        </el-form-item>
        <el-form-item label="上传照片">
          <el-upload
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :on-change="handlePhotoChange"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRepair">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getRepairs, createRepair, startRepair, completeRepair } from '@/api/repairs'
import { getBooks } from '@/api/books'

const repairs = ref([])
const availableBooks = ref([])
const photoFile = ref(null)

const showAddDialog = ref(false)
const repairForm = reactive({
  book: null,
  damage_level: '',
  description: ''
})

const fetchRepairs = async () => {
  try {
    const data = await getRepairs()
    repairs.value = data.results || data
  } catch (error) {
    console.error('获取修复记录失败:', error)
  }
}

const fetchAvailableBooks = async () => {
  try {
    const data = await getBooks({ status: 'available' })
    availableBooks.value = data.results || data
  } catch (error) {
    console.error('获取绘本列表失败:', error)
  }
}

const getDamageTagType = (level) => {
  const types = { light: 'success', affect_read: 'warning', need_off: 'danger' }
  return types[level] || 'info'
}

const getStatusTagType = (status) => {
  const types = { pending: 'warning', repairing: 'primary', completed: 'success', off_shelf: 'danger' }
  return types[status] || 'info'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.replace('T', ' ').substring(0, 16)
}

const handlePhotoChange = (file) => {
  photoFile.value = file.raw
}

const handleStartRepair = async (row) => {
  try {
    await startRepair(row.id)
    ElMessage.success('已开始修复')
    fetchRepairs()
  } catch (error) {
    console.error('开始修复失败:', error)
  }
}

const handleCompleteRepair = async (row) => {
  try {
    await completeRepair(row.id)
    ElMessage.success('修复完成，绘本已恢复可借阅状态')
    fetchRepairs()
  } catch (error) {
    console.error('完成修复失败:', error)
  }
}

const submitRepair = async () => {
  if (!repairForm.book || !repairForm.damage_level) {
    ElMessage.warning('请填写必填项')
    return
  }
  
  try {
    const formData = new FormData()
    formData.append('book', repairForm.book)
    formData.append('damage_level', repairForm.damage_level)
    formData.append('description', repairForm.description)
    if (photoFile.value) {
      formData.append('photo', photoFile.value)
    }
    
    await createRepair(formData)
    showAddDialog.value = false
    ElMessage.success('破损信息已录入，绘本状态已自动更新')
    repairForm.book = null
    repairForm.damage_level = ''
    repairForm.description = ''
    photoFile.value = null
    fetchRepairs()
    fetchAvailableBooks()
  } catch (error) {
    console.error('录入破损失败:', error)
  }
}

onMounted(() => {
  fetchRepairs()
  fetchAvailableBooks()
})
</script>
