<template>
  <MainLayout>
    <div class="admin-dict-page">
      <n-card :bordered="false">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <n-button type="primary" @click="handleCreateDict">新增字典</n-button>
          </div>
          <div class="toolbar-right">
            <n-button @click="loadData">刷新</n-button>
          </div>
        </div>

        <n-spin :show="loading">
          <n-data-table
            :columns="columns"
            :data="tableData"
            :pagination="pagination"
            :bordered="false"
            @update:page="handlePageChange"
            @update:page-size="handlePageSizeChange"
          />
        </n-spin>
      </n-card>

      <n-modal
        v-model:show="showDictModal"
        preset="card"
        :title="isEditDict ? '编辑字典' : '新增字典'"
        style="width: 500px"
      >
        <n-form :model="dictForm" label-placement="left" label-width="100px">
          <n-form-item label="字典名称">
            <n-input v-model:value="dictForm.name" />
          </n-form-item>
          <n-form-item label="字典编码">
            <n-input v-model:value="dictForm.code" :disabled="isEditDict" />
          </n-form-item>
          <n-form-item label="描述">
            <n-input v-model:value="dictForm.description" type="textarea" :rows="2" />
          </n-form-item>
          <n-form-item label="启用">
            <n-switch v-model:value="dictForm.is_active" />
          </n-form-item>
        </n-form>
        <template #footer>
          <n-space justify="end">
            <n-button @click="showDictModal = false">取消</n-button>
            <n-button type="primary" :loading="submitting" @click="handleSubmitDict">确定</n-button>
          </n-space>
        </template>
      </n-modal>

      <n-modal
        v-model:show="showItemsModal"
        preset="card"
        :title="`字典项管理 - ${currentDictName}`"
        style="width: 700px"
      >
        <div class="items-toolbar">
          <n-button size="small" type="primary" @click="handleAddItem">新增项</n-button>
        </div>
        <n-data-table
          :columns="itemColumns"
          :data="dictItems"
          :bordered="false"
          :pagination="false"
          size="small"
        />
        <template #footer>
          <n-space justify="end">
            <n-button @click="showItemsModal = false">关闭</n-button>
          </n-space>
        </template>
      </n-modal>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import MainLayout from '~/components/layout/MainLayout.vue'
import { getDictionaryList, createDictionary, updateDictionary, deleteDictionary, getDictionaryItems, addDictionaryItem, updateDictionaryItem, deleteDictionaryItem } from '~/api/system'
import type { Dictionary, DictionaryItem } from '~/types'
import { useMessageUtil, useDialogUtil } from '~/composables/useMessage'
import { useDictStore } from '~/stores/dict'

const { success, error } = useMessageUtil()
const { confirm } = useDialogUtil()
const dictStore = useDictStore()

const loading = ref(false)
const tableData = ref<Dictionary[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  showSizePicker: false,
})

const showDictModal = ref(false)
const isEditDict = ref(false)
const submitting = ref(false)
const editingDictId = ref<number | null>(null)

const dictForm = reactive({
  name: '',
  code: '',
  description: '',
  is_active: true,
})

const showItemsModal = ref(false)
const currentDictId = ref<number | null>(null)
const currentDictName = ref('')
const dictItems = ref<DictionaryItem[]>([])

const columns: DataTableColumns<Dictionary> = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '字典名称', key: 'name', width: 150 },
  { title: '字典编码', key: 'code', width: 150 },
  { title: '描述', key: 'description', width: 200, ellipsis: true },
  { title: '版本', key: 'version', width: 80 },
  {
    title: '状态',
    key: 'is_active',
    width: 100,
    render: (row) => h('n-tag', { type: row.is_active ? 'success' : 'default' }, () => row.is_active ? '启用' : '禁用'),
  },
  { title: '更新时间', key: 'updated_at', width: 170 },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: (row) => h('n-space', null, () => [
      h('n-button', { size: 'small', onClick: () => viewItems(row) }, () => '字典项'),
      h('n-button', { size: 'small', onClick: () => handleEditDict(row) }, () => '编辑'),
      h('n-button', { size: 'small', type: 'error', onClick: () => handleDeleteDict(row.id) }, () => '删除'),
    ]),
  },
]

const itemColumns: DataTableColumns = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '标签', key: 'label', width: 120 },
  { title: '值', key: 'value', width: 120 },
  { title: '排序', key: 'sort_order', width: 80 },
  {
    title: '状态',
    key: 'is_active',
    width: 100,
    render: (row: any) => h('n-tag', { type: row.is_active ? 'success' : 'default' }, () => row.is_active ? '启用' : '禁用'),
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (row: any) => h('n-space', null, () => [
      h('n-button', { size: 'small', onClick: () => editItem(row) }, () => '编辑'),
      h('n-button', { size: 'small', type: 'error', onClick: () => deleteItem(row.id) }, () => '删除'),
    ]),
  },
]

async function loadData() {
  loading.value = true
  try {
    const res = await getDictionaryList({ page: pagination.page, page_size: pagination.pageSize })
    if (res.code === 200) {
      tableData.value = res.data.items
      pagination.total = res.data.total
    }
  } catch (e: any) {
    error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function handlePageChange(page: number) {
  pagination.page = page
  loadData()
}

function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize
  pagination.page = 1
  loadData()
}

function handleCreateDict() {
  isEditDict.value = false
  editingDictId.value = null
  Object.assign(dictForm, {
    name: '',
    code: '',
    description: '',
    is_active: true,
  })
  showDictModal.value = true
}

function handleEditDict(row: Dictionary) {
  isEditDict.value = true
  editingDictId.value = row.id
  Object.assign(dictForm, {
    name: row.name,
    code: row.code,
    description: row.description,
    is_active: row.is_active,
  })
  showDictModal.value = true
}

async function handleSubmitDict() {
  if (!dictForm.name || !dictForm.code) {
    error('请填写完整信息')
    return
  }
  submitting.value = true
  try {
    if (isEditDict.value && editingDictId.value) {
      await updateDictionary(editingDictId.value, dictForm)
      success('更新成功')
    } else {
      await createDictionary(dictForm)
      success('创建成功')
    }
    showDictModal.value = false
    loadData()
    dictStore.loadAllDictionaries()
  } catch (e: any) {
    error(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

function handleDeleteDict(id: number) {
  confirm('确认删除', '确定要删除这个字典吗？', async () => {
    try {
      await deleteDictionary(id)
      success('删除成功')
      loadData()
      dictStore.loadAllDictionaries()
    } catch (e: any) {
      error(e.message || '删除失败')
    }
  })
}

async function viewItems(row: Dictionary) {
  currentDictId.value = row.id
  currentDictName.value = row.name
  showItemsModal.value = true
  await loadDictItems(row.code)
}

async function loadDictItems(code: string) {
  try {
    const res = await getDictionaryItems(code)
    if (res.code === 200) {
      dictItems.value = res.data
    }
  } catch (e) {
    console.error('加载字典项失败', e)
  }
}

function handleAddItem() {
  // 简化处理：实际应该有弹窗
  success('新增字典项功能')
}

function editItem(row: any) {
  success('编辑字典项功能')
}

function deleteItem(id: number) {
  confirm('确认删除', '确定要删除这个字典项吗？', async () => {
    try {
      await deleteDictionaryItem(id)
      success('删除成功')
      if (currentDictId.value) {
        // 重新加载
      }
    } catch (e: any) {
      error(e.message || '删除失败')
    }
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.admin-dict-page {
  padding: 0;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.items-toolbar {
  margin-bottom: 12px;
}
</style>
