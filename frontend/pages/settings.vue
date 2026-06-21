<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">系统设置</h2>
      <n-space>
        <n-button type="primary" @click="initDefaults">初始化默认配置</n-button>
      </n-space>
    </div>

    <n-tabs v-model:value="activeTab">
      <n-tab-pane name="modules" tab="模块管理">
        <div class="card">
          <n-data-table
            :columns="moduleColumns"
            :data="moduleSettings"
            :loading="loading"
            :pagination="false"
          />
        </div>
      </n-tab-pane>

      <n-tab-pane name="inventory" tab="库存配置">
        <div class="card">
          <h3 style="margin-bottom: 20px">库存模块配置</h3>
          <n-form :model="inventorySettings" label-width="200px">
            <n-form-item label="启用库存管理模块">
              <n-switch v-model:value="inventorySettings.enabled" @update:value="(v) => updateSetting('inventory', 'enabled', v)" />
            </n-form-item>
            <n-form-item label="低库存预警阈值">
              <n-input-number v-model:value="inventorySettings.low_stock_threshold" :min="0" @update:value="(v) => updateSetting('inventory', 'low_stock_threshold', v)" />
            </n-form-item>
            <n-form-item label="自动检查库存预警">
              <n-switch v-model:value="inventorySettings.auto_check_alerts" @update:value="(v) => updateSetting('inventory', 'auto_check_alerts', v)" />
            </n-form-item>
          </n-form>
        </div>
      </n-tab-pane>

      <n-tab-pane name="inspection" tab="巡店配置">
        <div class="card">
          <h3 style="margin-bottom: 20px">巡店模块配置</h3>
          <n-form :model="inspectionSettings" label-width="200px">
            <n-form-item label="启用巡店管理模块">
              <n-switch v-model:value="inspectionSettings.enabled" @update:value="(v) => updateSetting('inspection', 'enabled', v)" />
            </n-form-item>
            <n-form-item label="合格分数阈值">
              <n-input-number v-model:value="inspectionSettings.default_score_threshold" :min="0" :max="100" @update:value="(v) => updateSetting('inspection', 'default_score_threshold', v)" />
            </n-form-item>
            <n-form-item label="不合格项自动创建整改">
              <n-switch v-model:value="inspectionSettings.auto_create_rectification" @update:value="(v) => updateSetting('inspection', 'auto_create_rectification', v)" />
            </n-form-item>
          </n-form>
        </div>
      </n-tab-pane>

      <n-tab-pane name="rectification" tab="整改配置">
        <div class="card">
          <h3 style="margin-bottom: 20px">整改模块配置</h3>
          <n-form :model="rectificationSettings" label-width="200px">
            <n-form-item label="启用整改管理模块">
              <n-switch v-model:value="rectificationSettings.enabled" @update:value="(v) => updateSetting('rectification', 'enabled', v)" />
            </n-form-item>
            <n-form-item label="整改默认期限(天)">
              <n-input-number v-model:value="rectificationSettings.default_deadline_days" :min="1" @update:value="(v) => updateSetting('rectification', 'default_deadline_days', v)" />
            </n-form-item>
          </n-form>
        </div>
      </n-tab-pane>

      <n-tab-pane name="loss" tab="报损配置">
        <div class="card">
          <h3 style="margin-bottom: 20px">报损模块配置</h3>
          <n-form :model="lossSettings" label-width="200px">
            <n-form-item label="启用报损管理模块">
              <n-switch v-model:value="lossSettings.enabled" @update:value="(v) => updateSetting('loss', 'enabled', v)" />
            </n-form-item>
            <n-form-item label="报损需要指定处理人">
              <n-switch v-model:value="lossSettings.require_handler" @update:value="(v) => updateSetting('loss', 'require_handler', v)" />
            </n-form-item>
          </n-form>
        </div>
      </n-tab-pane>

      <n-tab-pane name="labor" tab="人力成本配置">
        <div class="card">
          <h3 style="margin-bottom: 20px">人力成本模块配置</h3>
          <n-form :model="laborSettings" label-width="200px">
            <n-form-item label="启用人力成本模块">
              <n-switch v-model:value="laborSettings.enabled" @update:value="(v) => updateSetting('labor_cost', 'enabled', v)" />
            </n-form-item>
            <n-form-item label="默认时薪(元)">
              <n-input-number v-model:value="laborSettings.default_hourly_rate" :min="0" @update:value="(v) => updateSetting('labor_cost', 'default_hourly_rate', v)" />
            </n-form-item>
            <n-form-item label="默认加班时薪(元)">
              <n-input-number v-model:value="laborSettings.default_overtime_rate" :min="0" @update:value="(v) => updateSetting('labor_cost', 'default_overtime_rate', v)" />
            </n-form-item>
          </n-form>
        </div>
      </n-tab-pane>

      <n-tab-pane name="finance" tab="财务配置">
        <div class="card">
          <h3 style="margin-bottom: 20px">财务模块配置</h3>
          <n-form :model="financeSettings" label-width="200px">
            <n-form-item label="启用现金流水模块">
              <n-switch v-model:value="financeSettings.enabled" @update:value="(v) => updateSetting('cash_flow', 'enabled', v)" />
            </n-form-item>
          </n-form>
        </div>
      </n-tab-pane>
    </n-tabs>

    <n-modal v-model:show="showCreateModal" preset="card" title="新增配置项" style="width: 550px">
      <n-form :model="newSetting" :rules="newSettingRules" label-width="100px">
        <n-form-item label="模块" path="module">
          <n-select v-model:value="newSetting.module" :options="moduleOptions" placeholder="请选择模块" />
        </n-form-item>
        <n-form-item label="配置键" path="key">
          <n-input v-model:value="newSetting.key" placeholder="如：low_stock_threshold" />
        </n-form-item>
        <n-form-item label="值类型" path="value_type">
          <n-select v-model:value="newSetting.value_type" :options="typeOptions" placeholder="请选择值类型" />
        </n-form-item>
        <n-form-item label="配置值" path="value">
          <n-input v-model:value="newSetting.value" placeholder="请输入配置值" />
        </n-form-item>
        <n-form-item label="描述" path="description">
          <n-input v-model:value="newSetting.description" placeholder="请输入配置描述" />
        </n-form-item>
        <n-form-item label="启用">
          <n-switch v-model:value="newSetting.is_enabled" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="createSetting">确认</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, h } from 'vue'
