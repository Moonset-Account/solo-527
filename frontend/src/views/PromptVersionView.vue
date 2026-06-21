<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="font-charter text-2xl font-bold text-deep-blue-900">提示词版本中心</h1>
        <p class="mt-1 text-sm text-slate-500">管理大模型提示词的版本迭代、发布与灰度策略</p>
      </div>
      <NButton type="primary" @click="openDrawer()">
        <NIcon size={16} class="mr-1.5"><PlusOutlined /></NIcon>
        创建新版本
      </NButton>
    </div>

    <NCard
      class="!rounded-2xl shadow-sm relative overflow-hidden"
      size="large"
      style="border: 2px solid #D4A853;"
    >
      <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-gold-400 via-amber-gold-500 to-amber-gold-400"></div>
      <div class="flex items-start gap-4 flex-wrap">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2">
            <NTag type="warning" size="large" round :bordered="false" class="!px-3 !py-1.5">
              <NIcon size={14} class="mr-1"><StarOutlined /></NIcon>
              当前生效版本
            </NTag>
            <NTag type="info" size="small" round :bordered="false">{{ active?.model }}</NTag>
          </div>
          <h3 class="font-charter text-xl font-bold text-deep-blue-900">
            {{ active?.name }} <span class="text-amber-gold-600 ml-2">v{{ active?.version }}</span>
          </h3>
          <p class="text-sm text-slate-500 mt-1">{{ active?.changeLog }}</p>
        </div>
        <div class="grid grid-cols-3 gap-6 min-w-[420px]">
          <StatItem label="准确率" :value="active?.accuracy ?? 0" suffix="%" color="emerald" />
          <StatItem label="测试用例" :value="`${active?.testCasesPassed ?? 0}/${active?.testCasesTotal ?? 0}`" color="deep-blue" />
          <StatItem label="灰度占比" value="100" suffix="%" color="amber-gold" />
        </div>
      </div>
    </NCard>

    <NCard class="!rounded-2xl shadow-sm" title="版本历史" size="large">
      <template #header-extra>
        <div class="flex items-center space-x-2">
          <NSelect v-model:value="filterStatus" :options="statusOptions" placeholder="状态筛选" style="width: 140px" clearable />
          <NSelect v-model:value="filterModel" :options="modelOptions" placeholder="模型筛选" style="width: 160px" clearable />
        </div>
      </template>
      <NDataTable
        :columns="columns"
        :data="filteredData"
        :pagination="pagination"
        :row-key="(row) => row.id"
        striped
        size="medium"
        @update:page="(p) => pagination.page = p"
      />
    </NCard>

    <NDrawer v-model:show="drawerVisible" :width="680" placement="right" title="创建提示词新版本" :show-icon="false">
      <NForm :model="form" label-placement="top" size="medium">
        <div class="grid grid-cols-2 gap-4">
          <NFormItem label="版本名称" required>
            <NInput v-model:value="form.name" placeholder="例如：通用邮件生成器 v4" />
          </NFormItem>
          <NFormItem label="版本号" required>
            <NInput v-model:value="form.version" placeholder="例如：3.3.0" />
          </NFormItem>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <NFormItem label="模型" required>
            <NSelect v-model:value="form.model" :options="modelOptions" />
          </NFormItem>
          <NFormItem label="变更说明">
            <NInput v-model:value="form.changeLog" type="textarea" :rows="2" placeholder="描述此版本的主要变更..." />
          </NFormItem>
        </div>
        <NFormItem label="System Prompt" required>
          <NInput
            v-model:value="form.systemPrompt"
            type="textarea"
            :autosize="{ minRows: 6, maxRows: 12 }"
            placeholder="定义助手的角色、规则和约束..."
            class="!font-mono !text-xs"
          />
        </NFormItem>
        <NFormItem label="User Prompt 模板" required>
          <NInput
            v-model:value="form.userPrompt"
            type="textarea"
            :autosize="{ minRows: 5, maxRows: 10 }"
            placeholder="使用 {{变量}} 形式占位..."
            class="!font-mono !text-xs"
          />
        </NFormItem>
        <NCard embedded title="模型参数" size="small" class="mt-2">
          <div class="space-y-4">
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium text-slate-700">Temperature (温度)</label>
                <span class="text-sm font-bold text-deep-blue-600 w-12 text-right">{{ form.temperature.toFixed(2) }}</span>
              </div>
              <NSlider v-model:value="form.temperature" :min="0" :max="2" :step="0.05" />
              <p class="text-xs text-slate-400 mt-1.5">值越高输出越随机有创意，越低越确定</p>
            </div>
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium text-slate-700">Top P</label>
                <span class="text-sm font-bold text-deep-blue-600 w-12 text-right">{{ form.topP.toFixed(2) }}</span>
              </div>
              <NSlider v-model:value="form.topP" :min="0" :max="1" :step="0.01" />
            </div>
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium text-slate-700">Max Tokens</label>
                <span class="text-sm font-bold text-deep-blue-600 w-16 text-right">{{ form.maxTokens }}</span>
              </div>
              <NSlider v-model:value="form.maxTokens" :min="256" :max="8192" :step="256" />
            </div>
          </div>
        </NCard>
      </NForm>
      <template #footer>
        <div class="flex justify-end space-x-2">
          <NButton @click="drawerVisible = false">取消</NButton>
          <NButton type="primary" @click="saveVersion">创建版本</NButton>
        </div>
      </template>
    </NDrawer>

    <NModal v-model:show="publishModalVisible" preset="dialog" title="发布提示词版本" positive-text="确认发布" negative-text="取消" @positive-click="doPublish">
      <div class="space-y-4 pt-2">
        <p class="text-sm">您即将发布 <span class="font-bold text-deep-blue-700">{{ publishName }}</span>，请确认：</p>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-slate-50 rounded-lg p-3">
            <p class="text-xs text-slate-500">模型</p>
            <p class="font-medium text-slate-800 mt-1">{{ publishModel }}</p>
          </div>
          <div class="bg-slate-50 rounded-lg p-3">
            <p class="text-xs text-slate-500">版本</p>
            <p class="font-medium text-slate-800 mt-1">v{{ publishVersion }}</p>
          </div>
        </div>
        <div>
          <label class="text-sm font-medium text-slate-700 mb-2 block">灰度比例</label>
          <div class="flex items-center space-x-3">
            <NSlider v-model:value="publishGrayPercent" :min="10" :max="100" :step="10" class="flex-1" />
            <span class="font-bold text-deep-blue-700 w-14 text-right">{{ publishGrayPercent }}%</span>
          </div>
          <p class="text-xs text-slate-400 mt-1.5">建议先小比例灰度，验证通过后逐步放量</p>
        </div>
      </div>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h, defineComponent } from 'vue'
