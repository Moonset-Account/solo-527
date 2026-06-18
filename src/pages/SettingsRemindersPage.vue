<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Plus, Edit2, Trash2 } from 'lucide-vue-next'
import { settingsApi } from '@/api'
import type { ReminderTemplate } from '@/types'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const templates = ref<ReminderTemplate[]>([])
const showModal = ref(false)
const editingTemplate = ref<Partial<ReminderTemplate> | null>(null)
const showDeleteConfirm = ref(false)
const deletingId = ref<number | null>(null)

const templateTypes = [
  { label: '回访提醒', value: 'followup_reminder' },
  { label: '超时预警', value: 'overdue_warning' },
  { label: '状态变更', value: 'status_change' },
  { label: '签约提醒', value: 'contract_reminder' },
]

const channelOptions = [
  { label: '站内通知', value: 'notification' },
  { label: '短信', value: 'sms' },
  { label: '企业微信', value: 'wechat' },
  { label: '邮件', value: 'email' },
]

const variableOptions = ['{customerName}', '{phone}', '{status}', '{assignee}', '{date}', '{source}']

async function fetchTemplates() {
  const { data } = await settingsApi.reminders.list()
  templates.value = data
}

function openCreate() {
  editingTemplate.value = { name: '', type: 'followup_reminder', channels: ['notification'], templateText: '', variables: [] }
  showModal.value = true
}

function openEdit(tpl: ReminderTemplate) {
  editingTemplate.value = { ...tpl }
  showModal.value = true
}

async function saveTemplate() {
  if (!editingTemplate.value) return
  if (editingTemplate.value.id) {
    await settingsApi.reminders.update(editingTemplate.value.id, editingTemplate.value)
  } else {
    await settingsApi.reminders.create(editingTemplate.value)
  }
  showModal.value = false
  await fetchTemplates()
}

function confirmDelete(id: number) {
  deletingId.value = id
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (deletingId.value) {
    await settingsApi.reminders.delete(deletingId.value)
    showDeleteConfirm.value = false
    await fetchTemplates()
  }
}

function insertVariable(v: string) {
  if (editingTemplate.value) {
    editingTemplate.value.templateText = (editingTemplate.value.templateText || '') + v
  }
}

onMounted(fetchTemplates)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-800">提醒模板</h1>
      <button
        class="px-4 py-2 bg-amber-500 text-white text-sm rounded-md hover:bg-amber-600 flex items-center gap-1"
        @click="openCreate"
      >
        <Plus class="w-4 h-4" /> 新建模板
      </button>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div
        v-for="tpl in templates"
        :key="tpl.id"
        class="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="font-medium text-slate-800">{{ tpl.name }}</span>
          <div class="flex items-center gap-1">
            <button class="p-1 rounded hover:bg-slate-100" @click="openEdit(tpl)">
              <Edit2 class="w-4 h-4 text-slate-500" />
            </button>
            <button class="p-1 rounded hover:bg-red-50" @click="confirmDelete(tpl.id)">
              <Trash2 class="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">{{ templateTypes.find(t => t.value === tpl.type)?.label || tpl.type }}</span>
          <span class="text-xs text-slate-400">{{ tpl.channels.join('、') }}</span>
        </div>
        <p class="text-sm text-slate-500 line-clamp-2">{{ tpl.templateText }}</p>
        <p class="text-xs text-slate-400 mt-2">作用范围：{{ tpl.scopePreview }}</p>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40" @click="showModal = false" />
        <div class="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
          <h3 class="font-medium text-slate-800 mb-4">{{ editingTemplate?.id ? '编辑模板' : '新建模板' }}</h3>
          <form @submit.prevent="saveTemplate" class="space-y-4">
            <div>
              <label class="block text-sm text-slate-700 mb-1">模板名称</label>
              <input v-model="editingTemplate!.name" class="w-full h-9 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
            </div>
            <div>
              <label class="block text-sm text-slate-700 mb-1">模板类型</label>
              <select v-model="editingTemplate!.type" class="w-full h-9 px-3 rounded-md border border-slate-300 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-amber-500">
                <option v-for="t in templateTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-slate-700 mb-1">通知渠道</label>
              <div class="flex gap-3">
                <label v-for="ch in channelOptions" :key="ch.value" class="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    :value="ch.value"
                    :checked="editingTemplate!.channels?.includes(ch.value)"
                    @change="($event: any) => {
                      const checked = $event.target.checked
                      if (checked) editingTemplate!.channels = [...(editingTemplate!.channels || []), ch.value]
                      else editingTemplate!.channels = (editingTemplate!.channels || []).filter((c: string) => c !== ch.value)
                    }"
                  />
                  {{ ch.label }}
                </label>
              </div>
            </div>
            <div>
              <label class="block text-sm text-slate-700 mb-1">模板内容</label>
              <textarea
                v-model="editingTemplate!.templateText"
                rows="4"
                class="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <div class="flex flex-wrap gap-1 mt-2">
                <button
                  v-for="v in variableOptions"
                  :key="v"
                  type="button"
                  class="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                  @click="insertVariable(v)"
                >
                  {{ v }}
                </button>
              </div>
            </div>
            <div class="flex justify-end gap-3">
              <button type="button" class="px-4 py-2 text-sm rounded-md border border-slate-300 hover:bg-slate-50" @click="showModal = false">取消</button>
              <button type="submit" class="px-4 py-2 text-sm rounded-md bg-amber-500 text-white hover:bg-amber-600">保存</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <ConfirmDialog
      :visible="showDeleteConfirm"
      title="删除模板"
      message="确定要删除此提醒模板吗？"
      @confirm="handleDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>
