<template>
  <div class="page-container">
    <div class="card mb-md">
      <div class="flex justify-between items-center mb-md">
        <div class="section-title" style="margin:0;">用户管理</div>
        <n-button type="primary" @click="showCreate = true">
          <template #icon><n-icon><PersonAddOutline /></n-icon></template>
          新增用户
        </n-button>
      </div>
      <div class="grid-cols-4 filters">
        <n-select v-model:value="q.role" :options="roleOpts" placeholder="角色筛选" clearable />
        <n-input v-model:value="q.keyword" placeholder="姓名/用户名/邮箱搜索" clearable />
        <n-select v-model:value="q.is_active" :options="statusOpts" placeholder="账号状态" clearable />
        <n-button type="primary" ghost @click="load" :loading="loading">查询</n-button>
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

    <n-modal v-model:show="showCreate" preset="card" title="新增用户" style="width:520px">
      <UserForm @success="onCreated" @cancel="showCreate = false" />
    </n-modal>
    <n-modal v-model:show="showEdit" preset="card" title="编辑用户" style="width:520px">
      <UserForm v-if="editingId" :user-id="editingId" @success="onEdited" @cancel="showEdit = false" />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import { PersonAddOutline } from '@vicons/ionicons5'
import { NButton, NSwitch } from 'naive-ui'
import UserForm from '~/components/UserForm.vue'

const loading = ref(false)
const page = ref(1)
const pageSize = 20
const total = ref(0)
const q = reactive<any>({ role: null, keyword: '', is_active: null })
const list = ref<any[]>([])

const showCreate = ref(false)
const showEdit = ref(false)
const editingId = ref<number | null>(null)

const roleOpts = [
  { value: 'admin', label: '系统管理员' },
  { value: 'compliance_manager', label: '合规经理' },
  { value: 'lawyer', label: '律师' },
  { value: 'reviewer', label: '复核人' },
  { value: 'submitter', label: '业务提交人' },
]
const statusOpts = [
  { value: true, label: '启用' },
  { value: false, label: '禁用' },
]

const pagination = computed(() => ({ pageSize, itemCount: total.value }))
const cols = computed(() => [
  { title: 'ID', key: 'id', width: 64 },
  { title: '用户名', key: 'username', width: 120, render: (r: any) => h('b', {}, r.username) },
  { title: '姓名', key: 'full_name', width: 120 },
  { title: '角色', key: 'role', width: 130, render: (r: any) => roleTag(r.role) },
  { title: '邮箱', key: 'email' },
  { title: '部门', key: 'department', width: 120 },
  { title: '电话', key: 'phone', width: 130 },
  { title: '状态', key: 'is_active', width: 80, render: (r: any) => h(NSwitch, { value: r.is_active, disabled: true, size: 'small' }) },
  { title: '创建时间', key: 'created_at', width: 160, render: (r: any) => (r.created_at || '').slice(0,16).replace('T',' ') },
  { title: '操作', key: 'ops', width: 120, render: (r: any) => h('div', { style: 'display:flex;gap:8px' }, [
    h(NButton, { size: 'small', text: true, type: 'primary', onClick: () => openEdit(r.id) }, () => '编辑'),
  ]) },
])

function roleTag(v: string) {
  const m: Record<string, any> = {
    admin: ['系统管理员', 'error'],
    compliance_manager: ['合规经理', 'warning'],
    lawyer: ['律师', 'primary'],
    reviewer: ['复核人', 'success'],
    submitter: ['提交人', 'default'],
  }
  const [t, ty] = m[v] || [v, 'default']
  return h('n-tag', { size: 'small', type: ty, bordered: false }, () => t)
}
function openEdit(id: number) { editingId.value = id; showEdit.value = true }
function onCreated() { showCreate.value = false; load() }
function onEdited() { showEdit.value = false; load() }

async function load() {
  loading.value = true
  try {
    const api = useApi()
    const params: any = { page: page.value, page_size: pageSize }
    if (q.role) params.role = q.role
    if (q.keyword) params.keyword = q.keyword
    if (q.is_active !== null && q.is_active !== undefined) params.is_active = q.is_active
    const d = await api.get('/users', params)
    list.value = d.items
    total.value = d.total
  } finally { loading.value = false }
}

onMounted(load)
</script>

<style scoped>
.filters { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.flex { display: flex; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.mb-md { margin-bottom: 16px; }
.grid-cols-4 { display: grid; }
</style>