import { useMessage } from 'naive-ui'

const message = useMessage()
const { getSettings, createSetting: apiCreateSetting, initDefaults: apiInitDefaults, toggleModule, setSettingValue } = useSettingsApi()
const { isSupervisor } = useAuth()

const loading = ref(false)
const submitting = ref(false)
const activeTab = ref('modules')
const settings = ref<SystemSetting[]>([])
const showCreateModal = ref(false)

const inventorySettings = reactive({
  enabled: true,
  low_stock_threshold: 10,
  auto_check_alerts: true
})

const inspectionSettings = reactive({
  enabled: true,
  default_score_threshold: 80,
  auto_create_rectification: true
})

const rectificationSettings = reactive({
  enabled: true,
  default_deadline_days: 7
})

const lossSettings = reactive({
  enabled: true,
  require_handler: true
})

const laborSettings = reactive({
  enabled: true,
  default_hourly_rate: 20,
  default_overtime_rate: 30
})

const financeSettings = reactive({
  enabled: true
})

const newSetting = reactive({
  module: null as string | null,
  key: '',
  value: '',
  value_type: 'string',
  description: '',
  is_enabled: true
})

const newSettingRules = {
  module: [{ required: true, message: '请选择模块', trigger: 'change' }],
  key: [{ required: true, message: '请输入配置键', trigger: 'blur' }],
  value: [{ required: true, message: '请输入配置值', trigger: 'blur' }]
}

const moduleOptions = [
  { label: '库存管理', value: 'inventory' },
  { label: '巡店管理', value: 'inspection' },
  { label: '整改管理', value: 'rectification' },
  { label: '现金流水', value: 'cash_flow' },
  { label: '烘焙批次', value: 'batch' },
  { label: '报损管理', value: 'loss' },
  { label: '人力成本', value: 'labor_cost' }
]

const typeOptions = [
  { label: '字符串', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '整数', value: 'integer' },
  { label: '布尔值', value: 'boolean' },
  { label: 'JSON', value: 'json' }
]

const moduleSettings = computed(() => {
  const modules = {} as Record<string, any>
  settings.value.forEach(s => {
    if (!modules[s.module]) {
      modules[s.module] = {
        module: s.module,
        moduleName: getModuleLabel(s.module),
        enabled: true,
        settings: []
      }
    }
    if (s.key === 'enabled') {
      modules[s.module].enabled = s.value?.toLowerCase() === 'true'
    }
    modules[s.module].settings.push(s)
  })
  return Object.values(modules)
})

