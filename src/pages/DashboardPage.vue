<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, MessageSquare, AlertTriangle, Inbox } from 'lucide-vue-next'
import dayjs from 'dayjs'
import { requirementApi } from '@/api'
import type { Requirement, RequirementComment, RequirementStatus } from '@/types'

const router = useRouter()

interface CommentItem {
  id: number
  requirementId: number
  requirementTitle: string
  content: string
  authorName: string
  createdAt: string
  type: string
  department?: string
}

const isLoading = ref(false)
const requirements = ref<Requirement[]>([])

const pendingCount = ref(0)
const inProgressCount = ref(0)
const overdueCount = ref(0)
const dueTodayCount = ref(0)

const meetingSearch = ref('')
const meetingDateFilter = ref('')

const commentPersonFilter = ref('')
const commentReqFilter = ref('')

const delayDeptFilter = ref('')

const statItems = computed(() => [
  { label: '待处理需求', count: pendingCount.value, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { label: '进行中', count: inProgressCount.value, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { label: '已逾期', count: overdueCount.value, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  { label: '今日到期', count: dueTodayCount.value, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
])

const allComments = computed<CommentItem[]>(() => {
  const items: CommentItem[] = []
  for (const req of requirements.value) {
    if (!req.comments) continue
    for (const c of req.comments) {
      items.push({
        id: c.id,
        requirementId: req.id,
        requirementTitle: req.title,
        content: c.content,
        authorName: c.user?.name ?? '未知',
        createdAt: c.createdAt,
        type: c.type,
        department: req.department,
      })
    }
  }
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const meetingMinutes = computed(() => {
  return allComments.value.filter((c) => {
    if (c.type !== 'meeting_minute') return false
    if (meetingSearch.value && !c.content.includes(meetingSearch.value) && !c.requirementTitle.includes(meetingSearch.value)) return false
    if (meetingDateFilter.value && !dayjs(c.createdAt).isSame(dayjs(meetingDateFilter.value), 'day')) return false
    return true
  })
})

const commentRecords = computed(() => {
  return allComments.value.filter((c) => {
    if (c.type !== 'comment') return false
    if (commentPersonFilter.value && c.authorName !== commentPersonFilter.value) return false
    if (commentReqFilter.value && !c.requirementTitle.includes(commentReqFilter.value)) return false
    return true
  })
})

const delayReasons = computed(() => {
  const overdueIds = new Set(
    requirements.value
      .filter((r) => r.status === 'overdue')
      .map((r) => r.id)
  )
  return allComments.value.filter((c) => {
    if (c.type !== 'delay_reason') return false
    if (!overdueIds.has(c.requirementId)) return false
    if (delayDeptFilter.value && c.department !== delayDeptFilter.value) return false
    return true
  })
})

const allAuthors = computed(() => {
  const names = new Set(allComments.value.map((c) => c.authorName))
  return Array.from(names).sort()
})

const allDepartments = computed(() => {
  const depts = new Set(requirements.value.map((r) => r.department).filter(Boolean))
  return Array.from(depts).sort()
})

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

function goToRequirement(id: number) {
  router.push(`/requirements/${id}`)
}

function countDueToday(reqs: Requirement[]): number {
  const today = dayjs().format('YYYY-MM-DD')
  return reqs.filter((r) => dayjs(r.deadline).format('YYYY-MM-DD') === today).length
}

async function fetchData() {
  isLoading.value = true
  try {
    const [pendingRes, inProgressRes, overdueRes, allRes] = await Promise.all([
      requirementApi.list({ status: 'pending', perPage: 1 }),
      requirementApi.list({ status: 'in_progress', perPage: 1 }),
      requirementApi.list({ status: 'overdue', perPage: 1 }),
      requirementApi.list({ perPage: 200 }),
    ])
    pendingCount.value = pendingRes.data.total
    inProgressCount.value = inProgressRes.data.total
    overdueCount.value = overdueRes.data.total
    requirements.value = allRes.data.data
    dueTodayCount.value = countDueToday(allRes.data.data)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold text-slate-800 mb-6">值班看板</h1>

    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>

    <template v-else>
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div
          v-for="stat in statItems"
          :key="stat.label"
          class="card p-4 border"
          :class="stat.border"
        >
          <div class="text-sm text-slate-500 mb-1">{{ stat.label }}</div>
          <div class="text-2xl font-bold" :class="stat.color">{{ stat.count }}</div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div class="card flex flex-col">
          <div class="p-4 border-b border-slate-100">
            <h3 class="font-semibold text-slate-800 flex items-center gap-2 mb-3">
              <Search class="w-4 h-4 text-amber-500" />
              会议纪要
            </h3>
            <div class="space-y-2">
              <input v-model="meetingSearch" type="text" class="input" placeholder="搜索关键词..." />
              <input v-model="meetingDateFilter" type="date" class="input" />
            </div>
          </div>

          <div class="p-4 flex-1 overflow-y-auto max-h-[480px]">
            <div v-if="meetingMinutes.length === 0" class="flex flex-col items-center text-slate-400 py-8">
              <Inbox class="w-10 h-10 mb-2" />
              <span class="text-sm">暂无会议纪要</span>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="item in meetingMinutes"
                :key="item.id"
                class="p-3 bg-slate-50 rounded-lg"
              >
                <a
                  class="text-sm font-medium text-amber-600 hover:text-amber-700 cursor-pointer block mb-1 truncate"
                  @click.prevent="goToRequirement(item.requirementId)"
                >
                  {{ item.requirementTitle }}
                </a>
                <p class="text-sm text-slate-600 line-clamp-2">{{ item.content }}</p>
                <div class="mt-1.5 text-xs text-slate-400">
                  {{ item.authorName }} · {{ formatDate(item.createdAt) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card flex flex-col">
          <div class="p-4 border-b border-slate-100">
            <h3 class="font-semibold text-slate-800 flex items-center gap-2 mb-3">
              <MessageSquare class="w-4 h-4 text-amber-500" />
              评论记录
            </h3>
            <div class="space-y-2">
              <select v-model="commentPersonFilter" class="select">
                <option value="">全部人员</option>
                <option v-for="name in allAuthors" :key="name" :value="name">{{ name }}</option>
              </select>
              <input v-model="commentReqFilter" type="text" class="input" placeholder="搜索需求标题..." />
            </div>
          </div>

          <div class="p-4 flex-1 overflow-y-auto max-h-[480px]">
            <div v-if="commentRecords.length === 0" class="flex flex-col items-center text-slate-400 py-8">
              <Inbox class="w-10 h-10 mb-2" />
              <span class="text-sm">暂无评论记录</span>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="item in commentRecords"
                :key="item.id"
                class="p-3 bg-slate-50 rounded-lg"
              >
                <a
                  class="text-sm font-medium text-amber-600 hover:text-amber-700 cursor-pointer block mb-1 truncate"
                  @click.prevent="goToRequirement(item.requirementId)"
                >
                  {{ item.requirementTitle }}
                </a>
                <p class="text-sm text-slate-600 line-clamp-2">{{ item.content }}</p>
                <div class="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                  <div class="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {{ item.authorName.slice(0, 1) }}
                  </div>
                  <span>{{ item.authorName }}</span>
                  <span>·</span>
                  <span>{{ formatDate(item.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card flex flex-col">
          <div class="p-4 border-b border-slate-100">
            <h3 class="font-semibold text-slate-800 flex items-center gap-2 mb-3">
              <AlertTriangle class="w-4 h-4 text-red-500" />
              延期原因
            </h3>
            <div>
              <select v-model="delayDeptFilter" class="select">
                <option value="">全部部门</option>
                <option v-for="dept in allDepartments" :key="dept" :value="dept">{{ dept }}</option>
              </select>
            </div>
          </div>

          <div class="p-4 flex-1 overflow-y-auto max-h-[480px]">
            <div v-if="delayReasons.length === 0" class="flex flex-col items-center text-slate-400 py-8">
              <Inbox class="w-10 h-10 mb-2" />
              <span class="text-sm">暂无延期原因</span>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="item in delayReasons"
                :key="item.id"
                class="p-3 bg-red-50 border border-red-100 rounded-lg"
              >
                <a
                  class="text-sm font-medium text-red-600 hover:text-red-700 cursor-pointer block mb-1 truncate"
                  @click.prevent="goToRequirement(item.requirementId)"
                >
                  {{ item.requirementTitle }}
                </a>
                <p class="text-sm text-slate-700 line-clamp-2">{{ item.content }}</p>
                <div class="mt-1.5 text-xs text-slate-400">
                  {{ item.authorName }} · {{ formatDate(item.createdAt) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
