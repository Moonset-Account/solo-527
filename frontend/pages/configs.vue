<template>
  <div class="page-container">
    <div class="card mb-md">
      <div class="flex justify-between items-center mb-md">
        <div class="section-title" style="margin:0;">系统配置 · 管理员维护生效条件与选项</div>
        <n-button type="primary" @click="showCreate = true">
          <template #icon><n-icon><AddOutline /></n-icon></template>
          新增配置
        </n-button>
      </div>
      <div class="hint-bar">
        🔧 管理员可维护 <b>合同版本</b>、<b>整改期限</b>、<b>风险等级</b>、<b>生效条件</b> 等核心配置，供业务环节下拉引用。
      </div>
    </div>

    <div class="config-groups">
      <div v-for="(items, type) in grouped" :key="type" class="card mb-md">
        <div class="flex justify-between items-center mb-sm">
          <h3 class="group-title">
            <span class="group-badge">{{ groupIcon(type) }}</span>
            {{ groupName(type) }}
            <span class="group-count">共 {{ items.length }} 项</span>
          </h3>
          <n-button size="small" text type="primary" @click="openCreate(type)">+ 新增</n-button>
        </div>
        <n-data-table
          :columns="typeCols(type)"
          :data="items"
          size="small"
          :pagination="false"
        />
      </div>
    </div>

    <n-modal v-model:show="showCreate" preset="card" :title="editingId ? '编辑配置' : '新增配置'" style="width:560px">
      <n-form :model="form" label-width="120">
        <n-form-item label="配置类型" required>
          <n-select v-model:value="form.config_type" :options="typeOpts" :disabled="!!editingId" />
        </n-form-item>
        <n-form-item label="配置Key" required>
          <n-input v-model:value="form.config_key" placeholder="例如：V3.0、P14、RISK_HIGH" />
        </n-form-item>
        <n-form-item label="显示值">
          <n-input v-model:value="form.config_value" placeholder="展示给用户的文本值" />
        </n-form-item>
        <n-form-item label="描述">
          <n-input v-model:value="form.description" placeholder="配置描述/说明" />
        </n-form-item>
        <div class="grid-cols-2">
          <n-form-item label="生效起始日">
            <n-date-picker v-model:value="form.effective_start" type="date" style="width:100%" value-format="yyyy-MM-dd" />
          </n-form-item>
          <n-form-item label="生效终止日">
            <n-date-picker v-model:value="form.effective_end" type="date" style="width:100%" value-format="yyyy-MM-dd" />
          </n-form-item>
        </div>
        <n-form-item label="排序号">
          <n-input-number v-model:value="form.sort_order" :min="0" style="width:100%" />
        </n-form-item>
        <n-form-item label="是否启用">
          <n-switch v-model:value="form.is_active" />
        </n-form-item>
        <n-form-item label="扩展数据(JSON)" v-if="form.config_type === 'effective_condition'">
          <n-input v-model:value="form.config_data_str" type="textarea" :autosize="{minRows:4}" placeholder='{"critical_min": 1, "target_risk": "critical"}' />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-button @click="onCancel">取消</n-button>
        <n-button type="primary" :loading="saving" @click="onSubmit">{{ editingId ? '保存' : '创建' }}</n-button>
        <n-button v-if="editingId" type="error" ghost @click="onDelete">删除</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { AddOutline } from '@vicons/ionicons5'
import { NButton } from 'naive-ui'

const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const list = ref<any[]>([])
const showCreate = ref(false)
const editingId = ref<number | null>(null)
const form = reactive<any>({
  config_type: 'contract_version',
  config_key: '',
  config_value: '',
  description: '',
  effective_start: null,
  effective_end: null,
  sort_order: 0,
  is_active: true,
  config_data_str: '',
})

const typeOpts = [
  { value: 'contract_version', label: '合同版本' },
  { value: 'rectification_period', label: '整改期限' },
  { value: 'risk_level', label: '风险等级' },
  { value: 'effective_condition', label: '生效条件' },
  { value: 'checklist_category', label: '清单类别' },
]

const grouped = computed(() => {
  const g: Record<string, any[]> = {}
  typeOpts.forEach((t: any) => { g[t.value] = [] })
  list.value.forEach((x: any) => {
    if (!g[x.config_type]) g[x.config_type] = []
    g[x.config_type].push(x)
  })
  return g
})

