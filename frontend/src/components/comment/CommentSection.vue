<template>
  <div class="comment-section">
    <div class="comment-input">
      <el-input
        v-model="newContent"
        type="textarea"
        :rows="3"
        placeholder="请输入评论内容"
      />
      <el-button type="primary" style="margin-top: 8px" @click="handleAdd" :loading="submitting">提交评论</el-button>
    </div>

    <div class="comment-list">
      <div v-for="comment in rootComments" :key="comment.id" class="comment-item">
        <div class="comment-main">
          <div class="comment-header">
            <span class="comment-user">用户{{ comment.userId }}</span>
            <span class="comment-time">{{ formatDateTime(comment.createdAt) }}</span>
            <el-tag v-if="isOverdue(comment)" type="danger" size="small" class="overdue-tag">超时未回复</el-tag>
          </div>
          <div class="comment-content">{{ comment.content }}</div>
          <el-button link type="primary" size="small" @click="handleReply(comment)">回复</el-button>
        </div>

        <div v-if="comment.children && comment.children.length" class="comment-replies">
          <div v-for="reply in comment.children" :key="reply.id" class="comment-reply-item">
            <div class="comment-header">
              <span class="comment-user">用户{{ reply.userId }}</span>
              <span class="comment-time">{{ formatDateTime(reply.createdAt) }}</span>
              <el-tag v-if="isOverdue(reply)" type="danger" size="small" class="overdue-tag">超时未回复</el-tag>
            </div>
            <div class="comment-content">{{ reply.content }}</div>
          </div>
        </div>
      </div>
      <el-empty v-if="!rootComments.length" description="暂无评论" :image-size="60" />
    </div>

    <el-dialog v-model="replyVisible" title="回复评论" width="480px" append-to-body>
      <el-input v-model="replyContent" type="textarea" :rows="3" placeholder="请输入回复内容" />
      <template #footer>
        <el-button @click="replyVisible = false">取消</el-button>
        <el-button type="primary" @click="handleReplySubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { addComment, getCommentsByRequirement } from '@/api/comment'
import { formatDateTime } from '@/utils'
import dayjs from 'dayjs'

const props = defineProps({
  requirementId: {
    type: Number,
    required: true
  }
})

const comments = ref([])
const newContent = ref('')
const submitting = ref(false)
const replyVisible = ref(false)
const replyContent = ref('')
const replyParentId = ref(null)

const rootComments = computed(() => {
  const map = {}
  const roots = []
  comments.value.forEach(c => { map[c.id] = { ...c, children: [] } })
  comments.value.forEach(c => {
    if (c.parentId && map[c.parentId]) {
      map[c.parentId].children.push(map[c.id])
    } else {
      roots.push(map[c.id])
    }
  })
  return roots
})

function isOverdue(comment) {
  if (comment.hasReply) return false
  const hours = dayjs().diff(dayjs(comment.createdAt), 'hour')
  return hours >= 24
}

async function fetchComments() {
  const res = await getCommentsByRequirement(props.requirementId)
  comments.value = res.data || []
}

async function handleAdd() {
  if (!newContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  submitting.value = true
  try {
    await addComment({ requirementId: props.requirementId, content: newContent.value.trim() })
    newContent.value = ''
    ElMessage.success('评论成功')
    await fetchComments()
  } finally {
    submitting.value = false
  }
}

function handleReply(comment) {
  replyParentId.value = comment.id
  replyContent.value = ''
  replyVisible.value = true
}

async function handleReplySubmit() {
  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  submitting.value = true
  try {
    await addComment({
      requirementId: props.requirementId,
      content: replyContent.value.trim(),
      parentId: replyParentId.value
    })
    replyVisible.value = false
    ElMessage.success('回复成功')
    await fetchComments()
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchComments()
})
</script>

<style scoped>
.comment-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-input {
  margin-bottom: 8px;
}

.comment-list {
  max-height: 400px;
  overflow-y: auto;
}

.comment-item {
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-main {
  padding: 0 4px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.comment-user {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.overdue-tag {
  margin-left: 4px;
}

.comment-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 6px;
}

.comment-replies {
  margin-left: 32px;
  margin-top: 8px;
  padding-left: 12px;
  border-left: 2px solid #e4e7ed;
}

.comment-reply-item {
  padding: 8px 0;
}

.comment-reply-item:not(:last-child) {
  border-bottom: 1px dashed #ebeef5;
}
</style>
