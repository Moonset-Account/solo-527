<template>
  <div class="page-container">
    <div class="card mb-md">
      <div class="flex justify-between items-center mb-md">
        <div class="section-title" style="margin:0;">📋 检查清单模板管理</div>
        <n-button type="primary" @click="showEdit = true; editingId = null; resetForm()">
          <template #icon><n-icon><AddOutline /></n-icon></template>
          新建模板
        </n-button>
      </div>
    </div>

    <div class="card">
      <n-spin :show="loading">
        <n-data-table
          :columns="cols"
          :data="list"
          :pagination="pagination"
          @update:page="(p) => { page.value = p; load() }"
        />
      </n-spin>
    </div>

    <n-modal v-model:show="showEdit" preset="card" :title="editingId ? '编辑模板' : '新建模板'" style="width:min(900px, 95vw)">
      <n-tabs v-model:value="tab" type="line">
        <n-tab-pane name="base" tab="基本信息">
          <n-form :model="form" label-width="120" style="max-width: 640px; padding: 16px 0;">
            <n-form-item label="模板名称" required>
              <n-input v-model:value="form.name" placeholder="例如：数据合规通用检查清单" />
            </n-form-item>
            <div class="grid-cols-2">
              <n-form-item label="适用版本">
                <n-select v-model:value="form.contract_version" :options="versionOpts" filterable tag allow-create clearable />
              </n-form-item>
              <n-form-item label="分类">
                <n-select v-model:value="form.category" :options="categoryOpts" filterable tag allow-create clearable />
              </n-form-item>
            </div>
            <n-form-item label="描述">
              <n-input v-model:value="form.description" type="textarea" :autosize="{minRows: 2}" />
            </n-form-item>
            <n-form-item label="启用状态">
              <n-switch v-model:value="form.is_active" />
            </n-form-item>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="items" tab="检查项配置">
          <div style="padding: 8px 0 16px;">
            <div class="flex justify-between items-center mb-sm">
              <div class="hint">💡 按章节组织检查项，每项可设置默认风险等级与所需证据。</div>
              <n-button size="small" type="primary" @click="addItem">
                <template #icon><n-icon><AddOutline /></n-icon></template>
                新增检查项
              </n-button>
            </div>
            <n-data-table
              :columns="itemCols"
              :data="form.items"
              size="small"
              :pagination="false"
            />
          </div>
        </n-tab-pane>
      </n-tabs>
      <template #footer>
        <n-button @click="showEdit = false">取消</n-button>
        <n-button type="primary" :loading="saving" @click="onSave">保存模板</n-button>
      </template>
    </n-modal>

    <n-modal v-model:show="showItem" preset="card" title="检查项编辑" style="width:560px">
      <n-form :model="itemForm" label-width="120">
        <n-form-item label="所属章节">
          <n-select v-model:value="itemForm.section" filterable tag allow-create :options="sectionOpts" placeholder="例如：数据处理范围" />
        </n-form-item>
        <n-form-item label="排序号">
          <n-input-number v-model:value="itemForm.item_order" :min="0" style="width:100%" />
        </n-form-item>
        <n-form-item label="检查问题" required>
          <n-input v-model:value="itemForm.question" type="textarea" :autosize="{minRows: 2}" placeholder="例如：是否明确约定数据处理的目的？" />
        </n-form-item>
        <n-form-item label="详细描述">
          <n-input v-model:value="itemForm.description" type="textarea" :autosize="{minRows: 2}" />
        </n-form-item>
        <n-form-item label="所需证据">
          <n-input v-model:value="itemForm.required_evidence" placeholder="例如：DPA附件、处理清单" />
        </n-form-item>
        <n-form-item label="默认风险等级">
          <n-select v-model:value="itemForm.default_risk_level" :options="riskOpts" clearable />
        </n-form-item>
        <n-form-item label="是否必填">
          <n-switch v-model:value="itemForm.is_required" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-button @click="showItem = false">取消</n-button>
        <n-button type="primary" @click="onSaveItem">{{ editingItemIdx >= 0 ? '保存' : '新增' }}</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import { AddOutline } from '@vicons/ionicons5'
import { NButton, NPopconfirm } from 'naive-ui'

const loading = ref(false)
const saving = ref(false)
const page = ref(1)
const pageSize = 20
const total = ref(0)
const list = ref<any[]>([])
const versionOpts = ref<any[]>([])
const categoryOpts = ref<any[]>([])
const riskOpts = [
  { value: 'critical', label: '极高' },
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
]
const sectionOpts = ref<any[]>([])

const showEdit = ref(false)
const editingId = ref<number | null>(null)
const tab = ref('base')
const form = reactive<any>({
  name: '', description: '', contract_version: '', category: '', is_active: true, items: [],
})

const showItem = ref(false)
const editingItemIdx = ref(-1)
const itemForm = reactive<any>({
  item_order: 0, section: '', question: '', description: '', required_evidence: '', default_risk_level: '', is_required: true,
})

