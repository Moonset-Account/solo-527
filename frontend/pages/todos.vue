<template>
  <n-card :bordered="false">
    <template #header>
      <span>待办中心</span>
    </template>

    <n-tabs v-model:value="activeTab" type="line">
      <n-tab-pane name="normal" tab="普通待办">
        <n-list bordered>
          <n-list-item v-for="todo in normalTodos" :key="todo.id" style="padding: 16px">
            <n-thing :title="todo.title">
              <template #avatar>
                <n-tag :type="priorityColors[todo.priority] as any" size="small" round>
                  {{ priorityLabels[todo.priority] }}
                </n-tag>
              </template>
              <template #description>
                {{ todo.description || '暂无描述' }}
              </template>
              <div class="todo-meta">
                <span>创建于: {{ formatDateTime(todo.created_at) }}</span>
                <span v-if="todo.due_date"> · 截止: {{ formatDateTime(todo.due_date) }}</span>
                <span> · {{ todoTypeLabels[todo.todo_type] }}</span>
              </div>
              <template #action>
                <n-space>
                  <n-button size="small" type="primary" @click="completeTodo(todo.id)">
                    完成
                  </n-button>
                  <n-button size="small" @click="escalateTodo(todo.id)">
                    升级催办
                  </n-button>
                </n-space>
              </template>
            </n-thing>
          </n-list-item>
          <n-list-item v-if="normalTodos.length === 0">
            <div style="text-align: center; color: #999; padding: 40px">
              暂无待办
            </div>
          </n-list-item>
        </n-list>
      </n-tab-pane>

      <n-tab-pane name="escalated" tab="升级催办">
        <n-list bordered>
          <n-list-item v-for="todo in escalatedTodos" :key="todo.id" style="padding: 16px">
            <n-thing :title="todo.title">
              <template #avatar>
                <n-tag type="error" size="small" round>
                  升级催办
                </n-tag>
              </template>
              <template #description>
                <div style="color: #d03050">
                  升级原因: {{ todo.escalation_reason || '无' }}
                </div>
                <div>升级时间: {{ formatDateTime(todo.escalated_at) }}</div>
              </template>
              <div class="todo-meta">
                <span>{{ todoTypeLabels[todo.todo_type] }}</span>
                <span> · 优先级: {{ priorityLabels[todo.priority] }}</span>
              </div>
              <template #action>
                <n-button size="small" type="primary" @click="completeTodo(todo.id)">
                  处理完成
                </n-button>
              </template>
            </n-thing>
          </n-list-item>
          <n-list-item v-if="escalatedTodos.length === 0">
            <div style="text-align: center; color: #999; padding: 40px">
              暂无升级催办
            </div>
          </n-list-item>
        </n-list>
      </n-tab-pane>
    </n-tabs>
  </n-card>

  <n-modal v-model:show="showEscalate" preset="dialog" title="升级催办" :style="{ width: '400px' }">
    <n-form label-placement="top">
      <n-form-item label="升级原因">
        <n-input v-model:value="escalateReason" type="textarea" :rows="3" placeholder="请输入升级原因" />
      </n-form-item>
    </n-form>
    <template #action>
      <n-button @click="showEscalate = false">取消</n-button>
      <n-button type="primary" @click="confirmEscalate">确认升级</n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import api from '~/utils/api'
import { priorityLabels, priorityColors, todoTypeLabels, formatDateTime } from '~/utils/dict'
import type { Todo } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const message = useMessage()

const activeTab = ref('normal')
const normalTodos = ref<Todo[]>([])
const escalatedTodos = ref<Todo[]>([])

const showEscalate = ref(false)
const escalateTodoId = ref<number | null>(null)
const escalateReason = ref('')

async function loadNormalTodos() {
  try {
    const res = await api.get('/todos/my/normal')
    normalTodos.value = res.data
  } catch (e) {
    message.error('加载失败')
  }
}

async function loadEscalatedTodos() {
  try {
    const res = await api.get('/todos/my/escalated')
    escalatedTodos.value = res.data
  } catch (e) {
    message.error('加载失败')
  }
}

async function completeTodo(id: number) {
  try {
    await api.post(`/todos/${id}/complete`)
    message.success('已标记完成')
    loadNormalTodos()
    loadEscalatedTodos()
  } catch (e) {
    message.error('操作失败')
  }
}

function escalateTodo(id: number) {
  escalateTodoId.value = id
  escalateReason.value = ''
  showEscalate.value = true
}

async function confirmEscalate() {
  if (!escalateTodoId.value || !escalateReason.value) {
    message.warning('请输入升级原因')
    return
  }
  try {
    await api.post(`/todos/${escalateTodoId.value}/escalate`, null, {
      params: { reason: escalateReason.value },
    })
    message.success('升级成功')
    showEscalate.value = false
    loadNormalTodos()
    loadEscalatedTodos()
  } catch (e) {
    message.error('升级失败')
  }
}

onMounted(() => {
  loadNormalTodos()
  loadEscalatedTodos()
})
</script>

<style scoped>
.todo-meta {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
}
</style>