import {
  NCard, NButton, NIcon, NTag, NDataTable, NDrawer, NForm, NFormItem,
  NInput, NSelect, NSlider, NModal, useMessage, useDialog,
  type DataTableColumns, type SelectOption
} from 'naive-ui'
import {
  PlusOutlined, StarOutlined, CloudUploadOutlined, EyeOutlined, CopyOutlined
} from '@vicons/antd'
import StatusTag from '@/components/business/StatusTag.vue'
import { usePageTitle } from '@/composables/usePageTitle'
import { mockPrompts } from '@/mock/data'
import type { PromptVersion } from '@/types'

usePageTitle('提示词版本中心')

const message = useMessage()
const dialog = useDialog()

const allData = ref<PromptVersion[]>([...mockPrompts])
const filterStatus = ref<string | null>(null)
const filterModel = ref<string | null>(null)

const statusOptions: SelectOption[] = [
  { label: '已发布', value: 'active' },
  { label: '测试中', value: 'testing' },
  { label: '已废弃', value: 'deprecated' }
]
const modelOptions: SelectOption[] = [
  { label: 'GPT-4', value: 'gpt-4' },
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'GPT-4o-mini', value: 'gpt-4o-mini' },
  { label: 'GPT-3.5-turbo', value: 'gpt-3.5-turbo' }
]

const creatorMap: Record<string, string> = { 'user_001': '系统管理员', 'user_002': '张复核' }

const active = computed(() => allData.value.find(p => p.status === 'active'))

