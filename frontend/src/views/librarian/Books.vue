<template>
  <div class="page-container">
    <div class="card">
      <h3 class="card-title">绘本管理</h3>
      <el-table :data="books" stripe>
        <el-table-column prop="title" label="书名" />
        <el-table-column prop="isbn" label="ISBN" width="140" />
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="status_display" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ row.status_display }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="馆藏位置" width="100" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const books = ref([
  { id: 1, title: '猜猜我有多爱你', isbn: '9787543460756', author: '山姆·麦克布雷尼', status: 'available', status_display: '可借阅', location: 'A-01' },
  { id: 2, title: '好饿的毛毛虫', isbn: '9787533256210', author: '艾瑞·卡尔', status: 'borrowed', status_display: '已借出', location: 'A-02' },
  { id: 3, title: '我爸爸', isbn: '9787543462363', author: '安东尼·布朗', status: 'damaged', status_display: '破损待修', location: 'B-05' },
  { id: 4, title: '不一样的卡梅拉', isbn: '9787539135694', author: '克利斯提昂·约里波瓦', status: 'off_shelf', status_display: '已下架', location: '' }
])

const getStatusType = (status) => {
  const types = { available: 'success', borrowed: 'primary', damaged: 'warning', off_shelf: 'danger', repairing: 'info' }
  return types[status] || 'info'
}
</script>
