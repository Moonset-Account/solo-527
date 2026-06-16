<template>
  <div>
    <div class="card mb-6">
      <div class="flex items-end gap-4">
        <div>
          <label class="label">状态</label>
          <select v-model="filters.status" class="input">
            <option value="ALL">全部状态</option>
            <option v-for="(label, key) in assessmentStatusLabels" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
        <div>
          <label class="label">类型</label>
          <select v-model="filters.type" class="input">
            <option value="ALL">全部类型</option>
            <option v-for="(label, key) in assessmentTypeLabels" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
        <button class="btn-primary" @click="loadData">筛选</button>
      </div>
    </div>

    <div class="card">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b border-gray-200">
            <th class="pb-3">测评标题</th>
            <th class="pb-3">候选人</th>
            <th class="pb-3">类型</th>
            <th class="pb-3">状态</th>
            <th class="pb-3">测前分数</th>
            <th class="pb-3">测后分数</th>
            <th class="pb-3">分数变化</th>
            <th class="pb-3">创建时间</th>
            <th class="pb-3">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in assessments" :key="a.id" class="border-b border-gray-50 hover:bg-gray-50">
            <td class="py-3 font-medium text-gray-800">{{ a.title }}</td>
            <td class="py-3">
              <NuxtLink :to="`/candidates/${a.candidateId}`" class="text-primary-600 hover:underline">
                {{ a.candidate?.name }}
              </NuxtLink>
            </td>
            <td class="py-3"><BadgeTag :text="assessmentTypeLabels[a.type]" /></td>
            <td class="py-3"><BadgeTag :text="assessmentStatusLabels[a.status]" /></td>
            <td class="py-3 text-gray-700">{{ a.scoreBefore ?? '-' }}</td>
            <td class="py-3 text-gray-700 font-semibold">{{ a.scoreAfter ?? '-' }}</td>
            <td class="py-3">
              <template v-if="a.scoreBefore !== null && a.scoreAfter !== null">
                <span :class="(a.scoreAfter - a.scoreBefore) >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                  {{ (a.scoreAfter - a.scoreBefore) >= 0 ? '+' : '' }}{{ (a.scoreAfter - a.scoreBefore).toFixed(1) }}
                </span>
              </template>
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="py-3 text-gray-500">{{ formatDateShort(a.createdAt) }}</td>
            <td class="py-3">
              <button v-if="a.status === 'IN_PROGRESS' || a.status === 'PENDING'" class="text-primary-600 hover:text-primary-700 text-sm font-medium" @click="openCompleteModal(a)">
                完成测评
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="assessments.length === 0" class="py-12 text-center text-gray-400">暂无测评数据</div>
    </div>

    <div v-if="showCompleteModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showCompleteModal = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold mb-4">完成测评 - {{ currentAssessment?.title }}</h3>
        <div class="space-y-4">
          <div>
            <label class="label">测后评分</label>
            <input v-model.number="completeForm.scoreAfter" type="number" class="input" min="0" max="100" step="0.5" />
          </div>
          <div>
            <label class="label">题目(后) JSON</label>
            <textarea v-model="completeForm.questionsAfterText" class="input font-mono text-xs" rows="4" placeholder='{"q1": "答案"}'></textarea>
          </div>
          <div>
            <label class="label">答案(后) JSON</label>
            <textarea v-model="completeForm.answersAfterText" class="input font-mono text-xs" rows="4" placeholder='{"q1": "答案内容"}'></textarea>
          </div>
          <div>
            <label class="label">备注</label>
            <textarea v-model="completeForm.note" class="input" rows="3"></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button class="btn-secondary" @click="showCompleteModal = false">取消</button>
          <button class="btn-primary" @click="confirmComplete">确认完成</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { assessmentStatusLabels, assessmentTypeLabels, formatDateShort } from '~/composables/useConstants'

const assessments = ref<any[]>([])
const filters = reactive({ status: 'ALL', type: 'ALL' })
const showCompleteModal = ref(false)
const currentAssessment = ref<any>(null)
const completeForm = reactive({ scoreAfter: 0, questionsAfterText: '', answersAfterText: '', note: '' })

function openCompleteModal(a: any) {
  currentAssessment.value = a
  Object.assign(completeForm, { scoreAfter: 0, questionsAfterText: '', answersAfterText: '', note: '' })
  showCompleteModal.value = true
}

async function confirmComplete() {
  if (!currentAssessment.value) return
  let questionsAfter = null, answersAfter = null
  try {
    if (completeForm.questionsAfterText) questionsAfter = JSON.parse(completeForm.questionsAfterText)
    if (completeForm.answersAfterText) answersAfter = JSON.parse(completeForm.answersAfterText)
  } catch {
    alert('JSON格式不正确')
    return
  }
  try {
    await $fetch(`/api/assessments/${currentAssessment.value.id}/complete`, {
      method: 'POST',
      body: {
        scoreAfter: completeForm.scoreAfter,
        questionsAfter,
        answersAfter,
        note: completeForm.note
      }
    })
    showCompleteModal.value = false
    loadData()
  } catch (e: any) {
    alert(e?.statusMessage || '操作失败')
  }
}

async function loadData() {
  const params: Record<string, any> = {}
  if (filters.status !== 'ALL') params.status = filters.status
  if (filters.type !== 'ALL') params.type = filters.type
  assessments.value = await $fetch('/api/assessments', { params })
}

onMounted(loadData)
</script>
