<template>
  <div class="satisfaction">
    <el-card shadow="never">
      <template #header>
        <span>满意度评价</span>
      </template>

      <el-table :data="satisfactionList" v-loading="loading">
        <el-table-column prop="orderNo" label="工单编号" width="160" />
        <el-table-column prop="ownerName" label="业主" width="100" />
        <el-table-column label="总体评分" width="150">
          <template #default="{ row }">
            <el-rate :model-value="row.overallScore" disabled />
            <span style="margin-left: 10px;">{{ row.overallScore }}分</span>
          </template>
        </el-table-column>
        <el-table-column label="响应速度" width="120">
          <template #default="{ row }">
            <el-rate :model-value="row.responseSpeedScore || 0" disabled />
          </template>
        </el-table-column>
        <el-table-column label="服务态度" width="120">
          <template #default="{ row }">
            <el-rate :model-value="row.serviceAttitudeScore || 0" disabled />
          </template>
        </el-table-column>
        <el-table-column label="维修质量" width="120">
          <template #default="{ row }">
            <el-rate :model-value="row.qualityScore || 0" disabled />
          </template>
        </el-table-column>
        <el-table-column prop="content" label="评价内容" min-width="200" />
        <el-table-column prop="createdAt" label="评价时间" width="160" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getSatisfactionPage } from '@/api/satisfaction'

const satisfactionList = ref([])
const loading = ref(false)

async function loadData() {
  loading.value = true
  try {
    const res = await getSatisfactionPage({ page: 1, size: 20 })
    satisfactionList.value = res.data.records
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
