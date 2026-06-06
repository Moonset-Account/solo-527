<template>
  <div class="page-container">
    <div class="card">
      <h3 class="card-title">活动管理</h3>
      <el-table :data="activities" stripe>
        <el-table-column prop="title" label="活动名称" />
        <el-table-column prop="start_time" label="开始时间" width="160" />
        <el-table-column label="报名情况" width="180">
          <template #default="{ row }">
            <el-progress 
              :percentage="Math.round(row.current_capacity / row.max_capacity * 100)" 
              :stroke-width="8"
              style="width: 120px"
            />
            <span style="margin-left: 8px">{{ row.current_capacity }}/{{ row.max_capacity }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="waitlist_count" label="候补人数" width="100" />
        <el-table-column prop="status_display" label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.status_display }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activities = ref([
  { id: 1, title: '周六海洋主题故事会', start_time: '2024-01-13 10:00', current_capacity: 18, max_capacity: 20, waitlist_count: 3, status: 'upcoming', status_display: '即将开始' },
  { id: 2, title: '周日手工绘本课', start_time: '2024-01-14 14:00', current_capacity: 10, max_capacity: 15, waitlist_count: 0, status: 'upcoming', status_display: '即将开始' },
  { id: 3, title: '周三亲子阅读会', start_time: '2024-01-17 10:00', current_capacity: 16, max_capacity: 20, waitlist_count: 1, status: 'upcoming', status_display: '即将开始' }
])
</script>
