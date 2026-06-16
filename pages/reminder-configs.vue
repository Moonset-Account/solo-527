<template>
  <div>
    <div class="card mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-800">提醒规则配置</h3>
          <p class="text-sm text-gray-500 mt-1">管理爽约触发条件、阈值和阻断告警规则。普通提示与阻断告警严格分离配置。</p>
        </div>
        <button class="btn-primary" @click="showCreateModal = true">+ 新增规则</button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-6 mb-6">
      <div class="card">
        <h4 class="font-semibold text-blue-700 mb-4 flex items-center gap-2">
          <span>ℹ️</span> 普通提示规则 (INFO)
        </h4>
        <div class="space-y-3">
          <div v-for="c in infoConfigs" :key="c.id" class="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div class="flex items-center justify-between">
              <span class="font-medium">{{ c.name }}</span>
              <span class="flex items-center gap-2">
                <BadgeTag :text="c.isEnabled ? '已启用' : '已禁用'" :color-class="c.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'" />
                <button class="text-primary-600 text-sm hover:underline" @click="editConfig(c)">编辑</button>
              </span>
            </div>
            <p class="text-sm text-gray-600 mt-1">触发: {{ c.triggerType }}</p>
            <p class="text-sm text-gray-600">
              阈值: 
              <span v-if="c.thresholdMinutes">{{ c.thresholdMinutes }} 分钟</span>
              <span v-if="c.thresholdHours">{{ c.thresholdHours }} 小时</span>
              <span v-if="c.thresholdDays">{{ c.thresholdDays }} 天</span>
            </p>
            <p class="text-xs text-gray-500 mt-1">{{ c.messageTemplate }}</p>
          </div>
        </div>
      </div>

      <div class="card">
        <h4 class="font-semibold text-yellow-700 mb-4 flex items-center gap-2">
          <span>⚠️</span> 警告规则 (WARNING)
        </h4>
        <div class="space-y-3">
          <div v-for="c in warningConfigs" :key="c.id" class="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
            <div class="flex items-center justify-between">
              <span class="font-medium">{{ c.name }}</span>
              <span class="flex items-center gap-2">
                <BadgeTag :text="c.isEnabled ? '已启用' : '已禁用'" :color-class="c.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'" />
                <button class="text-primary-600 text-sm hover:underline" @click="editConfig(c)">编辑</button>
              </span>
            </div>
            <p class="text-sm text-gray-600 mt-1">触发: {{ c.triggerType }}</p>
            <p class="text-sm text-gray-600">
              阈值: 
              <span v-if="c.thresholdMinutes">{{ c.thresholdMinutes }} 分钟</span>
              <span v-if="c.thresholdHours">{{ c.thresholdHours }} 小时</span>
              <span v-if="c.thresholdDays">{{ c.thresholdDays }} 天</span>
            </p>
            <p class="text-xs text-gray-500 mt-1">{{ c.messageTemplate }}</p>
          </div>
        </div>
      </div>

      <div class="card col-span-2">
        <h4 class="font-semibold text-red-700 mb-4 flex items-center gap-2">
          <span>🚨</span> 阻断告警规则 (CRITICAL) - 会触发阻断动作
        </h4>
        <div class="space-y-3">
          <div v-for="c in criticalConfigs" :key="c.id" class="p-3 bg-red-50 rounded-lg border border-red-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ c.name }}</span>
                <BadgeTag text="阻断告警" color-class="bg-red-600 text-white" />
                <span v-if="c.isBlocking" class="badge bg-red-200 text-red-800">会阻断流程</span>
              </div>
              <span class="flex items-center gap-2">
                <BadgeTag :text="c.isEnabled ? '已启用' : '已禁用'" :color-class="c.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'" />
                <button class="text-primary-600 text-sm hover:underline" @click="editConfig(c)">编辑</button>
              </span>
            </div>
            <p class="text-sm text-gray-600 mt-1">触发: {{ c.triggerType }}</p>
            <p class="text-sm text-gray-600">
              阈值: 
              <span v-if="c.thresholdMinutes">{{ c.thresholdMinutes }} 分钟</span>
              <span v-if="c.thresholdHours">{{ c.thresholdHours }} 小时</span>
              <span v-if="c.thresholdDays">{{ c.thresholdDays }} 天</span>
            </p>
            <p class="text-xs text-red-600 mt-1 font-medium">{{ c.messageTemplate }}</p>
          </div>
          <div v-if="criticalConfigs.length === 0" class="text-center py-4 text-gray-400 text-sm">暂无阻断告警规则</div>
        </div>
      </div>
    </div>

    <div v-if="showCreateModal || editingConfig" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="closeModal">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold mb-4">{{ editingConfig ? '编辑规则' : '新增提醒规则' }}</h3>
        <div class="space-y-4">
          <div>
            <label class="label">规则名称</label>
            <input v-model="form.name" type="text" class="input" />
          </div>
          <div>
            <label class="label">触发类型</label>
            <select v-model="form.triggerType" class="input">
              <option value="INTERVIEW_UPCOMING">面试即将开始</option>
              <option value="CANDIDATE_NO_SHOW">候选人爽约</option>
              <option value="ASSESSMENT_DUE">测评即将到期</option>
              <option value="STAGE_STALLED">阶段停滞</option>
              <option value="FOLLOW_UP_NEEDED">需要跟进</option>
              <option value="NO_SHOW_FIRST">首次爽约</option>
              <option value="NO_SHOW_REPEAT">重复爽约</option>
            </select>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="label">阈值(分钟)</label>
              <input v-model.number="form.thresholdMinutes" type="number" class="input" min="0" />
            </div>
            <div>
              <label class="label">阈值(小时)</label>
              <input v-model.number="form.thresholdHours" type="number" class="input" min="0" />
            </div>
            <div>
              <label class="label">阈值(天)</label>
              <input v-model.number="form.thresholdDays" type="number" class="input" min="0" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">严重级别</label>
              <select v-model="form.severity" class="input">
                <option value="INFO">普通提示 (INFO)</option>
                <option value="WARNING">警告 (WARNING)</option>
                <option value="CRITICAL">阻断告警 (CRITICAL)</option>
              </select>
            </div>
            <div>
              <label class="label">是否阻断流程</label>
              <div class="flex items-center gap-2 mt-2">
                <input type="checkbox" v-model="form.isBlocking" class="w-5 h-5" />
                <span class="text-sm text-gray-600">是（仅 CRITICAL 级别建议开启）</span>
              </div>
            </div>
          </div>
          <div>
            <label class="label">启用状态</label>
            <div class="flex items-center gap-2 mt-2">
              <input type="checkbox" v-model="form.isEnabled" class="w-5 h-5" />
              <span class="text-sm text-gray-600">启用此规则</span>
            </div>
          </div>
          <div>
            <label class="label">消息模板</label>
            <textarea v-model="form.messageTemplate" class="input" rows="3" placeholder="可使用占位符如 {candidateName}, {interviewTime} 等"></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button class="btn-secondary" @click="closeModal">取消</button>
          <button class="btn-primary" @click="handleSave">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useReminderStore } from '~/stores/reminder'