const pagination = computed(() => ({ pageSize, itemCount: total.value }))
const cols = computed(() => [
  { title: 'ID', key: 'id', width: 64 },
  { title: '模板名称', key: 'name', render: (r: any) => h('b', { style: 'color:#1f2937' }, r.name) },
  { title: '分类', key: 'category', width: 120 },
  { title: '适用版本', key: 'contract_version', width: 120 },
  { title: '检查项数', key: 'items_count', width: 100, render: (r: any) => `${r.items?.length || 0} 项` },
  { title: '状态', key: 'is_active', width: 80, render: (r: any) => r.is_active ? h('n-tag', { size: 'small', type: 'success', bordered: false }, () => '启用') : h('n-tag', { size: 'small', type: 'default', bordered: false }, () => '停用') },
  { title: '创建时间', key: 'created_at', width: 160, render: (r: any) => (r.created_at || '').slice(0,16).replace('T',' ') },
  { title: '操作', key: 'ops', width: 160, render: (r: any) => h('div', { style: 'display:flex;gap:8px' }, [
    h(NButton, { size: 'small', text: true, type: 'primary', onClick: () => openEdit(r) }, () => '编辑'),
    h(NButton, { size: 'small', text: true, onClick: () => {
      router.push(`/checklists/create?template_id=${r.id}`)
    } }, () => '用此新建'),
  ]) },
])
const router = useRouter()

const itemCols = computed(() => [
  { title: '#', key: 'item_order', width: 50 },
  { title: '章节', key: 'section', width: 140 },
  { title: '检查问题', key: 'question', ellipsis: { tooltip: true } },
  { title: '风险', key: 'default_risk_level', width: 80, render: (r: any) => riskLabel(r.default_risk_level) },
  { title: '必填', key: 'is_required', width: 60, render: (r: any) => r.is_required ? '✅' : '' },
  { title: '操作', key: 'ops', width: 120, render: (_: any, idx: number) => h('div', { style: 'display:flex;gap:8px' }, [
    h(NButton, { size: 'small', text: true, type: 'primary', onClick: () => editItem(idx) }, () => '编辑'),
    h(NPopconfirm, { onPositiveClick: () => form.items.splice(idx, 1) }, {
      default: () => '确定删除？',
      trigger: () => h(NButton, { size: 'small', text: true, type: 'error' }, () => '删除'),
    }),
  ]) },
])

function riskLabel(v: string) {
  const m: Record<string, any> = { critical: ['极高', '#d03050'], high: ['高', '#f0a020'], medium: ['中', '#1d6ff2'], low: ['低', '#208080'] }
  const [t, c] = m[v] || ['-', '#8a8f99']
  return h('n-tag', { size: 'small', color: c, 'text-color': '#fff', bordered: false }, () => t)
}

function resetForm() {
  Object.assign(form, { name: '', description: '', contract_version: '', category: '', is_active: true, items: [] })
}
function openEdit(r: any) {
  editingId.value = r.id
  Object.assign(form, {
    name: r.name, description: r.description || '', contract_version: r.contract_version || '',
    category: r.category || '', is_active: r.is_active !== false,
    items: (r.items || []).map((it: any) => ({ ...it })),
  })
  tab.value = 'base'
  showEdit.value = true
}

function addItem() {
  editingItemIdx.value = -1
  Object.assign(itemForm, {
    item_order: (form.items.length + 1),
    section: '', question: '', description: '', required_evidence: '',
    default_risk_level: '', is_required: true,
  })
  showItem.value = true
}
function editItem(idx: number) {
  editingItemIdx.value = idx
  Object.assign(itemForm, { ...form.items[idx] })
  showItem.value = true
}
function onSaveItem() {
  if (!itemForm.question) { (window as any).__n_msg?.warning('请填写检查问题'); return }
  if (editingItemIdx.value >= 0) {
    form.items.splice(editingItemIdx.value, 1, { ...itemForm })
  } else {
    form.items.push({ ...itemForm })
  }
  // 更新section选项
  const secs = new Set(form.items.map((x: any) => x.section).filter(Boolean))
  sectionOpts.value = Array.from(secs).map((s: any) => ({ value: s, label: s }))
  showItem.value = false
}

async function onSave() {
  if (!form.name) { (window as any).__n_msg?.warning('请填写模板名称'); return }
  saving.value = true
  try {
    const api = useApi()
    if (editingId.value) {
      await api.patch(`/checklists/templates/${editingId.value}`, { ...form })
    } else {
      await api.post('/checklists/templates', { ...form })
    }
    (window as any).__n_msg?.success('保存成功')
    showEdit.value = false
    await load()
  } finally { saving.value = false }
}

async function load() {
  loading.value = true
  try {
    const api = useApi()
    const [tpl, cfg] = await Promise.all([
      api.get('/checklists/templates', { page: page.value, page_size: pageSize }),
      api.get('/configs/grouped'),
    ])
    list.value = tpl.items
    total.value = tpl.total
    versionOpts.value = (cfg.contract_version || []).map((c: any) => ({ value: c.value, label: `${c.value} · ${c.description || ''}` }))
    categoryOpts.value = (cfg.checklist_category || []).map((c: any) => ({ value: c.value, label: c.description || c.key }))
    // 收集已有的sections
    const secs = new Set<string>()
    list.value.forEach((t: any) => (t.items || []).forEach((it: any) => it.section && secs.add(it.section)))
    sectionOpts.value = Array.from(secs).map((s) => ({ value: s, label: s }))
  } finally { loading.value = false }
}

onMounted(load)
</script>

<style scoped>
.grid-cols-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.flex { display: flex; }
.gap-sm { gap: 8px; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.mb-md { margin-bottom: 16px; }
.mb-sm { margin-bottom: 8px; }
.hint { font-size: 13px; color: #6b7280; }
</style>
