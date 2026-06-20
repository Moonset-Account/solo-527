<template>
  <div class="space-y-6">
    <section class="bg-white rounded-xl shadow-sm border p-5">
      <h2 class="text-lg font-semibold mb-4">🗳️ 参与投票 · 请输入议题编号进行投票</h2>
      <div class="grid md:grid-cols-4 gap-3">
        <input v-model="issueCode" placeholder="请输入议题编号（如YT2025xxxx）" class="px-3 py-2 border rounded md:col-span-2" />
        <input v-model="phone" placeholder="您的手机号" class="px-3 py-2 border rounded" />
        <button class="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700" @click="searchIssue">查询并投票</button>
      </div>
      <p class="mt-2 text-xs text-gray-500">提示：首次投票需提供手机号验证居民身份；同一议题可改投（覆盖上一次意见）。</p>
    </section>

    <section v-if="voteIssue" class="bg-white rounded-xl shadow-sm border p-6">
      <div class="flex items-start gap-6">
        <div class="flex-1 space-y-3">
          <div class="flex items-center gap-2">
            <span class="text-sm font-mono text-primary-600">{{ voteIssue.code }}</span>
            <span :class="'px-2 py-0.5 rounded text-xs font-medium ' + STATUS_COLORS[voteIssue.status]">{{ STATUS_LABELS[voteIssue.status] }}</span>
            <span class="text-xs text-gray-500">{{ voteIssue.category }}</span>
            <span v-if="voteIssue.voteEndAt" class="text-xs text-red-500">投票截止：{{ fmtDateTime(voteIssue.voteEndAt) }}</span>
          </div>
          <h3 class="text-xl font-semibold">{{ voteIssue.title }}</h3>
          <p class="text-gray-700 whitespace-pre-wrap leading-relaxed">{{ voteIssue.description }}</p>
          <div class="grid md:grid-cols-2 gap-3 text-sm text-gray-600">
            <div>社区：{{ voteIssue.community || '-' }}｜网格：{{ voteIssue.gridNo || '-' }}</div>
            <div>位置：{{ voteIssue.location || '-' }}｜负责人：{{ voteIssue.handler || '-' }}</div>
          </div>
          <PhotoGrid v-if="voteIssue.photos?.length" :photos="voteIssue.photos" title="📷 现场/设施照片" @preview="previewUrl = $event" />
        </div>
        <div v-if="voteIssue.votes?.length" class="w-56 flex-shrink-0 bg-gray-50 rounded-lg p-4">
          <div class="text-sm font-semibold text-gray-700 mb-3">投票概况</div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span>👍 赞成</span><span class="font-semibold">{{ stats.agree }}</span></div>
            <div class="w-full bg-gray-200 rounded h-2"><div class="bg-green-500 h-2 rounded" :style="{ width: pct('agree') + '%' }"></div></div>
            <div class="flex justify-between"><span>👎 反对</span><span class="font-semibold">{{ stats.disagree }}</span></div>
            <div class="w-full bg-gray-200 rounded h-2"><div class="bg-red-500 h-2 rounded" :style="{ width: pct('disagree') + '%' }"></div></div>
            <div class="flex justify-between"><span>🫥 弃权</span><span class="font-semibold">{{ stats.abstain }}</span></div>
            <div class="w-full bg-gray-200 rounded h-2"><div class="bg-gray-400 h-2 rounded" :style="{ width: pct('abstain') + '%' }"></div></div>
            <div class="pt-2 border-t text-center text-xs text-gray-500">共 {{ voteIssue.votes.length }} 人投票</div>
          </div>
        </div>
      </div>

      <div class="mt-6 border-t pt-5">
        <h4 class="text-sm font-semibold text-gray-700 mb-3">请选择您的意见</h4>
        <div class="grid md:grid-cols-3 gap-3 mb-3">
          <label v-for="o in options" :key="o.value" class="cursor-pointer">
            <input type="radio" v-model="voteForm.option" :value="o.value" class="mr-2" />
            <span class="font-medium">{{ o.label }}</span>
            <span class="text-xs text-gray-500 ml-1">{{ o.tip }}</span>
          </label>
        </div>
        <textarea v-model="voteForm.comment" placeholder="补充意见（可选）" class="w-full px-3 py-2 border rounded text-sm" rows="3"></textarea>
        <div class="mt-3 flex items-center gap-3">
          <input v-if="!phone" v-model="voteForm.phone" placeholder="手机号（必填）" class="px-3 py-2 border rounded w-48 text-sm" />
          <input v-model="voteForm.name" placeholder="姓名（可选）" class="px-3 py-2 border rounded w-40 text-sm" />
          <button class="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700" :disabled="submitting" @click="submitVote">
            {{ submitting ? '提交中...' : '确认投票' }}
          </button>
        </div>
      </div>
    </section>

    <div v-if="previewUrl" class="fixed inset-0 bg-black/80 z-50 grid place-items-center p-4 cursor-zoom-out" @click.self="previewUrl = null">
      <img :src="previewUrl" class="max-w-full max-h-[90vh] rounded-lg" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Issue } from '~/types'
useHead({ title: '参与投票 - 居民议题闭环看板' })
const issueCode = ref('')
const phone = ref('')
const voteIssue = ref<Issue | null>(null)
const previewUrl = ref('')
const submitting = ref(false)
const options = [
  { value: 'AGREE', label: '赞成', tip: '同意按当前方案处置' },
  { value: 'DISAGREE', label: '反对', tip: '方案需要调整' },
  { value: 'ABSTAIN', label: '弃权', tip: '不参与本次意见' }
]
const voteForm = reactive({ option: 'AGREE' as any, comment: '', phone: '', name: '' })

const stats = computed(() => {
  const v = voteIssue.value?.votes || []
  const count = (o: string) => v.filter(x => x.option === o).length
  return { agree: count('AGREE'), disagree: count('DISAGREE'), abstain: count('ABSTAIN') }
})
const pct = (k: keyof typeof stats.value) => {
  const total = voteIssue.value?.votes?.length || 0
  if (!total) return 0
  return Math.round((stats.value[k] / total) * 100)
}

const searchIssue = async () => {
  if (!issueCode.value) return alert('请输入议题编号')
  const q = new URLSearchParams()
  if (phone.value) q.set('phone', phone.value)
  try {
    voteIssue.value = await request<Issue>(`/public/issues/${issueCode.value.trim()}?${q.toString()}`)
    voteForm.phone = phone.value
  } catch (e: any) {}
}
const submitVote = async () => {
  if (!voteIssue.value) return alert('请先查询议题')
  const p = voteForm.phone || phone.value
  if (!p) return alert('请提供手机号')
  submitting.value = true
  try {
    await request(`/issues/${voteIssue.value.id}/vote`, {
      method: 'POST',
      body: { residentPhone: p, residentName: voteForm.name, option: voteForm.option, comment: voteForm.comment }
    })
    alert('投票成功，感谢您的参与！')
    await searchIssue()
  } finally { submitting.value = false }
}
</script>
