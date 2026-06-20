<template>
  <div class="space-y-6">
    <section class="bg-white rounded-xl shadow-sm border p-5 flex items-center justify-between flex-wrap gap-3">
      <h2 class="text-lg font-semibold">🛠️ 后台 · 议题管理</h2>
      <div class="flex items-center gap-2">
        <button class="px-3 py-1.5 text-sm border rounded hover:bg-gray-50" @click="scanTimeout">扫描超时 → 生成待办</button>
        <button class="px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700" @click="showCreate = true">+ 新建议题</button>
      </div>
    </section>

    <section class="bg-white rounded-xl shadow-sm border p-5">
      <div class="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div class="flex items-center gap-2 flex-wrap">
          <input v-model="filters.keyword" placeholder="搜索编号/标题" class="px-3 py-1.5 text-sm border rounded w-52" @keyup.enter="loadIssues" />
          <select v-model="filters.status" class="px-3 py-1.5 text-sm border rounded" @change="loadIssues">
            <option value="">全部状态</option>
            <option v-for="(v,k) in STATUS_LABELS" :key="k" :value="k">{{ v }}</option>
          </select>
          <select v-model="filters.priority" class="px-3 py-1.5 text-sm border rounded" @change="loadIssues">
            <option value="">全部优先级</option>
            <option v-for="(v,k) in PRIORITY_LABELS" :key="k" :value="k">{{ v }}</option>
          </select>
          <select v-model="filters.category" class="px-3 py-1.5 text-sm border rounded w-32" @change="loadIssues">
            <option value="">全部分类</option>
            <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
          </select>
          <input v-model="filters.community" placeholder="社区" class="px-3 py-1.5 text-sm border rounded w-32" @keyup.enter="loadIssues" />
          <button class="px-3 py-1.5 text-sm border rounded hover:bg-gray-50" @click="loadIssues">筛选</button>
        </div>
        <div class="text-sm text-gray-500">共 {{ total }} 条</div>
      </div>

      <div class="overflow-x-auto border rounded-lg">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 sticky top-0">
            <tr class="text-left">
              <th class="p-3">编号/标题</th>
              <th class="p-3">分类</th>
              <th class="p-3">优先级</th>
              <th class="p-3">状态</th>
              <th class="p-3">社区/网格</th>
              <th class="p-3">负责人</th>
              <th class="p-3 w-44">进度</th>
              <th class="p-3">创建时间</th>
              <th class="p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="i in rows" :key="i.id" class="border-t hover:bg-gray-50">
              <td class="p-3">
                <div class="font-mono text-xs text-primary-600">{{ i.code }}</div>
                <NuxtLink :to="`/admin/issue/${i.id}`" class="font-medium hover:text-primary-700 line-clamp-1">{{ i.title }}</NuxtLink>
              </td>
              <td class="p-3 text-gray-600">{{ i.category }}</td>
              <td class="p-3"><span :class="PRIORITY_COLORS[i.priority] + ' font-medium'">● {{ PRIORITY_LABELS[i.priority] }}</span></td>
              <td class="p-3"><span :class="'px-2 py-0.5 rounded text-xs font-medium ' + STATUS_COLORS[i.status]">{{ STATUS_LABELS[i.status] }}</span></td>
              <td class="p-3 text-gray-600 text-xs">{{ i.community || '-' }}<span v-if="i.gridNo"><br/>#{{ i.gridNo }}</span></td>
              <td class="p-3 text-gray-600">{{ i.handler || '-' }}</td>
              <td class="p-3 text-xs text-gray-500">
                🗳️{{ i._count?.votes || 0 }} · 🔧{{ i._count?.rectifications || 0 }} · ✅{{ i._count?.reviews || 0 }} · 📡{{ i._count?.gridEvents || 0 }}
              </td>
              <td class="p-3 text-gray-500 text-xs">{{ fmtDateTime(i.createdAt) }}</td>
              <td class="p-3">
                <NuxtLink :to="`/admin/issue/${i.id}`" class="text-primary-600 hover:underline text-xs mr-2">详情/处置</NuxtLink>
                <a :href="`/api/issues/${i.id}/export-xlsx`" target="_blank" class="text-green-600 hover:underline text-xs">下载</a>
              </td>
            </tr>
            <tr v-if="!rows.length"><td colspan="9" class="p-12 text-center text-gray-400">暂无数据</td></tr>
          </tbody>
        </table>
      </div>
      <div class="mt-4 flex items-center justify-between text-sm text-gray-500">
        <div>每页 {{ size }} 条</div>
        <div class="flex items-center gap-1">
          <button :disabled="page <= 1" class="px-2 py-1 border rounded disabled:opacity-40" @click="changePage(-1)">上一页</button>
          <span>{{ page }} / {{ Math.max(1, Math.ceil(total / size)) }}</span>
          <button :disabled="page * size >= total" class="px-2 py-1 border rounded disabled:opacity-40" @click="changePage(1)">下一页</button>
        </div>
      </div>
    </section>

    <div v-if="showCreate" class="fixed inset-0 bg-black/50 z-50 grid place-items-center p-4" @click.self="showCreate = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <h3 class="text-xl font-semibold mb-4">新建议题</h3>
        <div class="grid md:grid-cols-2 gap-3">
          <div class="md:col-span-2"><label class="text-sm text-gray-600">标题 *</label><input v-model="form.title" class="w-full mt-1 px-3 py-2 border rounded" /></div>
          <div class="md:col-span-2"><label class="text-sm text-gray-600">描述 *</label><textarea v-model="form.description" rows="4" class="w-full mt-1 px-3 py-2 border rounded"></textarea></div>
          <div><label class="text-sm text-gray-600">分类 *</label>
            <select v-model="form.category" class="w-full mt-1 px-3 py-2 border rounded">
              <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div><label class="text-sm text-gray-600">优先级</label>
            <select v-model="form.priority" class="w-full mt-1 px-3 py-2 border rounded">
              <option v-for="(v,k) in PRIORITY_LABELS" :key="k" :value="k">{{ v }}</option>
            </select>
          </div>
          <div><label class="text-sm text-gray-600">社区</label><input v-model="form.community" class="w-full mt-1 px-3 py-2 border rounded" /></div>
          <div><label class="text-sm text-gray-600">网格编号</label><input v-model="form.gridNo" class="w-full mt-1 px-3 py-2 border rounded" /></div>
          <div class="md:col-span-2"><label class="text-sm text-gray-600">具体位置</label><input v-model="form.location" class="w-full mt-1 px-3 py-2 border rounded" /></div>
          <div><label class="text-sm text-gray-600">反映人手机号</label><input v-model="form.reporterPhone" class="w-full mt-1 px-3 py-2 border rounded" /></div>
          <div><label class="text-sm text-gray-600">反映人姓名</label><input v-model="form.reporterName" class="w-full mt-1 px-3 py-2 border rounded" /></div>
          <div><label class="text-sm text-gray-600">负责人</label><input v-model="form.handler" class="w-full mt-1 px-3 py-2 border rounded" /></div>
          <div><label class="text-sm text-gray-600">投票截止</label><input v-model="form.voteEndAt" type="datetime-local" class="w-full mt-1 px-3 py-2 border rounded" /></div>
          <div class="md:col-span-2"><label class="text-sm text-gray-600">整改截止</label><input v-model="form.rectifyDeadline" type="datetime-local" class="w-full mt-1 px-3 py-2 border rounded" /></div>
          <div class="md:col-span-2">
            <label class="text-sm text-gray-600">设施/现场照片 URL（每行一条）</label>
            <textarea v-model="photosText" rows="3" class="w-full mt-1 px-3 py-2 border rounded font-mono text-xs" placeholder="https://...&#10;https://..."></textarea>
          </div>
        </div>
        <div class="mt-5 flex items-center justify-end gap-3">
          <button class="px-4 py-2 border rounded hover:bg-gray-50" @click="showCreate = false">取消</button>
          <button class="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700" :disabled="submitting" @click="submitCreate">{{ submitting ? '提交中...' : '创建' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Issue, PageResult } from '~/types'
useHead({ title: '后台管理 - 居民议题闭环看板' })
const { name } = useOperator()
const categories = ['环境卫生', '公共设施', '治安巡逻', '绿化养护', '邻里纠纷', '物业管理', '民生服务', '其他']
const filters = reactive({ keyword: '', status: '', priority: '', category: '', community: '' })
const page = ref(1)
const size = 20
const total = ref(0)
const rows = ref<Issue[]>([])
const showCreate = ref(false)
const submitting = ref(false)
const photosText = ref('')
const form = reactive({
  title: '', description: '', category: '环境卫生', priority: 'NORMAL',
  community: '', gridNo: '', location: '', reporterPhone: '', reporterName: '',
  handler: '', voteEndAt: '', rectifyDeadline: ''
})

const loadIssues = async () => {
  const q = new URLSearchParams()
  q.set('page', String(page.value))
  q.set('size', String(size))
  Object.entries(filters).forEach(([k, v]) => { if (v) q.set(k, v) })
  const res = await request<PageResult<Issue>>(`/issues?${q.toString()}`)
  rows.value = res.rows
  total.value = res.total
}
const changePage = (d: number) => { page.value = Math.max(1, page.value + d); loadIssues() }
const scanTimeout = async () => {
  try {
    const r = await request<any>('/jobs/scan-timeout', { method: 'POST', body: {} })
    alert(`扫描完成：新增待办 ${r.createdTodos} 条，同步巡逻统计 ${r.syncedPatrol} 条`)
  } catch (e) {}
}
const submitCreate = async () => {
  if (!form.title || !form.description || !form.category) return alert('请填写必填项')
  submitting.value = true
  try {
    const photos = photosText.value.split('\n').map(x => x.trim()).filter(Boolean).map(u => ({ url: u, type: 'ISSUE' }))
    const body: any = { ...form, photos }
    if (!form.voteEndAt) delete body.voteEndAt
    if (!form.rectifyDeadline) delete body.rectifyDeadline
    body.operator = name
    await request('/issues', { method: 'POST', body })
    alert('创建成功')
    showCreate.value = false
    await loadIssues()
    Object.assign(form, { title: '', description: '', category: '环境卫生', priority: 'NORMAL', community: '', gridNo: '', location: '', reporterPhone: '', reporterName: '', handler: '', voteEndAt: '', rectifyDeadline: '' })
    photosText.value = ''
  } finally { submitting.value = false }
}
await loadIssues()
</script>
