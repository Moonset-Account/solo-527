<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="font-charter text-2xl font-bold text-deep-blue-900">话术版本中心</h1>
        <p class="mt-1 text-sm text-slate-500">管理邮件话术模板的版本、发布与灰度策略</p>
      </div>
      <div class="flex items-center space-x-2">
        <NSelect v-model:value="diffMode" :options="diffOptions" placeholder="Diff对比" style="width: 200px" clearable @update:value="handleDiffChange" />
        <NButton type="primary" @click="openNewVersion">
          <NIcon size={16} class="mr-1.5"><PlusOutlined /></NIcon>
          创建新版本
        </NButton>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <NCard class="!rounded-2xl shadow-sm xl:col-span-1" content-style="padding: 0" size="small">
        <div class="p-4 border-b border-slate-100">
          <p class="text-sm font-medium text-slate-600 mb-3">话术模板列表 ({{ templates.length }})</p>
          <NInput v-model:value="searchKeyword" size="small" placeholder="搜索模板名称..." clearable>
            <template #prefix><NIcon size={14}><SearchOutlined /></NIcon></template>
          </NInput>
        </div>
        <NList bordered={false} class="!p-0">
          <NListItem
            v-for="t in filteredTemplates"
            :key="t.id"
            :clickable="true"
            :active="selectedId === t.id"
            class="!px-4 !py-3.5 hover:!bg-slate-50/80 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
            @click="selectTemplate(t.id)"
          >
            <template #prefix>
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                :class="t.status === 'active' ? 'bg-deep-blue-50' : t.status === 'draft' ? 'bg-amber-gold-50' : 'bg-slate-100'"
              >
                <NIcon :size="18" :color="t.status === 'active' ? '#0B4F8C' : t.status === 'draft' ? '#D4A853' : '#94A3B8'">
                  <FileTextOutlined />
                </NIcon>
              </div>
            </template>
            <NListItemMeta>
              <template #title>
                <div class="flex items-center justify-between w-full">
                  <span class="font-medium text-sm text-slate-800 truncate">{{ t.name }}</span>
                  <StatusTag v-if="selectedId === t.id" :status="t.status" type="template" size="small" />
                </div>
              </template>
              <template #description>
                <div class="mt-1.5 flex items-center justify-between w-full">
                  <div class="flex items-center space-x-2">
                    <NTag size="tiny" :bordered="false" type="info" round>{{ categoryText(t.category) }}</NTag>
                    <span class="text-xs text-slate-400">v{{ t.version }}</span>
                  </div>
                </div>
                <p class="text-xs text-slate-400 mt-1.5 truncate">{{ t.description }}</p>
              </template>
            </NListItemMeta>
          </NListItem>
        </NList>
      </NCard>

      <NCard class="!rounded-2xl shadow-sm xl:col-span-2" size="large">
        <template v-if="selected">
          <template #header>
            <div class="flex items-center justify-between w-full pr-4">
              <div>
                <h3 class="font-charter font-bold text-lg text-deep-blue-900">{{ selected.name }}</h3>
                <div class="flex items-center space-x-3 mt-1">
                  <StatusTag :status="selected.status" type="template" size="small" />
                  <span class="text-xs text-slate-400">v{{ selected.version }}</span>
                  <span class="text-xs text-slate-400">· {{ categoryText(selected.category) }}</span>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <template v-if="selected.status !== 'active'">
                  <NButton size="small" type="success" @click="publishVersion">
                    <NIcon size={14} class="mr-1"><CloudUploadOutlined /></NIcon>
                    发布
                  </NButton>
                </template>
                <template v-else>
                  <NButton size="small" type="warning" @click="rollbackVersion">
                    <NIcon size={14} class="mr-1"><RollbackOutlined /></NIcon>
                    回滚
                  </NButton>
                </template>
                <NButton size="small" @click="openNewVersion(selected)">
                  <NIcon size={14} class="mr-1"><CopyOutlined /></NIcon>
                  新建版本
                </NButton>
              </div>
            </div>
          </template>

          <template #header-extra>
            <div class="flex items-center pr-4">
              <label class="text-xs text-slate-500 mr-2 whitespace-nowrap">灰度比例</label>
              <NSlider v-model:value="grayPercent" :min="0" :max="100" class="!w-32" />
              <span class="ml-2 text-xs font-medium text-deep-blue-600 w-10 text-right">{{ grayPercent }}%</span>
            </div>
          </template>

          <div v-if="diffMode" class="space-y-4">
            <div class="bg-slate-50 rounded-xl px-4 py-2.5 flex items-center justify-between">
              <span class="text-sm text-slate-500">
                对比：<span class="font-medium text-slate-700">v{{ selected.version }}</span>
                <NIcon size={12} class="mx-2"><SwapOutlined /></NIcon>
                <span class="font-medium text-slate-700">v{{ diffMode }}</span>
              </span>
              <NButton size="tiny" quaternary @click="diffMode = null">退出对比</NButton>
            </div>
            <DiffViewer
              :left-text="diffLeftContent"
              :right-text="selected.content"
              left-label="v{{ diffMode }} (旧)"
              right-label="v{{ selected.version }} (当前)"
            />
          </div>
          <template v-else>
            <div class="mb-5">
              <p class="text-xs text-slate-500 font-medium mb-2">模板说明</p>
              <p class="text-sm text-slate-600">{{ selected.description || '无说明' }}</p>
            </div>
            <div class="mb-5">
              <p class="text-xs text-slate-500 font-medium mb-2">模板变量</p>
              <div class="flex flex-wrap gap-1.5">
                <NTag
                  v-for="v in (selected.variables.length > 0 ? selected.variables : ['无变量'])"
                  :key="v"
                  size="small"
                  round
                  :type="selected.variables.length > 0 ? 'warning' : 'default'"
                  :bordered="false"
                >
                  {{ v }}
                </NTag>
              </div>
            </div>
            <div>
              <p class="text-xs text-slate-500 font-medium mb-2">版本历史</p>
              <NTimeline class="!m-0 mt-3">
                <NTimelineItem
                  v-for="(v, idx) in versions"
                  :key="v.version"
                  :type="idx === 0 ? 'success' : 'default'"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm font-medium text-slate-800">
                        v{{ v.version }}
                        <span v-if="idx === 0" class="ml-2">
                          <NTag size="tiny" type="success" :bordered="false" round>当前版本</NTag>
                        </span>
                      </p>
                      <p class="text-xs text-slate-400 mt-1">{{ formatDate(v.createdAt) }} · {{ getCreatorName(v.createdBy) }}</p>
                    </div>
                    <div v-if="idx > 0" class="flex items-center space-x-1">
                      <NButton size="tiny" text type="primary" @click="diffMode = v.version">对比</NButton>
                      <NButton size="tiny" text type="warning" @click="rollbackTo(v)">回滚</NButton>
                    </div>
                  </div>
                </NTimelineItem>
              </NTimeline>
            </div>
          </template>
        </template>
        <div v-else class="py-20 text-center">
          <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-50 flex items-center justify-center">
            <NIcon size={36} color="#CBD5E1"><FileTextOutlined /></NIcon>
          </div>
          <p class="text-slate-400">请选择左侧的话术模板查看详情</p>
        </div>
      </NCard>
    </div>

    <NDrawer v-model:show="newVersionVisible" :width="620" placement="right" title="创建新版本" :show-icon="false">
      <NForm :model="newForm" label-placement="top" size="medium">
        <div class="grid grid-cols-2 gap-4">
          <NFormItem label="版本号" required>
            <NInput v-model:value="newForm.version" placeholder="例如：2.4.0" />
          </NFormItem>
          <NFormItem label="分类">
            <NSelect v-model:value="newForm.category" :options="categorySelectOptions" />
          </NFormItem>
        </div>
        <NFormItem label="模板名称" required>
          <NInput v-model:value="newForm.name" placeholder="请输入模板名称" />
        </NFormItem>
        <NFormItem label="模板说明">
          <NInput v-model:value="newForm.description" type="textarea" :rows="2" />
        </NFormItem>
        <NFormItem label="模板变量">
          <NDynamicTags v-model:value="newForm.variables" placeholder="输入变量名按回车添加，例如：客户姓名" />
        </NFormItem>
        <NFormItem label="模板内容" required>
          <NInput
            v-model:value="newForm.content"
            type="textarea"
            :autosize="{ minRows: 10, maxRows: 20 }"
            placeholder="使用{{变量名}}插入动态内容..."
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="flex justify-end space-x-2">
          <NButton @click="newVersionVisible = false">取消</NButton>
          <NButton type="primary" @click="submitNewVersion">创建</NButton>
        </div>
      </template>
    </NDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h } from 'vue'
