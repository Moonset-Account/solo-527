<template>
  <div class="follow-ups-page space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">回访任务中心</h1>
        <p class="text-sm text-gray-500 mt-1">管理和跟进所有客户回访任务</p>
      </div>
      <div class="flex items-center gap-2">
        <n-button size="small" type="primary">
          <template #icon>
            <n-icon>
              <AddCircleSharp />
            </n-icon>
          </template>
          新建回访
        </n-button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-600">待回访</div>
            <div class="text-3xl font-bold text-gray-800 mt-2">{{ followUpsStore.stats.pending }}</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
            <n-icon :size="24" color="#6366F1">
              <TimeSharp />
            </n-icon>
          </div>
        </div>
      </div>
      <div class="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-600">已完成</div>
            <div class="text-3xl font-bold text-gray-800 mt-2">{{ followUpsStore.stats.completed }}</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
            <n-icon :size="24" color="#10B981">
              <CheckmarkCircleSharp />
            </n-icon>
          </div>
        </div>
      </div>
      <div class="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-5 border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-600">已取消</div>
            <div class="text-3xl font-bold text-gray-800 mt-2">{{ followUpsStore.stats.cancelled }}</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center">
            <n-icon :size="24" color="#6B7280">
              <CloseCircleSharp />
            </n-icon>
          </div>
        </div>
      </div>
      <div class="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-5 border border-rose-100">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-600">任务总数</div>
            <div class="text-3xl font-bold text-gray-800 mt-2">{{ followUpsStore.stats.total }}</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
            <n-icon :size="24" color="#F43F5E">
              <HeartSharp />
            </n-icon>
          </div>
        </div>
      </div>
    </div>

    <n-card class="!rounded-2xl !border-0" content-style="padding: 0;">
      <div class="p-5 border-b border-gray-100 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <n-tabs v-model:value="activeTab" type="line" size="medium" class="flex-shrink-0">
            <n-tab-pane name="pending" tab="待回访">
              <template #tab>
                <div class="flex items-center gap-2">
                  <span>待回访</span>
                  <n-badge :value="followUpsStore.stats.pending" :max="99" color="#6366F1" show-zero />
                </div>
              </template>
            </n-tab-pane>
            <n-tab-pane name="completed" tab="已完成">
              <template #tab>
                <div class="flex items-center gap-2">
                  <span>已完成</span>
                  <n-badge :value="followUpsStore.stats.completed" :max="99" color="#10B981" show-zero />
                </div>
              </template>
            </n-tab-pane>
            <n-tab-pane name="cancelled" tab="已取消">
              <template #tab>
                <div class="flex items-center gap-2">
                  <span>已取消</span>
                  <n-badge :value="followUpsStore.stats.cancelled" :max="99" color="#6B7280" show-zero />
                </div>
              </template>
            </n-tab-pane>
          </n-tabs>
        </div>

        <div class="flex items-center gap-3 flex-wrap">
          <n-input
            v-model:value="searchKeyword"
            placeholder="搜索客户/宠物/任务标题"
            clearable
            size="small"
            class="!w-64"
          >
            <template #prefix>
              <n-icon>
                <SearchSharp />
              </n-icon>
            </template>
          </n-input>
          <n-select
            v-model:value="filterType"
            placeholder="回访类型"
            clearable
            size="small"
            class="!w-36"
            :options="typeOptions"
          />
          <n-select
            v-model:value="filterPriority"
            placeholder="优先级"
            clearable
            size="small"
            class="!w-32"
            :options="priorityOptions"
          />
          <n-date-picker
            v-model:value="dateRange"
            type="daterange"
            size="small"
            clearable
            placeholder="计划时间"
          />
        </div>
      </div>

      <div class="p-5">
        <div v-if="filteredTasks.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div
            v-for="task in filteredTasks"
            :key="task.id"
            class="task-card bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:border-gray-200 transition-all duration-300"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <div
                  class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  :class="getTypeBgClass(task.type)"
                >
                  <n-icon :size="20" :color="getTypeColor(task.type)">
                    <component :is="getTypeIcon(task.type)" />
                  </n-icon>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-semibold text-gray-800 truncate">{{ task.title }}</div>
                  <div class="text-xs text-gray-400 mt-0.5 font-mono">{{ task.taskNo }}</div>
                </div>
              </div>
              <n-tag
                v-if="task.status === 'pending'"
                :type="getPriorityTagType(task.priority)"
                size="small"
                round
                class="flex-shrink-0 ml-2"
              >
                {{ getPriorityLabel(task.priority) }}
              </n-tag>
              <n-tag
                v-else-if="task.status === 'completed'"
                type="success"
                size="small"
                round
                class="flex-shrink-0 ml-2"
              >
                已完成
              </n-tag>
              <n-tag
                v-else
                type="default"
                size="small"
                round
                class="flex-shrink-0 ml-2"
              >
                已取消
              </n-tag>
            </div>

            <div class="space-y-3 mb-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                  :style="{ backgroundColor: getAvatarColor(task.customer.name) }"
                >
                  {{ task.customer.name.charAt(0) }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium text-gray-800 truncate">{{ task.customer.name }}</div>
                  <div class="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                    <n-icon size="12">
                      <CallSharp />
                    </n-icon>
                    {{ task.customer.phone }}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center flex-shrink-0">
                  <n-icon size="16" color="#EC4899">
                    <PawSharp />
                  </n-icon>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium text-gray-800 truncate">{{ task.pet.name }}</div>
                  <div class="text-xs text-gray-500 mt-0.5 truncate">{{ task.pet.breed }}</div>
                </div>
              </div>
            </div>

            <div v-if="task.description" class="text-sm text-gray-600 mb-4 line-clamp-2 bg-gray-50 rounded-xl p-3">
              {{ task.description }}
            </div>

            <div v-if="task.lastRecord && task.status === 'completed'" class="mb-4">
              <div class="text-xs text-gray-500 mb-1.5">最近回访记录</div>
              <div class="text-sm text-gray-700 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <div class="line-clamp-2">{{ task.lastRecord }}</div>
                <div class="text-xs text-gray-400 mt-2">{{ task.lastRecordTime }}</div>
              </div>
            </div>

            <div v-if="task.cancelReason && task.status === 'cancelled'" class="mb-4">
              <div class="text-xs text-gray-500 mb-1.5">取消原因</div>
              <div class="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
                {{ task.cancelReason }}
              </div>
            </div>

            <div class="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
              <div class="flex items-center gap-1">
                <n-icon size="14">
                  <CalendarSharp />
                </n-icon>
                <span>{{ task.planTime }}</span>
              </div>
              <div v-if="task.source" class="text-gray-400">
                来源：{{ task.source }}
              </div>
            </div>

            <div class="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <n-button
                v-if="task.status === 'pending'"
                size="small"
                type="success"
                block
                @click="openCompleteDialog(task)"
              >
                <template #icon>
                  <n-icon size="14">
                    <CheckmarkSharp />
                  </n-icon>
                </template>
                标记完成
              </n-button>
              <n-button
                size="small"
                type="primary"
                block
                ghost
                @click="handleViewDetail(task)"
              >
                <template #icon>
                  <n-icon size="14">
                    <EyeSharp />
                  </n-icon>
                </template>
                查看详情
              </n-button>
              <n-button
                v-if="task.status === 'pending'"
                size="small"
                type="default"
                ghost
                @click="handleEdit(task)"
              >
                <template #icon>
                  <n-icon size="14">
                    <CreateSharp />
                  </n-icon>
                </template>
                编辑
              </n-button>
            </div>
          </div>
        </div>
        <n-empty v-else description="暂无回访任务" />
      </div>
    </n-card>

    <n-modal
      v-model:show="showCompleteDialog"
      preset="card"
      title="完成回访"
      style="width: 560px;"
      :mask-closable="false"
    >
      <div v-if="currentTask" class="space-y-4">
        <div class="bg-gray-50 rounded-xl p-4">
          <div class="text-sm font-medium text-gray-800 mb-1">{{ currentTask.title }}</div>
          <div class="text-xs text-gray-500">
            客户：{{ currentTask.customer.name }} · 宠物：{{ currentTask.pet.name }}
          </div>
        </div>

        <div>
          <div class="text-sm font-medium text-gray-700 mb-2">
            回访记录 <span class="text-red-500">*</span>
          </div>
          <n-input
            v-model:value="completeRecord"
            type="textarea"
            :rows="5"
            placeholder="请详细记录回访内容，包括客户反馈、宠物状态、后续建议等..."
            maxlength="1000"
            show-count
          />
        </div>

        <div>
          <div class="text-sm font-medium text-gray-700 mb-2">上传附件（可选）</div>
          <n-upload
            :max="5"
            :show-file-list="true"
            accept="image/*,.pdf,.doc,.docx"
          >
            <n-button size="small" type="primary" ghost>
              <template #icon>
                <n-icon size="14">
                  <CloudUploadSharp />
                </n-icon>
              </template>
              选择文件
            </n-button>
          </n-upload>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button size="small" @click="showCompleteDialog = false">取消</n-button>
          <n-button
            size="small"
            type="success"
            :disabled="!completeRecord.trim()"
            @click="handleComplete"
          >
            确认完成
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import type { FollowUpTask, FollowUpType, FollowUpPriority, FollowUpStatus } from '~/stores/followUps'
import {
  TimeSharp,
  CheckmarkCircleSharp,
  CloseCircleSharp,
  HeartSharp,
  SearchSharp,
  AddCircleSharp,
  CallSharp,
  PawSharp,
  CalendarSharp,
  EyeSharp,
  CreateSharp,
  CheckmarkSharp,
  CloudUploadSharp,
  CallOutline,
  ChatbubbleOutline,
  HomeOutline,
  HelpCircleOutline,
} from '@vicons/ionicons5'

const followUpsStore = useFollowUpsStore()
const message = useMessage()

const activeTab = ref<FollowUpStatus>('pending')
const searchKeyword = ref('')
const filterType = ref<FollowUpType | null>(null)
const filterPriority = ref<FollowUpPriority | null>(null)
const dateRange = ref<[number, number] | null>(null)

const showCompleteDialog = ref(false)
const currentTask = ref<FollowUpTask | null>(null)
const completeRecord = ref('')

const typeOptions = [
  { label: '电话回访', value: 'phone' },
  { label: '微信回访', value: 'wechat' },
  { label: '上门回访', value: 'visit' },
  { label: '其他方式', value: 'other' },
]

const priorityOptions = [
  { label: '高优先', value: 'high' },
  { label: '中优先', value: 'medium' },
  { label: '低优先', value: 'low' },
]

const currentList = computed(() => {
  switch (activeTab.value) {
    case 'pending':
      return followUpsStore.pendingTasks
    case 'completed':
      return followUpsStore.completedTasks
    case 'cancelled':
      return followUpsStore.cancelledTasks
    default:
      return followUpsStore.pendingTasks
  }
})

const filteredTasks = computed(() => {
  let list = [...currentList.value]

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(
      (t) =>
        t.customer.name.toLowerCase().includes(keyword) ||
        t.pet.name.toLowerCase().includes(keyword) ||
        t.title.toLowerCase().includes(keyword)
    )
  }

  if (filterType.value) {
    list = list.filter((t) => t.type === filterType.value)
  }

  if (filterPriority.value) {
    list = list.filter((t) => t.priority === filterPriority.value)
  }

  return list
})