const filteredData = computed(() => {
  return allData.value.filter(p => {
    if (filterStatus.value && p.status !== filterStatus.value) return false
    if (filterModel.value && p.model !== filterModel.value) return false
    return true
  })
})

const pagination = reactive({
  page: 1, pageSize: 10,
  itemCount: computed(() => filteredData.value.length)
})

const StatItem = defineComponent({
  props: { label: String, value: [Number, String], suffix: String, color: String },
  setup(props) {
    const colorMap: Record<string, string> = {
      'emerald': 'text-emerald-600',
      'deep-blue': 'text-deep-blue-600',
      'amber-gold': 'text-amber-gold-600'
    }
    return () => h('div', { class: 'min-w-0' }, [
      h('p', { class: 'text-xs text-slate-500 mb-1' }, props.label),
      h('p', { class: `font-charter text-2xl font-bold ${colorMap[props.color || 'deep-blue'] || ''}` }, [
        String(props.value),
        props.suffix ? h('span', { class: 'text-base ml-0.5 opacity-80' }, props.suffix) : null
      ])
    ])
  }
})

const columns: DataTableColumns<PromptVersion> = [
  { title: '版本号', key: 'version', width: 110, render: (row) => h('span', { class: 'font-mono font-bold text-deep-blue-700' }, `v${row.version}`) },
  { title: '名称', key: 'name', width: 200, ellipsis: { tooltip: true }, render: (row) => h('span', { class: 'font-medium text-slate-800' }, row.name) },
  { title: '模型', key: 'model', width: 130, render: (row) => h(NTag, { size: 'small', type: 'info', round, bordered: false }, { default: () => row.model }) },
  { title: '状态', key: 'status', width: 100, render: (row) => h(StatusTag, { status: row.status, type: 'prompt', size: 'small' }) },
  {
    title: '准确率',
    key: 'accuracy',
    width: 110,
    render: (row) => h('span', { class: row.accuracy ? (row.accuracy >= 95 ? 'text-emerald-600 font-medium' : 'text-slate-600') : 'text-slate-300' },
      row.accuracy ? `${row.accuracy}%` : '未测试')
  },
  { title: '创建人', key: 'createdBy', width: 100, render: (row) => h('span', { class: 'text-sm text-slate-600' }, creatorMap[row.createdBy] || row.createdBy) },
  {
    title: '发布时间',
    key: 'approvedAt',
    width: 170,
    render: (row) => h('span', { class: 'text-sm text-slate-500' },
      row.approvedAt ? formatDate(row.approvedAt) : row.createdAt ? formatDate(row.createdAt) : '-')
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    fixed: 'right',
    render: (row) => h('div', { class: 'flex items-center space-x-1' }, [
      h(NButton, { size: 'small', text: true, type: 'info', onClick: () => viewPrompt(row) }, {
        default: () => [h(NIcon, { size: 14 }, { default: () => h(EyeOutlined) }), ' 查看']
      }),
      h(NButton, { size: 'small', text: true, type: 'default', onClick: () => copyConfig(row) }, {
        default: () => [h(NIcon, { size: 14 }, { default: () => h(CopyOutlined) }), ' 复制']
      }),
      row.status !== 'active' && row.status !== 'deprecated'
        ? h(NButton, { size: 'small', text: true, type: 'primary', onClick: () => openPublish(row) }, {
            default: () => [h(NIcon, { size: 14 }, { default: () => h(CloudUploadOutlined) }), ' 发布']
          })
        : null
    ])
  }
]

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function viewPrompt(row: PromptVersion) {
  dialog.info({
    title: `${row.name} (v${row.version})`,
    content: () => h('div', { class: 'space-y-4 max-h-[60vh] overflow-auto' }, [
      h('p', { class: 'text-xs text-slate-500 font-bold' }, 'System Prompt:'),
      h('div', { class: 'bg-slate-50 p-3 rounded-lg text-sm font-mono text-slate-700 whitespace-pre-wrap' }, row.systemPrompt),
      h('p', { class: 'text-xs text-slate-500 font-bold mt-4' }, 'User Prompt 模板:'),
      h('div', { class: 'bg-slate-50 p-3 rounded-lg text-sm font-mono text-slate-700 whitespace-pre-wrap' }, row.userPrompt),
      h('div', { class: 'grid grid-cols-3 gap-3 mt-4' }, [
        h('div', { class: 'bg-slate-50 p-3 rounded-lg' }, [h('p', { class: 'text-xs text-slate-500' }, 'Temperature'), h('p', { class: 'font-bold text-deep-blue-700 mt-1' }, String(row.temperature))]),
        h('div', { class: 'bg-slate-50 p-3 rounded-lg' }, [h('p', { class: 'text-xs text-slate-500' }, 'Top P'), h('p', { class: 'font-bold text-deep-blue-700 mt-1' }, String(row.topP))]),
        h('div', { class: 'bg-slate-50 p-3 rounded-lg' }, [h('p', { class: 'text-xs text-slate-500' }, 'Max Tokens'), h('p', { class: 'font-bold text-deep-blue-700 mt-1' }, String(row.maxTokens))])
      ])
    ]),
    positiveText: '关闭'
  })
}