const getModuleLabel = (module: string) => {
  const map: Record<string, string> = {
    inventory: '库存管理', inspection: '巡店管理', rectification: '整改管理',
    cash_flow: '现金流水', batch: '烘焙批次', loss: '报损管理', labor_cost: '人力成本'
  }
  return map[module] || module
}

const moduleColumns = [
  { title: '模块', key: 'moduleName', width: 120 },
  { title: '状态', key: 'enabled', width: 100, render: (row: any) => h('n-tag', { type: row.enabled ? 'success' : 'default' }, () => row.enabled ? '已启用' : '已禁用') },
  { title: '配置项数量', key: 'count', render: (row: any) => row.settings.length },
  {
    title: '操作', key: 'actions', width: 150, render: (row: any) => h('div', { class: 'table-actions' }, [
      h('n-button', {
        size: 'small',
        type: row.enabled ? 'default' : 'primary',
        onClick: () => handleToggleModule(row.module, !row.enabled)
      }, () => row.enabled ? '禁用' : '启用')
    ])
  }
]

const loadSettings = async () => {
  loading.value = true
  try {
    settings.value = await getSettings({ enabled_only: false })

    const getVal = (module: string, key: string, defaultVal: any) => {
      const s = settings.value.find(st => st.module === module && st.key === key)
      if (!s) return defaultVal
      if (s.value_type === 'boolean') return s.value?.toLowerCase() === 'true'
      if (s.value_type === 'number') return parseFloat(s.value || '0')
      if (s.value_type === 'integer') return parseInt(s.value || '0')
      return s.value
    }

    inventorySettings.enabled = getVal('inventory', 'enabled', true)
    inventorySettings.low_stock_threshold = getVal('inventory', 'low_stock_threshold', 10)
    inventorySettings.auto_check_alerts = getVal('inventory', 'auto_check_alerts', true)

    inspectionSettings.enabled = getVal('inspection', 'enabled', true)
    inspectionSettings.default_score_threshold = getVal('inspection', 'default_score_threshold', 80)
    inspectionSettings.auto_create_rectification = getVal('inspection', 'auto_create_rectification', true)

    rectificationSettings.enabled = getVal('rectification', 'enabled', true)
    rectificationSettings.default_deadline_days = getVal('rectification', 'default_deadline_days', 7)

    lossSettings.enabled = getVal('loss', 'enabled', true)
    lossSettings.require_handler = getVal('loss', 'require_handler', true)

    laborSettings.enabled = getVal('labor_cost', 'enabled', true)
    laborSettings.default_hourly_rate = getVal('labor_cost', 'default_hourly_rate', 20)
    laborSettings.default_overtime_rate = getVal('labor_cost', 'default_overtime_rate', 30)

    financeSettings.enabled = getVal('cash_flow', 'enabled', true)
  } finally {
    loading.value = false
  }
}

const updateSetting = async (module: string, key: string, value: any) => {
  try {
    let type = 'boolean'
    if (typeof value === 'number') type = Number.isInteger(value) ? 'integer' : 'number'
    await setSettingValue(module, key, String(value), type)
    message.success('配置已更新')
  } catch (e: any) {
    message.error(e.data?.detail || '更新失败')
  }
}

const handleToggleModule = async (module: string, enabled: boolean) => {
  try {
    await toggleModule(module, enabled)
    message.success(`${enabled ? '启用' : '禁用'}成功`)
    loadSettings()
  } catch (e: any) {
    message.error(e.data?.detail || '操作失败')
  }
}

const initDefaults = async () => {
  try {
    const res = await apiInitDefaults()
    message.success(`初始化完成，新增${res.created}条配置`)
    loadSettings()
  } catch (e: any) {
    message.error(e.data?.detail || '初始化失败')
  }
}

const createSetting = async () => {
  try {
    submitting.value = true
    await apiCreateSetting(newSetting as any)
    message.success('配置已创建')
    showCreateModal.value = false
    Object.assign(newSetting, { module: null, key: '', value: '', value_type: 'string', description: '', is_enabled: true })
    loadSettings()
  } catch (e: any) {
    message.error(e.data?.detail || '创建失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>
