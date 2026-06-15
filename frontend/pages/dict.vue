<template>
  <div>
    <NGrid :cols="24" :x-gap="16">
      <NGridItem :span="6">
        <NCard title="字典分类" style="min-height: 600px">
          <NMenu
            :value="dictStore.currentCategory"
            :options="categoryMenuOptions"
            @update:value="handleCategorySelect"
          />
          <NButton
            block
            dashed
            style="margin-top: 16px"
            @click="showAddCategory = true"
          >
            + 新增分类
          </NButton>
        </NCard>
      </NGridItem>
      <NGridItem :span="18">
        <NCard :title="currentCategoryName">
          <template #header-extra>
            <NButton type="primary" size="small" @click="showAddItem = true" :disabled="!dictStore.currentCategory">
              + 新增字典值
            </NButton>
          </template>
          <NDataTable
            :columns="itemColumns"
            :data="dictStore.items"
            :loading="dictStore.loading"
            :bordered="false"
            :pagination="false"
          />
        </NCard>
      </NGridItem>
    </NGrid>

    <NModal v-model:show="showAddCategory" preset="dialog" title="新增字典分类" positive-text="确认" negative-text="取消" @positive-click="handleAddCategory">
      <NForm label-placement="left" label-width="60">
        <NFormItem label="编码">
          <NInput v-model:value="newCategory.code" placeholder="如 event_type" />
        </NFormItem>
        <NFormItem label="名称">
          <NInput v-model:value="newCategory.name" placeholder="如 事件类型" />
        </NFormItem>
        <NFormItem label="描述">
          <NInput v-model:value="newCategory.description" placeholder="可选" />
        </NFormItem>
      </NForm>
    </NModal>

    <NModal v-model:show="showAddItem" preset="dialog" title="新增字典值" positive-text="确认" negative-text="取消" @positive-click="handleAddItem">
      <NForm label-placement="left" label-width="60">
        <NFormItem label="编码">
          <NInput v-model:value="newItem.code" placeholder="如 road_damage" />
        </NFormItem>
        <NFormItem label="标签">
          <NInput v-model:value="newItem.label" placeholder="如 道路破损" />
        </NFormItem>
        <NFormItem label="值">
          <NInput v-model:value="newItem.value" placeholder="可选" />
        </NFormItem>
        <NFormItem label="排序">
          <NInputNumber v-model:value="newItem.sort_order" :min="0" style="width: 100%" />
        </NFormItem>
      </NForm>
    </NModal>

    <NModal v-model:show="showEditItem" preset="dialog" title="编辑字典值" positive-text="确认" negative-text="取消" @positive-click="handleEditItem">
      <NForm label-placement="left" label-width="60">
        <NFormItem label="标签">
          <NInput v-model:value="editingItem.label" />
        </NFormItem>
        <NFormItem label="值">
          <NInput v-model:value="editingItem.value" />
        </NFormItem>
        <NFormItem label="排序">
          <NInputNumber v-model:value="editingItem.sort_order" :min="0" style="width: 100%" />
        </NFormItem>
        <NFormItem label="启用">
          <NSwitch v-model:value="editingItem.is_active" />
        </NFormItem>
      </NForm>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { NCard, NGrid, NGridItem, NMenu, NButton, NDataTable, NModal, NForm, NFormItem, NInput, NInputNumber, NSwitch, NTag, useMessage } from 'naive-ui'

const dictStore = useDictStore()
const message = useMessage()

const showAddCategory = ref(false)
const showAddItem = ref(false)
const showEditItem = ref(false)

const newCategory = ref({ code: '', name: '', description: '' })
const newItem = ref({ code: '', label: '', value: '', sort_order: 0 })
const editingItem = ref<any>({})

const categoryMenuOptions = computed(() =>
  dictStore.categories.map((c: any) => ({
    label: c.label || c.name,
    key: c.key || c.code,
  }))
)

const currentCategoryName = computed(() => {
  const cat = dictStore.categories.find((c: any) => (c.key || c.code) === dictStore.currentCategory)
  return cat ? (cat.label || cat.name) : '请选择分类'
})

const itemColumns = [
  { title: '编码', key: 'key', width: 140, render(row: any) { return row.key || row.code } },
  { title: '标签', key: 'label', width: 160 },
  { title: '值', key: 'value', width: 140, render(row: any) { return row.value || '-' } },
  {
    title: '状态', key: 'is_active', width: 80,
    render(row: any) {
      const active = row.is_active !== false
      return h(NTag, { type: active ? 'success' : 'default', size: 'small' }, { default: () => active ? '启用' : '禁用' })
    }
  },
  {
    title: '操作', key: 'actions', width: 140,
    render(row: any) {
      return h('div', { style: 'display: flex; gap: 8px' }, [
        h(NButton, { text: true, type: 'primary', onClick: () => openEditItem(row) }, { default: () => '编辑' }),
        h(NButton, { text: true, type: 'error', onClick: () => handleDeleteItem(row) }, { default: () => '删除' }),
      ])
    }
  },
]

onMounted(async () => {
  await dictStore.fetchCategories()
  if (dictStore.categories.length) {
    const first = dictStore.categories[0]
    await dictStore.fetchItems(first.key || first.code)
  }
})

const handleCategorySelect = (key: string) => {
  dictStore.fetchItems(key)
}

const handleAddCategory = async () => {
  if (!newCategory.value.code || !newCategory.value.name) {
    message.warning('编码和名称不能为空')
    return false
  }
  await dictStore.addItem(newCategory.value.code, newCategory.value)
  newCategory.value = { code: '', name: '', description: '' }
  message.success('分类已添加')
  await dictStore.fetchCategories()
  return true
}

const handleAddItem = async () => {
  if (!newItem.value.code || !newItem.value.label) {
    message.warning('编码和标签不能为空')
    return false
  }
  if (!dictStore.currentCategory) return false
  await dictStore.addItem(dictStore.currentCategory, newItem.value)
  newItem.value = { code: '', label: '', value: '', sort_order: 0 }
  message.success('字典值已添加')
  return true
}

const openEditItem = (row: any) => {
  editingItem.value = { ...row }
  showEditItem.value = true
}

const handleEditItem = async () => {
  if (!dictStore.currentCategory) return false
  await dictStore.addItem(dictStore.currentCategory, editingItem.value)
  message.success('字典值已更新')
  return true
}

const handleDeleteItem = async (row: any) => {
  if (!dictStore.currentCategory) return
  await dictStore.deleteItem(dictStore.currentCategory, row.key || row.code)
  message.success('字典值已删除')
}
</script>
