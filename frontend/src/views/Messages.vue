<template>
  <div class="messages">
    <el-card shadow="never">
      <template #header>
        <div class="flex-between">
          <span>消息中心</span>
          <el-tabs v-model="activeTab" @tab-change="loadMessages">
            <el-tab-pane label="全部" name="" />
            <el-tab-pane label="未读" name="0" />
            <el-tab-pane label="已读" name="1" />
          </el-tabs>
        </div>
      </template>

      <el-table :data="messageList" v-loading="loading" @row-click="handleRead">
        <el-table-column width="60">
          <template #default="{ row }">
            <el-badge v-if="row.isRead === 0" is-dot />
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="100">
          <template #default="{ row }">
            <span :class="getPriorityClass(row.priority)">{{ getPriorityText(row.priority) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
        <el-table-column prop="senderName" label="发送人" width="100" />
        <el-table-column prop="createdAt" label="时间" width="160" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click.stop="handleView(row)" v-if="row.relatedId">
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyMessages, markAsRead } from '@/api/message'
import { ElMessage } from 'element-plus'

const router = useRouter()
const messageList = ref([])
const loading = ref(false)
const activeTab = ref('')

function getPriorityClass(priority) {
  const map = { URGENT: 'urgent-tag', HIGH: 'high-tag', NORMAL: 'normal-tag', LOW: 'low-tag' }
  return map[priority] || 'normal-tag'
}

function getPriorityText(priority) {
  const map = { URGENT: '紧急', HIGH: '高', NORMAL: '普通', LOW: '低' }
  return map[priority] || priority
}

async function loadMessages() {
  loading.value = true
  try {
    const res = await getMyMessages({ isRead: activeTab.value, page: 1, size: 50 })
    messageList.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function handleRead(row) {
  if (row.isRead === 0) {
    try {
      await markAsRead(row.id)
      row.isRead = 1
    } catch (e) {
      console.error(e)
    }
  }
}

function handleView(row) {
  handleRead(row)
  if (row.relatedType === 'WORK_ORDER') {
    router.push(`/orders/${row.relatedId}`)
  }
}

onMounted(() => {
  loadMessages()
})
</script>

<style scoped>
:deep(.el-card__header) {
  display: block;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
