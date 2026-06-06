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
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const borrows = ref([
  { id: 1, book_title: '猜猜我有多爱你', book_isbn: '9787543460756', borrow_date: '2024-01-01', due_date: '2024-01-15', status: 'borrowed', is_overdue: false, renew_count: 0 },
  { id: 2, book_title: '好饿的毛毛虫', book_isbn: '9787533256210', borrow_date: '2023-12-25', due_date: '2024-01-08', status: 'borrowed', is_overdue: true, renew_count: 1 },
  { id: 3, book_title: '我爸爸', book_isbn: '9787543462363', borrow_date: '2023-12-10', due_date: '2023-12-24', status: 'returned', is_overdue: false, renew_count: 0 }
])

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

const handleRenew = (row) => {
  if (row.renew_count >= 2) {
    ElMessage.warning('已达到最大续借次数')
    return
  }
  ElMessage.success('续借成功，借阅期限延长14天')
  row.renew_count += 1
}
</script>