function groupName(t: string) {
  return ({ contract_version: '📄 合同版本', rectification_period: '⏳ 整改期限（天）', risk_level: '🎯 风险等级', effective_condition: '⚙️ 生效条件（触发规则）', checklist_category: '📂 检查清单类别' } as any)[t] || t
}
function groupIcon(t: string) {
  return ({ contract_version: '📄', rectification_period: '⏳', risk_level: '🎯', effective_condition: '⚙️', checklist_category: '📂' } as any)[t] || '⚙️'
}

function typeCols(type: string) {
  const base = [
    { title: '启用', key: 'is_active', width: 60, render: (r: any) => r.is_active ? h('n-tag', { size: 'small', type: 'success', bordered: false }, () => '启用') : h('n-tag', { size: 'small', type: 'default', bordered: false }, () => '停用') },
    { title: '排序', key: 'sort_order', width: 70 },
    { title: 'Key', key: 'config_key', width: 160 },
    { title: '值', key: 'config_value', render: (r: any) => r.config_value || '<空>' },
    { title: '描述', key: 'description', ellipsis: { tooltip: true } },
    { title: '生效区间', key: 'period', width: 200, render: (r: any) => {
      if (!r.effective_start && !r.effective_end) return h('span', { style: 'color:#9ca3af' }, '长期有效')
      return h('span', {}, `${r.effective_start || '-∞'} ~ ${r.effective_end || '+∞'}`)
    }},
    type === 'effective_condition' ? { title: '规则参数', key: 'config_data', render: (r: any) => JSON.stringify(r.config_data || {}) } : null,
    { title: '操作', key: 'ops', width: 100, render: (r: any) => h(NButton, { size: 'small', text: true, type: 'primary', onClick: () => openEdit(r) }, () => '编辑') },
  ].filter(Boolean) as any[]
  return base
}

function openCreate(type: string) { editingId.value = null; Object.assign(form, { config_type: type, config_key: '', config_value: '', description: '', effective_start: null, effective_end: null, sort_order: 0, is_active: true, config_data_str: '' }); showCreate.value = true }
function openEdit(r: any) {
  editingId.value = r.id
  Object.assign(form, {
    config_type: r.config_type,
    config_key: r.config_key,
    config_value: r.config_value,
    description: r.description || '',
    effective_start: r.effective_start,
    effective_end: r.effective_end,
    sort_order: r.sort_order || 0,
    is_active: r.is_active,
    config_data_str: typeof r.config_data === 'object' ? JSON.stringify(r.config_data, null, 2) : (r.config_data || ''),
  })
  showCreate.value = true
}
function onCancel() { showCreate.value = false; editingId.value = null }

async function onSubmit() {
  if (!form.config_key) { (window as any).__n_msg?.warning('请填写配置Key'); return }
  saving.value = true
  try {
    const api = useApi()
    const payload: any = { ...form }
    delete payload.config_data_str
    if (form.config_type === 'effective_condition' && form.config_data_str) {
      try { payload.config_data = JSON.parse(form.config_data_str) } catch { (window as any).__n_msg?.error('扩展数据JSON解析失败'); return }
    }
    if (editingId.value) {
      await api.patch(`/configs/${editingId.value}`, payload)
    } else {
      await api.post('/configs', payload)
    }
    (window as any).__n_msg?.success('保存成功')
    showCreate.value = false
    editingId.value = null
    await load()
  } finally { saving.value = false }
}

async function onDelete() {
  if (!editingId.value) return
  saving.value = true
  try {
    const api = useApi()
    await api.delete(`/configs/${editingId.value}`)
    (window as any).__n_msg?.success('已删除')
    showCreate.value = false
    editingId.value = null
    await load()
  } finally { saving.value = false }
}

async function load() {
  loading.value = true
  try {
    const api = useApi()
    list.value = await api.get('/configs')
  } finally { loading.value = false }
}

onMounted(load)
</script>

<style scoped>
.hint-bar {
  background: linear-gradient(90deg, #e8f5ee, #f0fdf6);
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  color: #1b6b46;
}
.group-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
}
.group-badge { font-size: 18px; }
.group-count { font-size: 12px; color: #6b7280; font-weight: 400; }
.config-groups { display: flex; flex-direction: column; }
.grid-cols-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.flex { display: flex; }
.gap-sm { gap: 8px; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.mb-md { margin-bottom: 16px; }
.mb-sm { margin-bottom: 8px; }
</style>