import {
  NCard, NButton, NIcon, NInput, NList, NListItem, NListItemMeta, NTag,
  NDrawer, NForm, NFormItem, NDynamicTags, NSelect, NSlider,
  NTimeline, NTimelineItem, useMessage, useDialog, type SelectOption
} from 'naive-ui'
import {
  PlusOutlined, SearchOutlined, FileTextOutlined, CopyOutlined,
  CloudUploadOutlined, RollbackOutlined, SwapOutlined
} from '@vicons/antd'
import StatusTag from '@/components/business/StatusTag.vue'
import DiffViewer from '@/components/business/DiffViewer.vue'
import { usePageTitle } from '@/composables/usePageTitle'
import { mockTemplates } from '@/mock/data'
import type { TemplateStatus } from '@/types'

usePageTitle('话术版本中心')

const message = useMessage()
const dialog = useDialog()

const templates = ref<TemplateStatus[]>([...mockTemplates])
const searchKeyword = ref('')
const selectedId = ref<string | null>(templates.value.find(t => t.status === 'active')?.id || templates.value[0]?.id || null)
const diffMode = ref<string | null>(null)
const grayPercent = ref(100)
const newVersionVisible = ref(false)
const baseForNewVersion = ref<TemplateStatus | null>(null)

const categoryMap: Record<string, string> = {
  greeting: '问候祝福',
  marketing: '营销推广',
  notification: '通知提醒',
  service: '客服服务',
  event: '活动邀请'
}
const categoryText = (v: string) => categoryMap[v] || v
const categorySelectOptions: SelectOption[] = Object.entries(categoryMap).map(([value, label]) => ({ label, value }))
const diffOptions: SelectOption[] = computed(() => {
  if (!selected.value) return []
  const cur = versions.value
  return cur.slice(1).map(v => ({ label: `对比 v${v.version}`, value: v.version }))
})

