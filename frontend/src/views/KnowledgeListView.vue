<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="font-charter text-2xl font-bold text-deep-blue-900">知识库管理</h1>
        <p class="mt-1 text-sm text-slate-500">维护合规政策、产品介绍、话术文档等知识条目</p>
      </div>
      <NButton type="primary" size="medium" @click="openDrawer()">
        <NIcon :size="16" class="mr-1.5"><PlusOutlined /></NIcon>
        新增条目
      </NButton>
    </div>

    <NCard class="!rounded-2xl shadow-sm" size="large">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
        <NInput v-model:value="searchKeyword" placeholder="搜索标题、标签或内容..." clearable>
          <template #prefix><NIcon><SearchOutlined /></NIcon></template>
        </NInput>
        <NSelect v-model:value="filterCategory" :options="categoryOptions" placeholder="分类筛选" clearable />
        <NSelect v-model:value="filterStatus" :options="statusOptions" placeholder="状态筛选" clearable />
        <div class="flex items-center space-x-2">
          <NButton quaternary @click="resetFilters">
            <NIcon :size="14" class="mr-1"><ReloadOutlined /></NIcon>
            重置
          </NButton>
        </div>
      </div>

      <NDataTable
        :columns="columns"
        :data="filteredData"
        :pagination="pagination"
        @update:page="(p) => pagination.page = p"
        @update:page-size="(s) => pagination.pageSize = s"
        :row-key="(row) => row.id"
        striped
        size="medium"
      />
    </NCard>

    <NDrawer
      v-model:show="drawerVisible"
      :width="560"
      placement="right"
      :title="editingItem ? '编辑知识条目' : '新增知识条目'"
      :show-icon="false"
    >
      <NForm :model="form" label-placement="top" size="large">
        <NFormItem label="标题" required>
          <NInput v-model:value="form.title" placeholder="请输入标题" maxlength="100" show-count />
        </NFormItem>
        <div class="grid grid-cols-2 gap-4">
          <NFormItem label="分类" required>
            <NSelect v-model:value="form.category" :options="categoryOptions" placeholder="请选择" />
          </NFormItem>
          <NFormItem label="状态">
            <NSelect v-model:value="form.status" :options="statusOptions" defaultValue="draft" />
          </NFormItem>
        </div>
        <NFormItem label="标签">
          <NDynamicTags v-model:value="form.tags" :max="10" placeholder="输入后按回车添加标签" />
        </NFormItem>
        <NFormItem label="知识内容" required>
          <NInput
            v-model:value="form.content"
            type="textarea"
            :autosize="{ minRows: 8, maxRows: 16 }"
            placeholder="请输入详细内容，支持纯文本..."
          />
        </NFormItem>
        <div class="grid grid-cols-2 gap-4">
          <NFormItem label="来源名称">
            <NInput v-model:value="form.sourceName" placeholder="例如：公司制度文件第12号" />
          </NFormItem>
          <NFormItem label="来源链接">
            <NInput v-model:value="form.sourceLink" placeholder="https://..." />
          </NFormItem>
        </div>
      </NForm>
      <template #footer>
        <div class="flex justify-end space-x-2">
          <NButton @click="drawerVisible = false">取消</NButton>
          <NButton type="primary" @click="saveItem">
            {{ editingItem ? '保存修改' : '创建条目' }}
          </NButton>
        </div>
      </template>
    </NDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h } from 'vue'
import {
  NCard, NButton, NIcon, NInput, NSelect, NDataTable, NDrawer, NForm, NFormItem,
  NDynamicTags, NPopconfirm, NSwitch, NTag, useMessage,
  type DataTableColumns, type SelectOption
} from 'naive-ui'
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined
} from '@vicons/antd'
import StatusTag from '@/components/business/StatusTag.vue'
import { usePageTitle } from '@/composables/usePageTitle'
import { mockKnowledge } from '@/mock/data'
import type { KnowledgeBase, KnowledgeCategory } from '@/types'

usePageTitle('知识库管理')

const message = useMessage()

const searchKeyword = ref('')
const filterCategory = ref<string | null>(null)
const filterStatus = ref<string | null>(null)

const categoryOptions: SelectOption[] = [
  { label: '合规政策', value: 'policy' },
  { label: '产品介绍', value: 'product' },
  { label: '合规审核', value: 'compliance' },
  { label: '流程规范', value: 'procedure' },
  { label: '常见问答', value: 'faq' }
]

const statusOptions: SelectOption[] = [
  { label: '启用中', value: 'active' },
  { label: '草稿', value: 'draft' },
  { label: '已归档', value: 'archived' }
]

const categoryText = (v: KnowledgeCategory): string => {
  const opt = categoryOptions.find(o => o.value === v)
  return opt ? (String(opt.label ?? '')) : v
}

const allData = ref<KnowledgeBase[]>([...mockKnowledge])

const filteredData = computed(() => {
  return allData.value.filter(item => {
    if (filterCategory.value && item.category !== filterCategory.value) return false
    if (filterStatus.value && item.status !== filterStatus.value) return false
    if (searchKeyword.value) {
      const k = searchKeyword.value.toLowerCase()
      return (
        item.title.toLowerCase().includes(k) ||
        item.tags.some(t => t.toLowerCase().includes(k)) ||
        item.content.toLowerCase().includes(k)
      )
    }
    return true
  })
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  itemCount: computed(() => filteredData.value.length)
})

