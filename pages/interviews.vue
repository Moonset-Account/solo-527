<template>
  <div>
    <div class="card mb-6">
      <div class="flex items-end gap-4 flex-wrap">
        <div>
          <label class="label">状态</label>
          <select v-model="filters.status" class="input">
            <option value="ALL">全部状态</option>
            <option v-for="(label, key) in interviewStatusLabels" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
        <div>
          <label class="label">开始日期</label>
          <input v-model="filters.from" type="date" class="input" />
        </div>
        <div>
          <label class="label">结束日期</label>
          <input v-model="filters.to" type="date" class="input" />
        </div>
        <button class="btn-primary" @click="loadData">筛选</button>
      </div>
    </div>

    <div class="card">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b border-gray-200">
            <th class="pb-3">面试标题</th>
            <th class="pb-3">候选人</th>
            <th class="pb-3">面试官</th>
            <th class="pb-3">类型</th>
            <th class="pb-3">状态</th>
            <th class="pb-3">时间</th>
            <th class="pb-3">质量评分</th>
            <th class="pb-3">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in interviews" :key="i.id" class="border-b border-gray-50 hover:bg-gray-50">
            <td class="py-3 font-medium text-gray-800">{{ i.title }}</td>
            <td class="py-3">
              <NuxtLink :to="`/candidates/${i.candidateId}`" class="text-primary-600 hover:underline">
                {{ i.candidate?.name }}
              </NuxtLink>
            </td>
            <td class="py-3 text-gray-700">{{ i.interviewer?.name }}</td>
            <td class="py-3"><BadgeTag :text="interviewTypeLabels[i.type]" /></td>
            <td class="py-3"><BadgeTag :text="interviewStatusLabels[i.status]" :color-class="interviewStatusColors[i.status]" /></td>
            <td class="py-3 text-gray-600">{{ formatDate(i.scheduledAt) }}</td>
            <td class="py-3">
              <template v-if="i.qualityScore !== null">
                <span class="font-semibold text-yellow-600">{{ i.qualityScore }}/5</span>
              </template>
              <span v-else class="text-gray-400">未评</span>
            </td>
            <td class="py-3">
              <button v-if="i.status === 'SCHEDULED'" class="text-red-600 hover:text-red-700 text-sm font-medium" @click="markNoShow(i)">
                标记爽约
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="interviews.length === 0" class="py-12 text-center text-gray-400">暂无面试数据</div>
    </div>

    <div v-if="showNoShowModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showNoShowModal = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">标记候选人爽约</h3>
        <div class="space-y-4">
          <div>
            <label class="label">爽约原因</label>
            <textarea v-model="noShowForm.reason" class="input" rows="3" placeholder="候选人未按时出席等"></textarea>
          </div>
          <div>
            <label class="label">处置动作</label>
            <select v-model="noShowForm.blockingAction" class="input">
              <option value="">无</option>
              <option v-for="(label, key) in appliedActionLabels" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
          <div>
            <label class="label">是否首次爽约</label>
            <input type="checkbox" v-model="noShowForm.isFirstTime" class="w-5 h-5" />
          </div>
          <div>
            <label class="label">备注</label>
            <textarea v-model="noShowForm.note" class="input" rows="2"></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button class="btn-secondary" @click="showNoShowModal = false">取消</button>
          <button class="btn-danger" @click="confirmNoShow">确认标记爽约</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { interviewStatusLabels, interviewStatusColors, interviewTypeLabels, appliedActionLabels, formatDate } from '~/composables/useConstants'
import { useInterviewStore } from '~/stores/interview'

const interviewStore = useInterviewStore()
const interviews = computed(() => interviewStore.interviews)

const filters = reactive({ status: 'ALL', from: '', to: '' })
const showNoShowModal = ref(false)
const currentInterview = ref<any>(null)
const noShowForm = reactive({ reason: '', blockingAction: '', isFirstTime: true, handledBy: 'admin', note: '' })

function markNoShow(interview: any) {
  currentInterview.value = interview
  showNoShowModal.value = true
  Object.assign(noShowForm, { reason: '', blockingAction: '', isFirstTime: true, handledBy: 'admin', note: '' })
}

async function confirmNoShow() {
  if (!currentInterview.value) return
  try {
    await interviewStore.markNoShow(currentInterview.value.id, noShowForm)
    showNoShowModal.value = false
    loadData()
  } catch (e: any) {
    alert(e?.statusMessage || '操作失败')
  }
}

function loadData() {
  const params: Record<string, any> = {}
  if (filters.status !== 'ALL') params.status = filters.status
  if (filters.from) params.from = filters.from
  if (filters.to) params.to = filters.to
  interviewStore.fetchInterviews(params)
}

onMounted(loadData)
</script>
