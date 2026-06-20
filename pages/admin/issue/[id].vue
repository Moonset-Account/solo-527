<template>
  <div v-if="issue" class="space-y-6">
    <nav class="text-sm text-gray-500">
      <NuxtLink to="/admin" class="hover:underline">后台</NuxtLink>
      <span class="mx-2">/</span>
      <span class="text-gray-800">{{ issue.code }}</span>
      <span class="ml-3"><a :href="`/api/issues/${issue.id}/export-xlsx`" target="_blank" class="text-green-600 hover:underline">📄 下载单据</a></span>
      <span class="ml-3"><NuxtLink :to="`/issue/${issue.id}`" class="text-primary-600 hover:underline">居民预览 →</NuxtLink></span>
    </nav>

    <section class="bg-white rounded-xl shadow-sm border p-6">
      <div class="flex items-start justify-between gap-6">
        <div class="flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-mono text-sm text-primary-600">{{ issue.code }}</span>
            <span :class="'px-2 py-0.5 rounded text-xs font-medium ' + STATUS_COLORS[issue.status]">{{ STATUS_LABELS[issue.status] }}</span>
            <span :class="'text-xs font-medium ' + PRIORITY_COLORS[issue.priority]">● {{ PRIORITY_LABELS[issue.priority] }}</span>
            <span class="text-xs text-gray-500">{{ issue.category }}</span>
            <span v-if="issue.published" class="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">[已公示]</span>
          </div>
          <h1 class="mt-2 text-2xl font-bold">{{ issue.title }}</h1>
          <p class="mt-3 text-gray-700 whitespace-pre-wrap leading-relaxed">{{ issue.description }}</p>
          <div class="mt-3 grid md:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-gray-600">
            <div>社区：{{ issue.community || '-' }}</div>
            <div>网格编号：{{ issue.gridNo || '-' }}</div>
            <div>位置：{{ issue.location || '-' }}</div>
            <div>反映人：{{ issue.reporter?.name || '-' }}（{{ issue.reporter?.phone || '-' }}）</div>
            <div>负责人：{{ issue.handler || '-' }}</div>
            <div>创建：{{ fmtDateTime(issue.createdAt) }}｜更新：{{ fmtDateTime(issue.updatedAt) }}</div>
            <div>投票截止：{{ fmtDateTime(issue.voteEndAt) }}</div>
            <div>整改截止：{{ fmtDateTime(issue.rectifyDeadline) }}</div>
          </div>
        </div>
        <div class="w-40 flex-shrink-0">
          <button class="w-full px-3 py-2 border rounded hover:bg-gray-50 text-sm mb-2" @click="showEdit = true">编辑议题基础信息</button>
          <button class="w-full px-3 py-2 text-sm rounded" :class="issue.published ? 'bg-green-50 border text-green-700' : 'border hover:bg-gray-50'" @click="togglePublish">
            {{ issue.published ? '✓ 已公示（点击取消）' : '发布公示 →' }}
          </button>
        </div>
      </div>
      <PhotoGrid v-if="issue.photos?.length" class="mt-4" :photos="issue.photos" title="📷 问题现场/设施照片" @preview="preview = $event" />
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <section class="bg-white rounded-xl shadow-sm border p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">🔧 整改措施</h3>
            <button class="px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700" @click="showRectify = true">+ 添加整改</button>
          </div>
          <div v-if="issue.rectifications?.length" class="space-y-3">
            <div v-for="r in issue.rectifications" :key="r.id" class="p-4 rounded-lg border" :class="r.completed ? 'bg-green-50' : 'bg-yellow-50'">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-medium text-sm">{{ r.completed ? '✅ 已完成' : '⏳ 进行中' }}</span>
                    <span class="text-xs text-gray-500">负责人：{{ r.handler || '-' }}</span>
                    <span class="text-xs text-gray-500">创建：{{ fmtDateTime(r.createdAt) }}</span>
                    <span class="text-xs text-gray-500">截止：{{ fmtDateTime(r.deadline) }}</span>
                    <span v-if="r.completedAt" class="text-xs text-green-600">完成：{{ fmtDateTime(r.completedAt) }}</span>
                  </div>
                  <p class="mt-2 text-gray-800">{{ r.action }}</p>
                  <p v-if="r.note" class="mt-2 text-sm text-gray-600 bg-white rounded p-2">📝 {{ r.note }}</p>
                  <PhotoGrid v-if="r.photos?.length" class="mt-2" :photos="r.photos" title="整改过程/结果照片" @preview="preview = $event" />
                </div>
                <button v-if="!r.completed" class="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 whitespace-nowrap" @click="completeRect(r)">标记完成</button>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-sm text-gray-400">暂无整改措施，点击右上角添加</div>
        </section>

        <section class="bg-white rounded-xl shadow-sm border p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">📡 关联网格事件</h3>
            <button class="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700" @click="showGridEvent = true">+ 关联事件</button>
          </div>
          <div v-if="issue.gridEvents?.length" class="space-y-3">
            <div v-for="g in issue.gridEvents" :key="g.id" class="p-3 border rounded-lg">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="px-2 py-0.5 rounded text-xs font-medium" :class="g.handled ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'">{{ g.handled ? '已处置' : '待处置' }}</span>
                    <span class="text-sm font-medium">{{ g.eventType }}</span>
                    <span class="text-xs text-gray-500">网格#{{ g.gridNo }}</span>
                    <span class="text-xs text-gray-400">{{ fmtDateTime(g.occurredAt) }}</span>
                  </div>
                  <p class="mt-1.5 text-sm text-gray-700">{{ g.description }}</p>
                  <div class="mt-1.5 text-xs text-gray-500 flex items-center gap-3 flex-wrap">
                    <span>处置人：{{ g.handler || '-' }}</span>
                    <span v-if="g.handledAt">处置时间：{{ fmtDateTime(g.handledAt) }}</span>
                    <span v-if="g.patrolCovered" class="text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">✓ 已计入巡逻覆盖</span>
                  </div>
                </div>
                <button v-if="!g.handled" class="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 whitespace-nowrap" @click="handleGrid(g)">处置完成</button>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-6 text-sm text-gray-400">尚未关联网格事件</div>
        </section>

        <section class="bg-white rounded-xl shadow-sm border p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">🗳️ 居民投票</h3>
            <div v-if="issue.voteEndAt" class="text-xs text-gray-500">截止：{{ fmtDateTime(issue.voteEndAt) }}</div>
          </div>
          <div v-if="issue.votes?.length" class="grid grid-cols-3 gap-3 mb-4">
            <div class="p-3 bg-green-50 rounded text-center">
              <div class="text-2xl font-bold text-green-600">{{ count('AGREE') }}</div>
              <div class="text-xs text-gray-500">赞成 {{ pct('AGREE') }}%</div>
            </div>
            <div class="p-3 bg-red-50 rounded text-center">
              <div class="text-2xl font-bold text-red-600">{{ count('DISAGREE') }}</div>
              <div class="text-xs text-gray-500">反对 {{ pct('DISAGREE') }}%</div>
            </div>
            <div class="p-3 bg-gray-50 rounded text-center">
              <div class="text-2xl font-bold text-gray-600">{{ count('ABSTAIN') }}</div>
              <div class="text-xs text-gray-500">弃权 {{ pct('ABSTAIN') }}%</div>
            </div>
          </div>
          <div v-if="issue.votes?.length" class="max-h-64 overflow-y-auto border rounded">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 sticky top-0"><tr class="text-left">
                <th class="p-2">时间</th><th class="p-2">居民</th><th class="p-2">意见</th><th class="p-2">备注</th>
              </tr></thead>
              <tbody>
                <tr v-for="v in issue.votes" :key="v.id" class="border-t">
                  <td class="p-2 text-gray-500 text-xs">{{ fmtDateTime(v.createdAt) }}</td>
                  <td class="p-2">{{ v.resident?.name }}<span class="text-xs text-gray-400 ml-1">{{ v.resident?.phone }}</span></td>
                  <td class="p-2"><span :class="optColor(v.option)">{{ optLabel(v.option) }}</span></td>
                  <td class="p-2 text-gray-600 text-xs">{{ v.comment || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="!issue.votes?.length" class="text-center py-6 text-sm text-gray-400">暂无投票</div>
        </section>
      </div>

      <div class="space-y-6">
        <section class="bg-white rounded-xl shadow-sm border p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">✅ 复查</h3>
            <button class="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700" @click="showReview = true">+ 发起复查</button>
          </div>
          <div v-if="issue.reviews?.length" class="space-y-3">
            <div v-for="r in issue.reviews" :key="r.id" class="p-3 rounded-lg border" :class="r.result === 'PASS' ? 'bg-emerald-50 border-emerald-200' : r.result === 'FAIL' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-sm">{{ r.result === 'PASS' ? '✅ 通过' : r.result === 'FAIL' ? '❌ 未通过' : '🟡 需改进' }}</span>
                  <span v-if="r.rated" class="text-yellow-500 text-sm">★ {{ r.rated }}/5</span>
                </div>
                <span class="text-xs text-gray-500">{{ fmtDateTime(r.reviewedAt) }}</span>
              </div>
              <div class="mt-1.5 text-xs text-gray-500">复查人：{{ r.reviewer }}</div>
              <p v-if="r.comment" class="mt-2 text-sm text-gray-700">{{ r.comment }}</p>
              <PhotoGrid v-if="r.photos?.length" class="mt-2" :photos="r.photos" title="复查现场照片" @preview="preview = $event" />
            </div>
          </div>
          <div v-else class="text-center py-6 text-sm text-gray-400">暂无复查记录</div>
        </section>

        <section class="bg-white rounded-xl shadow-sm border p-6">
          <Timeline :logs="issue.operationLogs" />
        </section>
      </div>
    </div>

    <!-- 编辑 -->
    <div v-if="showEdit" class="fixed inset-0 bg-black/50 z-50 grid place-items-center p-4" @click.self="showEdit = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <h3 class="text-xl font-semibold mb-4">编辑议题信息</h3>
        <div class="grid md:grid-cols-2 gap-3">
          <div class="md:col-span-2"><label class="text-sm text-gray-600">标题</label><input v-model="editForm.title" class="w-full mt-1 px-3 py-2 border rounded" /></div>
          <div class="md:col-span-2"><label class="text-sm text-gray-600">描述</label><textarea v-model="editForm.description" rows="3" class="w-full mt-1 px-3 py-2 border rounded"></textarea></div>
          <div><label class="text-sm text-gray-600">分类</label><select v-model="editForm.category" class="w-full mt-1 px-3 py-2 border rounded"><option v-for="c in categories" :key="c">{{ c }}</option></select></div>
          <div><label class="text-sm text-gray-600">优先级</label><select v-model="editForm.priority" class="w-full mt-1 px-3 py-2 border rounded"><option v-for="(v,k) in PRIORITY_LABELS" :key="k" :value="k">{{ v }}</option></select></div>
          <div><label class="text-sm text-gray-600">状态</label><select v-model="editForm.status" class="w-full mt-1 px-3 py-2 border rounded"><option v-for="(v,k) in STATUS_LABELS" :key="k" :value="k">{{ v }}</option></select></div>
          <div><label class="text-sm text-gray-600">负责人</label><input v-model="editForm.handler" class="w-full mt-1 px-3 py-2 border rounded" /></div>
          <div><label class="text-sm text-gray-600">社区</label><input v-model="editForm.community" class="w-full mt-1 px-3 py-2 border rounded" /></div>
          <div><label class="text-sm text-gray-600">网格</label><input v-model="editForm.gridNo" class="w-full mt-1 px-3 py-2 border rounded" /></div>
          <div class="md:col-span-2"><label class="text-sm text-gray-600">位置</label><input v-model="editForm.location" class="w-full mt-1 px-3 py-2 border rounded" /></div>
          <div><label class="text-sm text-gray-600">投票截止</label><input v-model="editForm.voteEndAt" type="datetime-local" class="w-full mt-1 px-3 py-2 border rounded" /></div>
          <div><label class="text-sm text-gray-600">整改截止</label><input v-model="editForm.rectifyDeadline" type="datetime-local" class="w-full mt-1 px-3 py-2 border rounded" /></div>
        </div>
        <div class="mt-5 flex justify-end gap-3">
          <button class="px-4 py-2 border rounded hover:bg-gray-50" @click="showEdit = false">取消</button>
          <button class="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700" @click="saveEdit">保存</button>
        </div>
      </div>
    </div>

    <!-- 整改 -->
    <div v-if="showRectify" class="fixed inset-0 bg-black/50 z-50 grid place-items-center p-4" @click.self="showRectify = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-semibold mb-4">添加整改措施</h3>
        <div class="space-y-3">
          <div><label class="text-sm text-gray-600">整改措施 *</label><textarea v-model="rectForm.action" rows="3" class="w-full mt-1 px-3 py-2 border rounded"></textarea></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="text-sm text-gray-600">负责人</label><input v-model="rectForm.handler" class="w-full mt-1 px-3 py-2 border rounded" /></div>
            <div><label class="text-sm text-gray-600">截止时间</label><input v-model="rectForm.deadline" type="datetime-local" class="w-full mt-1 px-3 py-2 border rounded" /></div>
          </div>
          <div><label class="text-sm text-gray-600">备注</label><textarea v-model="rectForm.note" rows="2" class="w-full mt-1 px-3 py-2 border rounded"></textarea></div>
          <div><label class="text-sm text-gray-600">整改照片 URL（每行一条）</label><textarea v-model="rectForm.photosText" rows="3" class="w-full mt-1 px-3 py-2 border rounded font-mono text-xs"></textarea></div>
        </div>
        <div class="mt-5 flex justify-end gap-3">
          <button class="px-4 py-2 border rounded hover:bg-gray-50" @click="showRectify = false">取消</button>
          <button class="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700" @click="saveRectify">提交</button>
        </div>
      </div>
    </div>

    <!-- 复查 -->
    <div v-if="showReview" class="fixed inset-0 bg-black/50 z-50 grid place-items-center p-4" @click.self="showReview = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-semibold mb-4">发起复查</h3>
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div><label class="text-sm text-gray-600">复查人 *</label><input v-model="reviewForm.reviewer" class="w-full mt-1 px-3 py-2 border rounded" /></div>
            <div><label class="text-sm text-gray-600">复查结果</label><select v-model="reviewForm.result" class="w-full mt-1 px-3 py-2 border rounded"><option value="PASS">通过</option><option value="IMPROVE">需改进</option><option value="FAIL">未通过</option></select></div>
          </div>
          <div><label class="text-sm text-gray-600">评分 (1-5)</label><input v-model.number="reviewForm.rated" type="number" min="1" max="5" class="w-full mt-1 px-3 py-2 border rounded" /></div>
          <div><label class="text-sm text-gray-600">复查意见</label><textarea v-model="reviewForm.comment" rows="3" class="w-full mt-1 px-3 py-2 border rounded"></textarea></div>
          <div><label class="text-sm text-gray-600">复查照片 URL（每行一条）</label><textarea v-model="reviewForm.photosText" rows="3" class="w-full mt-1 px-3 py-2 border rounded font-mono text-xs"></textarea></div>
        </div>
        <div class="mt-5 flex justify-end gap-3">
          <button class="px-4 py-2 border rounded hover:bg-gray-50" @click="showReview = false">取消</button>
          <button class="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700" @click="saveReview">提交</button>
        </div>
      </div>
    </div>

    <!-- 网格事件 -->
    <div v-if="showGridEvent" class="fixed inset-0 bg-black/50 z-50 grid place-items-center p-4" @click.self="showGridEvent = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-semibold mb-4">关联网格事件</h3>
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div><label class="text-sm text-gray-600">事件类型 *</label><input v-model="gridForm.eventType" class="w-full mt-1 px-3 py-2 border rounded" placeholder="如：设施损坏、噪音扰民" /></div>
            <div><label class="text-sm text-gray-600">网格编号 *</label><input v-model="gridForm.gridNo" class="w-full mt-1 px-3 py-2 border rounded" /></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="text-sm text-gray-600">发生时间</label><input v-model="gridForm.occurredAt" type="datetime-local" class="w-full mt-1 px-3 py-2 border rounded" /></div>
            <div><label class="text-sm text-gray-600">处置人</label><input v-model="gridForm.handler" class="w-full mt-1 px-3 py-2 border rounded" /></div>
          </div>
          <div><label class="text-sm text-gray-600">事件描述 *</label><textarea v-model="gridForm.description" rows="3" class="w-full mt-1 px-3 py-2 border rounded"></textarea></div>
        </div>
        <div class="mt-5 flex justify-end gap-3">
          <button class="px-4 py-2 border rounded hover:bg-gray-50" @click="showGridEvent = false">取消</button>
          <button class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700" @click="saveGridEvent">提交</button>
        </div>
      </div>
    </div>

    <div v-if="preview" class="fixed inset-0 bg-black/80 z-50 grid place-items-center p-4 cursor-zoom-out" @click.self="preview = null">
      <img :src="preview" class="max-w-full max-h-[90vh] rounded-lg" />
    </div>
  </div>
  <div v-else class="text-center py-24 text-gray-500">加载中...</div>
</template>

<script setup lang="ts">
import type { Issue, Rectification, GridEvent } from '~/types'
useHead({ title: '议题处置 - 居民议题闭环看板' })
const route = useRoute()
const { name, setName } = useOperator()
const id = computed(() => Number(route.params.id))
const issue = ref<Issue | null>(null)
const preview = ref<string | null>(null)
const categories = ['环境卫生', '公共设施', '治安巡逻', '绿化养护', '邻里纠纷', '物业管理', '民生服务', '其他']

const showEdit = ref(false)
const showRectify = ref(false)
const showReview = ref(false)
const showGridEvent = ref(false)

const editForm = reactive<any>({})
const rectForm = reactive({ action: '', handler: '', deadline: '', note: '', photosText: '' })
const reviewForm = reactive({ reviewer: name, result: 'PASS' as any, rated: 5, comment: '', photosText: '' })
const gridForm = reactive({ eventType: '', gridNo: '', occurredAt: '', handler: '', description: '' })

const count = (o: string) => issue.value?.votes?.filter(v => v.option === o).length || 0
const pct = (o: string) => {
  const t = issue.value?.votes?.length || 0
  return t ? Math.round((count(o) / t) * 100) : 0
}
const optLabel = (o: string) => o === 'AGREE' ? '赞成' : o === 'DISAGREE' ? '反对' : '弃权'
const optColor = (o: string) => 'px-2 py-0.5 rounded text-xs ' + (o === 'AGREE' ? 'bg-green-100 text-green-700' : o === 'DISAGREE' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700')

const loadIssue = async () => {
  issue.value = await request<Issue>(`/issues/${id.value}`)
  Object.assign(editForm, {
    title: issue.value.title,
    description: issue.value.description,
    category: issue.value.category,
    priority: issue.value.priority,
    status: issue.value.status,
    handler: issue.value.handler || '',
    community: issue.value.community || '',
    gridNo: issue.value.gridNo || '',
    location: issue.value.location || '',
    voteEndAt: issue.value.voteEndAt ? toLocalInput(issue.value.voteEndAt) : '',
    rectifyDeadline: issue.value.rectifyDeadline ? toLocalInput(issue.value.rectifyDeadline) : ''
  })
  gridForm.gridNo = issue.value.gridNo || ''
}
const toLocalInput = (s: string) => {
  const d = new Date(s)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const togglePublish = async () => {
  if (!issue.value) return
  const next = !issue.value.published
  await request(`/issues/${id.value}`, { method: 'PUT', body: { published: next, operator: name } })
  await loadIssue()
}
const saveEdit = async () => {
  if (!issue.value) return
  const body: any = { ...editForm, operator: name }
  if (!body.voteEndAt) delete body.voteEndAt
  if (!body.rectifyDeadline) delete body.rectifyDeadline
  await request(`/issues/${id.value}`, { method: 'PUT', body })
  showEdit.value = false
  await loadIssue()
  alert('已保存')
}
const completeRect = async (r: Rectification) => {
  const note = prompt('完成备注（可选）') ?? ''
  await request(`/rectifications/${r.id}/complete`, { method: 'POST', body: { note, operator: name } })
  await loadIssue()
}
const saveRectify = async () => {
  if (!rectForm.action) return alert('请填写整改措施')
  const photos = rectForm.photosText.split('\n').map(x => x.trim()).filter(Boolean).map(u => ({ url: u, type: 'RECTIFY' }))
  const body: any = { action: rectForm.action, handler: rectForm.handler, note: rectForm.note, photos, operator: name }
  if (rectForm.deadline) body.deadline = rectForm.deadline
  await request(`/issues/${id.value}/rectify`, { method: 'POST', body })
  showRectify.value = false
  Object.assign(rectForm, { action: '', handler: '', deadline: '', note: '', photosText: '' })
  await loadIssue()
}
const saveReview = async () => {
  if (!reviewForm.reviewer) return alert('请填写复查人')
  const photos = reviewForm.photosText.split('\n').map(x => x.trim()).filter(Boolean).map(u => ({ url: u, type: 'REVIEW' }))
  const body: any = { reviewer: reviewForm.reviewer, result: reviewForm.result, comment: reviewForm.comment, operator: name, photos }
  if (reviewForm.rated) body.rated = reviewForm.rated
  await request(`/issues/${id.value}/review`, { method: 'POST', body })
  showReview.value = false
  Object.assign(reviewForm, { reviewer: name, result: 'PASS', rated: 5, comment: '', photosText: '' })
  await loadIssue()
}
const handleGrid = async (g: GridEvent) => {
  const ok = confirm('标记为已处置？是否同时计入巡逻覆盖统计？')
  await request(`/grid-events/${g.id}/handle`, { method: 'POST', body: { patrolCovered: ok, handler: g.handler || name, operator: name } })
  await loadIssue()
}
const saveGridEvent = async () => {
  if (!gridForm.eventType || !gridForm.gridNo || !gridForm.description) return alert('请完善必填项')
  const body: any = { ...gridForm, operator: name }
  if (!body.occurredAt) delete body.occurredAt
  if (!body.handler) delete body.handler
  await request(`/issues/${id.value}/grid-event`, { method: 'POST', body })
  showGridEvent.value = false
  Object.assign(gridForm, { eventType: '', gridNo: issue.value?.gridNo || '', occurredAt: '', handler: '', description: '' })
  await loadIssue()
}
onMounted(loadIssue)
</script>
