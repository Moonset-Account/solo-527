<template>
  <div class="page-container">
    <div class="card">
      <h3 class="card-title">押金异常账户</h3>
      <el-table :data="abnormalAccounts" stripe>
        <el-table-column prop="member_name" label="会员" width="120" />
        <el-table-column prop="balance" label="余额" width="100">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: 600">¥{{ row.balance }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="abnormal_reason" label="异常原因" />
      </el-table>
    </div>

    <div class="card">
      <h3 class="card-title">待处理申诉</h3>
      <el-table :data="appealingTransactions" stripe>
        <el-table-column prop="member_name" label="会员" width="120" />
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="description" label="扣减说明" />
        <el-table-column prop="appeal_reason" label="申诉原因" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="handleApprove(row)">通过</el-button>
            <el-button type="danger" size="small" @click="handleReject(row)">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const abnormalAccounts = ref([
  { id: 1, member_name: '周家长', balance: '-50.00', abnormal_reason: '押金余额不足' }
])

const appealingTransactions = ref([
  { id: 1, member_name: '王家长', amount: '50.00', description: '绘本《小恐龙》内页撕毁赔偿', appeal_reason: '借的时候就有小裂口，不是我们完全撕毁的' }
])

const handleApprove = (row) => {
  ElMessage.success('申诉已通过，金额已调整')
  appealingTransactions.value = appealingTransactions.value.filter(item => item.id !== row.id)
}

const handleReject = (row) => {
  ElMessage.success('申诉已驳回')
  appealingTransactions.value = appealingTransactions.value.filter(item => item.id !== row.id)
}
</script>