const reminderStore = useReminderStore()
const configs = computed(() => reminderStore.reminderConfigs)

const infoConfigs = computed(() => configs.value.filter(c => c.severity === 'INFO'))
const warningConfigs = computed(() => configs.value.filter(c => c.severity === 'WARNING'))
const criticalConfigs = computed(() => configs.value.filter(c => c.severity === 'CRITICAL'))

const showCreateModal = ref(false)
const editingConfig = ref<any>(null)
const form = reactive({
  id: null as number | null,
  name: '',
  triggerType: 'CANDIDATE_NO_SHOW',
  thresholdMinutes: null as number | null,
  thresholdHours: null as number | null,
  thresholdDays: null as number | null,
  severity: 'INFO',
  isBlocking: false,
  isEnabled: true,
  messageTemplate: ''
})

function resetForm() {
  Object.assign(form, {
    id: null, name: '', triggerType: 'CANDIDATE_NO_SHOW',
    thresholdMinutes: null, thresholdHours: null, thresholdDays: null,
    severity: 'INFO', isBlocking: false, isEnabled: true, messageTemplate: ''
  })
}

function editConfig(c: any) {
  editingConfig.value = c
  Object.assign(form, {
    id: c.id, name: c.name, triggerType: c.triggerType,
    thresholdMinutes: c.thresholdMinutes, thresholdHours: c.thresholdHours, thresholdDays: c.thresholdDays,
    severity: c.severity, isBlocking: c.isBlocking, isEnabled: c.isEnabled, messageTemplate: c.messageTemplate
  })
}

function closeModal() {
  showCreateModal.value = false
  editingConfig.value = null
  resetForm()
}

async function handleSave() {
  if (!form.name) {
    alert('请填写规则名称')
    return
  }
  try {
    if (form.id) {
      await reminderStore.updateConfig(form.id, form)
    } else {
      await reminderStore.createConfig(form)
    }
    closeModal()
    reminderStore.fetchConfigs()
  } catch (e: any) {
    alert(e?.statusMessage || '保存失败')
  }
}

onMounted(() => reminderStore.fetchConfigs())
</script>