function getAvatarColor(name: string) {
  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#F97316']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function getTypeIcon(type: FollowUpType) {
  switch (type) {
    case 'phone':
      return CallOutline
    case 'wechat':
      return ChatbubbleOutline
    case 'visit':
      return HomeOutline
    default:
      return HelpCircleOutline
  }
}

function getTypeColor(type: FollowUpType) {
  switch (type) {
    case 'phone':
      return '#3B82F6'
    case 'wechat':
      return '#10B981'
    case 'visit':
      return '#8B5CF6'
    default:
      return '#6B7280'
  }
}

function getTypeBgClass(type: FollowUpType) {
  switch (type) {
    case 'phone':
      return 'bg-blue-100'
    case 'wechat':
      return 'bg-emerald-100'
    case 'visit':
      return 'bg-purple-100'
    default:
      return 'bg-gray-100'
  }
}

function getPriorityTagType(priority: FollowUpPriority) {
  switch (priority) {
    case 'high':
      return 'error' as const
    case 'medium':
      return 'warning' as const
    case 'low':
      return 'default' as const
    default:
      return 'default' as const
  }
}

function getPriorityLabel(priority: FollowUpPriority) {
  switch (priority) {
    case 'high':
      return '高优先'
    case 'medium':
      return '中优先'
    case 'low':
      return '低优先'
    default:
      return ''
  }
}

function openCompleteDialog(task: FollowUpTask) {
  currentTask.value = task
  completeRecord.value = ''
  showCompleteDialog.value = true
}

function handleComplete() {
  if (!currentTask.value || !completeRecord.value.trim()) return

  followUpsStore.completeTask(currentTask.value.id, completeRecord.value.trim())
  message.success('回访记录已保存')
  showCompleteDialog.value = false
  currentTask.value = null
  completeRecord.value = ''
}

function handleViewDetail(task: FollowUpTask) {
  message.info(`查看任务详情：${task.title}`)
}

function handleEdit(task: FollowUpTask) {
  message.info(`编辑任务：${task.title}`)
}
</script>

<style scoped>
.follow-ups-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.task-card {
  position: relative;
}

.task-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%);
  border-radius: 2xl 2xl 0 0;
  opacity: 0;
  transition: opacity 0.3s;
}

.task-card:hover::before {
  opacity: 1;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