const columns: DataTableColumns<KnowledgeBase> = [
  { title: '标题', key: 'title', width: 240, ellipsis: { tooltip: true }, render: (row) => h('span', { class: 'font-medium text-slate-800' }, row.title) },
  { title: '分类', key: 'category', width: 100, render: (row) => h('span', { class: 'text-sm text-slate-600' }, categoryText(row.category)) },
  {
    title: '标签',
    key: 'tags',
    minWidth: 200,
    render: (row) => h('div', { class: 'flex flex-wrap gap-1 max-w-[320px]' },
      row.tags.slice(0, 4).map(t => h(NTag, { key: t, size: 'tiny', round: true, type: 'info', bordered: false }, { default: () => t })).concat(
        row.tags.length > 4 ? [h(NTag, { key: 'more', size: 'tiny', round: true, type: 'default', bordered: false }, { default: () => `+${row.tags.length - 4}` })] : []
      )
    )
  },
  { title: '状态', key: 'status', width: 100, render: (row) => h(StatusTag, { status: row.status, type: 'knowledge', size: 'small' }) },
  { title: '版本', key: 'version', width: 80, render: (row) => h(NTag, { size: 'tiny', type: 'success', round: true, bordered: false }, { default: () => `v${row.version}` }) },
  { title: '创建人', key: 'createdBy', width: 110, render: (row) => h('span', { class: 'text-sm text-slate-600' }, getCreatorName(row.createdBy)) },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 160,
    render: (row) => h('span', { class: 'text-sm text-slate-500' }, formatDate(row.createdAt))
  },
  {
    title: '启用',
    key: 'active',
    width: 70,
    render: (row) => h(NSwitch, {
      value: row.status === 'active',
      disabled: row.status === 'archived',
      onUpdateValue: (v: boolean) => toggleStatus(row, v)
    })
  },
  {
    title: '操作',
    key: 'actions',
    width: 170,
    fixed: 'right',
    render: (row) => h('div', { class: 'flex items-center space-x-1' }, [
      h(NButton, { size: 'small', text: true, type: 'primary', onClick: () => openDrawer(row) }, {
        default: () => [h(NIcon, { size: 14 }, { default: () => h(EditOutlined) }), ' 编辑']
      }),
      h(NPopconfirm, {
        trigger: 'click',
        positiveText: '确认删除',
        negativeText: '取消',
        onPositiveClick: () => deleteItem(row)
      }, {
        default: () => '确认删除「' + row.title + '」？删除后不可恢复。',
        trigger: () => h(NButton, { size: 'small', text: true, type: 'error' }, {
          default: () => [h(NIcon, { size: 14 }, { default: () => h(DeleteOutlined) }), ' 删除']
        })
      })
    ])
  }
]

const creatorMap: Record<string, string> = {
  'user_001': '系统管理员',
  'user_002': '张复核',
  'user_003': '李运营'
}
function getCreatorName(id: string) { return creatorMap[id] || id }

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toggleStatus(row: KnowledgeBase, active: boolean) {
  row.status = active ? 'active' : 'draft'
  message.success(`已${active ? '启用' : '停用'}「${row.title}」`)
}

function deleteItem(row: KnowledgeBase) {
  allData.value = allData.value.filter(i => i.id !== row.id)
  message.success('删除成功')
}

const drawerVisible = ref(false)
const editingItem = ref<KnowledgeBase | null>(null)

const form = reactive({
  title: '',
  category: 'policy' as KnowledgeCategory,
  tags: [] as string[],
  content: '',
  status: 'draft' as 'active' | 'draft' | 'archived',
  sourceName: '',
  sourceLink: ''
})

function resetForm() {
  form.title = ''
  form.category = 'policy'
  form.tags = []
  form.content = ''
  form.status = 'draft'
  form.sourceName = ''
  form.sourceLink = ''
}

function openDrawer(item?: KnowledgeBase) {
  resetForm()
  editingItem.value = item || null
  if (item) {
    form.title = item.title
    form.category = item.category
    form.tags = [...item.tags]
    form.content = item.content
    form.status = item.status
  }
  drawerVisible.value = true
}

function saveItem() {
  if (!form.title.trim()) { message.error('请输入标题'); return }
  if (!form.content.trim()) { message.error('请输入内容'); return }
  if (editingItem.value) {
    const idx = allData.value.findIndex(i => i.id === editingItem.value!.id)
    if (idx >= 0) {
      allData.value[idx] = {
        ...allData.value[idx],
        title: form.title,
        category: form.category,
        tags: [...form.tags],
        content: form.content,
        status: form.status,
        updatedAt: new Date().toISOString()
      }
    }
    message.success('修改已保存')
  } else {
    const newItem: KnowledgeBase = {
      id: 'kb_new_' + Date.now(),
      title: form.title,
      category: form.category,
      tags: [...form.tags],
      content: form.content,
      version: '1.0.0',
      status: form.status,
      createdBy: 'user_001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    allData.value.unshift(newItem)
    message.success('条目已创建')
  }
  drawerVisible.value = false
}

function resetFilters() {
  searchKeyword.value = ''
  filterCategory.value = null
  filterStatus.value = null
  pagination.page = 1
}
</script>
