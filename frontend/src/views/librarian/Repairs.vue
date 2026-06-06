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
        <el-table-column prop="damage_level_display" label="破损程度" width="120">
          <template #default="{ row }">
            <el-tag :type="getDamageTagType(row.damage_level)" size="small">
              {{ row.damage_level_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status_display" label="修复状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ row.status_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reporter_name" label="录入人" width="100" />
        <el-table-column prop="create_time" label="录入时间" width="160" />
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
          <el-select v-model="repairForm.book_id" placeholder="请选择绘本" style="width: 100%">
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
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const repairs = ref([
  { id: 1, book_title: '不一样的卡梅拉', book_isbn: '9787539135694', damage_level: 'affect_read', damage_level_display: '影响阅读', status: 'pending', status_display: '待修复', reporter_name: '李馆员', create_time: '2024-01-10 14:30' },
  { id: 2, book_title: '神奇校车', book_isbn: '9787221091956', damage_level: 'need_off', damage_level_display: '需下架', status: 'off_shelf', status_display: '需下架', reporter_name: '王馆员', create_time: '2024-01-09 10:15' },
  { id: 3, book_title: '猜猜我有多爱你', book_isbn: '9787543460756', damage_level: 'light', damage_level_display: '轻微磨损', status: 'repairing', status_display: '修复中', reporter_name: '李馆员', create_time: '2024-01-08 16:00' }
])

const availableBooks = ref([
  { id: 1, title: '我爸爸', isbn: '9787543462363' },
  { id: 2, title: '好饿的毛毛虫', isbn: '9787533256210' },
  { id: 3, title: '大卫不可以', isbn: '9787543462356' }
])

const showAddDialog = ref(false)
const repairForm = reactive({
  book_id: null,
  damage_level: '',
  description: ''
})

const getDamageTagType = (level) => {
  const types = { light: 'success', affect_read: 'warning', need_off: 'danger' }
  return types[level] || 'info'
}

const getStatusTagType = (status) => {
  const types = { pending: 'warning', repairing: 'primary', completed: 'success', off_shelf: 'danger' }
  return types[status] || 'info'
}

const handlePhotoChange = (file) => {
  console.log('Photo selected:', file)
}

const handleStartRepair = (row) => {
  row.status = 'repairing'
  row.status_display = '修复中'
  ElMessage.success('已开始修复')
}

const handleCompleteRepair = (row) => {
  row.status = 'completed'
  row.status_display = '已修复'
  ElMessage.success('修复完成，绘本已恢复可借阅状态')
}

const submitRepair = () => {
  if (!repairForm.book_id || !repairForm.damage_level) {
    ElMessage.warning('请填写必填项')
    return
  }
  
  const book = availableBooks.value.find(b => b.id === repairForm.book_id)
  
  const newRepair = {
    id: Date.now(),
    book_title: book?.title,
    book_isbn: book?.isbn,
    damage_level: repairForm.damage_level,
    damage_level_display: repairForm.damage_level === 'light' ? '轻微磨损' : (repairForm.damage_level === 'affect_read' ? '影响阅读' : '需下架'),
    status: repairForm.damage_level === 'need_off' ? 'off_shelf' : 'pending',
    status_display: repairForm.damage_level === 'need_off' ? '需下架' : '待修复',
    reporter_name: '李馆员',
    create_time: new Date().toLocaleString()
  }
  
  repairs.value.unshift(newRepair)
  showAddDialog.value = false
  ElMessage.success('破损信息已录入，绘本状态已自动更新')
}
</script>
