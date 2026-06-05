<script setup>
import { ref, onMounted } from 'vue'
import { getReviewTasks } from '../../api'

const tasks = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    tasks.value = await getReviewTasks()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page-card">
    <h2 class="card-title">审核任务</h2>
    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="!tasks.length" class="empty-state">暂无审核任务</div>
    <div v-else class="task-list">
      <div v-for="t in tasks" :key="t.id" class="task-card">
        <div class="task-header">
          <span class="task-type">{{ t.type }}</span>
          <span :class="['status-tag', t.status]">{{ t.status_label }}</span>
        </div>
        <div class="task-body">
          <p>提交人：{{ t.submitter }}</p>
          <p>提交时间：{{ t.submitted_at }}</p>
          <p>说明：{{ t.description }}</p>
        </div>
        <div class="task-footer">
          <button class="btn-approve">通过</button>
          <button class="btn-reject">驳回</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a3a5c;
  margin-bottom: 16px;
}
.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}
.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.task-card {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #f0f0f0;
}
.task-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}
.task-type {
  font-weight: 600;
  color: #1a3a5c;
}
.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.status-tag.pending { background: #fff7e6; color: #d48806; }
.status-tag.approved { background: #f6ffed; color: #389e0d; }
.status-tag.rejected { background: #fff2f0; color: #cf1322; }
.task-body p {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}
.task-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 12px;
}
.btn-approve {
  padding: 4px 16px;
  border: 1px solid #389e0d;
  border-radius: 4px;
  background: #f6ffed;
  color: #389e0d;
  font-size: 13px;
  cursor: pointer;
}
.btn-approve:hover { background: #389e0d; color: #fff; }
.btn-reject {
  padding: 4px 16px;
  border: 1px solid #cf1322;
  border-radius: 4px;
  background: #fff2f0;
  color: #cf1322;
  font-size: 13px;
  cursor: pointer;
}
.btn-reject:hover { background: #cf1322; color: #fff; }
</style>