const creatorMap: Record<string, string> = { 'user_001': '系统管理员', 'user_002': '张复核', 'user_003': '李运营' }
const getCreatorName = (id: string) => creatorMap[id] || id

const filteredTemplates = computed(() => {
  if (!searchKeyword.value) return templates.value
  const k = searchKeyword.value.toLowerCase()
  return templates.value.filter(t =>
    t.name.toLowerCase().includes(k) || t.description.toLowerCase().includes(k)
  )
})

const selected = computed(() => templates.value.find(t => t.id === selectedId.value) || null)

const versions = computed(() => {
  if (!selected.value) return []
  const main = selected.value
  const arr: Array<TemplateStatus & { isCurrent?: boolean }> = [
    { ...main, updatedAt: main.createdAt }
  ]
  const [maj, min, pat] = main.version.split('.').map(Number)
  for (let i = 1; i <= 2; i++) {
    const v = `${maj}.${Math.max(0, min - i)}.${Math.max(0, pat)}`
    const pastDate = new Date(main.createdAt)
    pastDate.setDate(pastDate.getDate() - i * 14)
    arr.push({
      ...main,
      id: main.id + '_v' + v,
      version: v,
      status: i === 1 ? 'deprecated' : 'deprecated',
      createdBy: main.createdBy,
      createdAt: pastDate.toISOString(),
      content: `【${v}版本内容】\n尊敬的{{客户姓名}}：\n\n感谢您的支持。\n\n{{公司名称}}团队`
    })
  }
  return arr
})

const diffLeftContent = computed(() => {
  if (!diffMode.value) return ''
  const v = versions.value.find(v => v.version === diffMode.value)
  return v?.content || ''
})

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function selectTemplate(id: string) {
  selectedId.value = id
  diffMode.value = null
}

function handleDiffChange(val: string | null) {
  if (!val) diffMode.value = null
}

function publishVersion() {
  if (!selected.value) return
  dialog.success({
    title: '发布确认',
    content: `确认发布模板「${selected.value!.name}」v${selected.value!.version}？发布后将对 ${grayPercent.value}% 的流量生效。`,
    positiveText: '确认发布',
    negativeText: '取消',
    onPositiveClick: () => {
      selected.value!.status = 'active'
      selected.value!.approvedAt = new Date().toISOString()
      message.success('发布成功')
    }
  })
}

function rollbackVersion() {
  if (!selected.value) return
  dialog.warning({
    title: '回滚确认',
    content: `确认将模板「${selected.value!.name}」从当前版本回滚？`,
    positiveText: '确认回滚',
    negativeText: '取消',
    onPositiveClick: () => {
      selected.value!.status = 'draft'
      message.info('已回滚为草稿状态')
    }
  })
}

function rollbackTo(v: any) {
  dialog.warning({
    title: '回滚到历史版本',
    content: `确认回滚到 v${v.version}？当前版本内容将被替换。`,
    positiveText: '确认回滚',
    negativeText: '取消',
    onPositiveClick: () => {
      message.success(`已回滚到 v${v.version}`)
    }
  })
}

const newForm = reactive({
  name: '',
  version: '',
  category: 'marketing',
  description: '',
  variables: [] as string[],
  content: ''
})

function openNewVersion(base?: TemplateStatus) {
  baseForNewVersion.value = base || null
  if (base) {
    newForm.name = base.name
    const [maj, min, pat] = base.version.split('.').map(Number)
    newForm.version = `${maj}.${min + 1}.0`
    newForm.category = base.category
    newForm.description = base.description
    newForm.variables = [...base.variables]
    newForm.content = base.content
  } else {
    newForm.name = ''
    newForm.version = '1.0.0'
    newForm.category = 'marketing'
    newForm.description = ''
    newForm.variables = []
    newForm.content = ''
  }
  newVersionVisible.value = true
}

function submitNewVersion() {
  if (!newForm.name.trim()) { message.error('请输入模板名称'); return }
  if (!newForm.version.trim()) { message.error('请输入版本号'); return }
  if (!newForm.content.trim()) { message.error('请输入模板内容'); return }
  const newTpl: TemplateStatus = {
    id: 'tpl_new_' + Date.now(),
    name: newForm.name,
    version: newForm.version,
    category: newForm.category,
    description: newForm.description,
    variables: [...newForm.variables],
    content: newForm.content,
    status: 'draft',
    isDefault: false,
    createdBy: 'user_001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  templates.value.unshift(newTpl)
  selectedId.value = newTpl.id
  newVersionVisible.value = false
  message.success('新版本已创建')
}
</script>
