<template>
  <div class="page-container">
    <div class="card">
      <h3 class="card-title">我的借阅</h3>
      <el-table :data="borrows" stripe>
        <el-table-column prop="book_title" label="绘本名称" />
        <el-table-column prop="book_isbn" label="ISBN" width="140" />
        <el-table-column prop="borrow_date" label="借阅日期" width="120" />
        <el-table-column prop="due_date" label="应还日期" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getBorrowStatusType(row)" size="small">
              {{ getBorrowStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'borrowed' && !row.is_overdue" 
              type="primary" 
              size="small"
              @click="handleRenew(row)"
            >
              续借
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMyBorrows, renewBook } from '@/api/borrows'

const borrows = ref([])
const loading = ref(false)

const fetchBorrows = async () => {
  loading.value = true
  try {
    const data = await getMyBorrows()
    borrows.value = data
  } catch (error) {
    console.error('获取借阅记录失败:', error)
  } finally {
    loading.value = false
  }
}

const getBorrowStatusType = (row) => {
  if (row.status === 'returned') return 'info'
  if (row.is_overdue) return 'danger'
  return 'success'
}

const getBorrowStatusText = (row) => {
  if (row.status === 'returned') return '已归还'
  if (row.is_overdue) return '已逾期'
  return '借阅中'
}

const handleRenew = async (row) => {
  if (row.renew_count >= 2) {
    ElMessage.warning('已达到最大续借次数')
    return
  }
  try {
    await renewBook(row.id)
    ElMessage.success('续借成功，借阅期限延长14天')
    fetchBorrows()
  } catch (error) {
    console.error('续借失败:', error)
  }
}

onMounted(() => {
  fetchBorrows()
})
</script>
