<template>
  <div>
    <div class="card mb-6">
      <div class="flex items-end gap-4 flex-wrap">
        <div class="flex-1 min-w-[200px]">
          <label class="label">搜索</label>
          <input v-model="filters.search" type="text" class="input" placeholder="姓名、邮箱、职位" />
        </div>
        <div>
          <label class="label">阶段</label>
          <select v-model="filters.stage" class="input">
            <option value="ALL">全部阶段</option>
            <option v-for="(label, key) in stageLabels" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
        <div>
          <label class="label">部门</label>
          <select v-model="filters.department" class="input">
            <option value="ALL">全部部门</option>
            <option value="技术">技术</option>
            <option value="产品">产品</option>
            <option value="设计">设计</option>
            <option value="运营">运营</option>
          </select>
        </div>
        <div>
          <label class="label">状态</label>
          <select v-model="filters.status" class="input">
            <option value="ALL">全部状态</option>
            <option v-for="(label, key) in candidateStatusLabels" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
        <button class="btn-primary" @click="loadCandidates">搜索</button>
        <button class="btn-secondary" @click="openCreateModal">+ 新增候选人</button>
      </div>
    </div>

    <div class="card">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b border-gray-200">
            <th class="pb-3">候选人</th>
            <th class="pb-3">职位</th>
            <th class="pb-3">部门</th>
            <th class="pb-3">当前阶段</th>
            <th class="pb-3">状态</th>
            <th class="pb-3">面试/测评</th>
            <th class="pb-3">创建时间</th>
            <th class="pb-3">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in candidates" :key="c.id" class="border-b border-gray-50 hover:bg-gray-50">
            <td class="py-3">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium">
                  {{ c.name.charAt(0) }}
                </div>
                <div>
                  <p class="font-medium text-gray-800">{{ c.name }}</p>
                  <p class="text-xs text-gray-500">{{ c.email }}</p>
                </div>
              </div>
            </td>
            <td class="py-3 text-gray-700">{{ c.position }}</td>
            <td class="py-3 text-gray-700">{{ c.department }}</td>
            <td class="py-3"><BadgeTag :text="stageLabels[c.currentStage]" :color-class="stageColors[c.currentStage]" /></td>
            <td class="py-3"><BadgeTag :text="candidateStatusLabels[c.status]" /></td>
            <td class="py-3 text-gray-700">
              <span>{{ c._count?.interviews || 0 }} 面 / {{ c._count?.assessments || 0 }} 测</span>
            </td>
            <td class="py-3 text-gray-500">{{ formatDateShort(c.createdAt) }}</td>
            <td class="py-3">
              <NuxtLink :to="`/candidates/${c.id}`" class="text-primary-600 hover:text-primary-700 font-medium text-sm">
                查看详情
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="candidates.length === 0" class="py-12 text-center text-gray-400">暂无候选人数据</div>

      <div class="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <span class="text-sm text-gray-500">共 {{ total }} 条记录</span>
        <div class="flex gap-2">
          <button class="btn-secondary" :disabled="page <= 1" @click="page > 1 && (page--, loadCandidates())">上一页</button>
          <span class="px-4 py-2 text-sm text-gray-600">第 {{ page }} 页</span>
          <button class="btn-secondary" :disabled="page * pageSize >= total" @click="page * pageSize < total && (page++, loadCandidates())">下一页</button>
        </div>
      </div>
    </div>

    <div v-if="showCreateModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showCreateModal = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold mb-4">新增候选人</h3>
        <div class="space-y-4">
          <div>
            <label class="label">姓名 *</label>
            <input v-model="form.name" type="text" class="input" />
          </div>
          <div>
            <label class="label">邮箱 *</label>
            <input v-model="form.email" type="email" class="input" />
          </div>
          <div>
            <label class="label">电话</label>
            <input v-model="form.phone" type="text" class="input" />
          </div>
          <div>
            <label class="label">应聘职位 *</label>
            <input v-model="form.position" type="text" class="input" />
          </div>
          <div>
            <label class="label">部门 *</label>
            <select v-model="form.department" class="input">
              <option value="">请选择</option>
              <option value="技术">技术</option>
              <option value="产品">产品</option>
              <option value="设计">设计</option>
              <option value="运营">运营</option>
            </select>
          </div>
          <div>
            <label class="label">初始阶段</label>
            <select v-model="form.currentStage" class="input">
              <option v-for="(label, key) in stageLabels" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
          <div>
            <label class="label">简历链接</label>
            <input v-model="form.resumeUrl" type="text" class="input" />
          </div>
          <div>
            <label class="label">来源</label>
            <input v-model="form.source" type="text" class="input" placeholder="如：招聘网站、内推" />
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button class="btn-secondary" @click="showCreateModal = false">取消</button>
          <button class="btn-primary" @click="handleCreate">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { stageLabels, stageColors, candidateStatusLabels, formatDateShort } from '~/composables/useConstants'
import { useCandidateStore } from '~/stores/candidate'

const candidateStore = useCandidateStore()
const candidates = computed(() => candidateStore.candidates)
const total = computed(() => candidateStore.total)

const filters = reactive({
  search: '',
  stage: 'ALL',
  department: 'ALL',
  status: 'ALL'
})
const page = ref(1)
const pageSize = 20

const showCreateModal = ref(false)
const form = reactive({
  name: '',
  email: '',
  phone: '',
  position: '',
  department: '',
  currentStage: 'SCREENING',
  resumeUrl: '',
  source: ''
})

function openCreateModal() {
  Object.assign(form, { name: '', email: '', phone: '', position: '', department: '', currentStage: 'SCREENING', resumeUrl: '', source: '' })
  showCreateModal.value = true
}

async function handleCreate() {
  if (!form.name || !form.email || !form.position || !form.department) {
    alert('请填写必填项')
    return
  }
  try {
    await candidateStore.createCandidate({ ...form, createdBy: 'admin' })
    showCreateModal.value = false
    loadCandidates()
  } catch (e: any) {
    alert(e?.statusMessage || '创建失败')
  }
}

function loadCandidates() {
  candidateStore.fetchCandidates({ ...filters, page: page.value, pageSize })
}

onMounted(loadCandidates)
</script>