function copyConfig(row: PromptVersion) {
  navigator.clipboard.writeText(JSON.stringify({
    name: row.name, version: row.version, model: row.model,
    systemPrompt: row.systemPrompt, userPrompt: row.userPrompt,
    temperature: row.temperature, topP: row.topP, maxTokens: row.maxTokens
  }, null, 2)).then(() => message.success('配置已复制到剪贴板'))
}

const drawerVisible = ref(false)
const publishModalVisible = ref(false)
const publishingItem = ref<PromptVersion | null>(null)
const publishGrayPercent = ref(30)
const publishName = computed(() => publishingItem.value?.name || '')
const publishVersion = computed(() => publishingItem.value?.version || '')
const publishModel = computed(() => publishingItem.value?.model || '')

const form = reactive({
  name: '',
  version: '',
  model: 'gpt-4',
  status: 'testing' as 'active' | 'testing' | 'deprecated',
  changeLog: '',
  systemPrompt: '',
  userPrompt: '',
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2048
})

function openDrawer() {
  form.name = ''
  const latest = allData.value[0]
  if (latest) {
    const [maj, min, pat] = latest.version.split('.').map(Number)
    form.version = `${maj}.${min + 1}.0`
    form.model = latest.model
    form.systemPrompt = latest.systemPrompt
    form.userPrompt = latest.userPrompt
    form.temperature = latest.temperature
    form.topP = latest.topP
    form.maxTokens = latest.maxTokens
  } else {
    form.version = '1.0.0'
  }
  form.changeLog = ''
  drawerVisible.value = true
}

function saveVersion() {
  if (!form.name.trim()) { message.error('请输入版本名称'); return }
  if (!form.version.trim()) { message.error('请输入版本号'); return }
  if (!form.systemPrompt.trim()) { message.error('请输入 System Prompt'); return }
  if (!form.userPrompt.trim()) { message.error('请输入 User Prompt 模板'); return }
  const newP: PromptVersion = {
    id: 'prompt_new_' + Date.now(),
    name: form.name,
    version: form.version,
    model: form.model,
    status: 'testing',
    changeLog: form.changeLog,
    systemPrompt: form.systemPrompt,
    userPrompt: form.userPrompt,
    temperature: form.temperature,
    topP: form.topP,
    maxTokens: form.maxTokens,
    createdBy: 'user_001',
    createdAt: new Date().toISOString()
  }
  allData.value.unshift(newP)
  drawerVisible.value = false
  message.success('新版本已创建，状态：测试中')
}

function openPublish(row: PromptVersion) {
  publishingItem.value = row
  publishGrayPercent.value = 30
  publishModalVisible.value = true
}

function doPublish() {
  if (!publishingItem.value) return
  const prev = allData.value.find(p => p.status === 'active')
  if (prev) prev.status = 'deprecated'
  publishingItem.value.status = 'active'
  publishingItem.value.approvedBy = 'user_001'
  publishingItem.value.approvedAt = new Date().toISOString()
  publishModalVisible.value = false
  message.success(`v${publishingItem.value.version} 已发布，灰度 ${publishGrayPercent.value}%`)
}
</script>
