<template>
  <div>
    <n-space justify="space-between" align="center" style="margin-bottom: 16px">
      <n-text strong style="font-size: 16px">巡检模板管理</n-text>
      <n-button type="primary" @click="openAddDialog">新增模板</n-button>
    </n-space>
    <n-data-table :columns="columns" :data="store.inspectionTemplates" :loading="store.loading" :bordered="false" />

    <n-card title="变更日志" size="small" style="margin-top: 16px">
      <n-timeline>
        <n-timeline-item v-for="log in store.changelog" :key="log.id" :title="`${log.action} - ${log.entity_type}`" :time="log.changed_at">
          <n-text depth="3">{{ log.changed_by }} - {{ log.detail || '' }}</n-text>
        </n-timeline-item>
      </n-timeline>
      <n-empty v-if="store.changelog.length === 0" description="暂无变更记录" />
    </n-card>

    <n-modal v-model:show="showModal" preset="dialog" :title="editingId ? '编辑模板' : '新增模板'" positive-text="确认" negative-text="取消" @positive-click="handleSave">
      <n-form :model="formData" label-placement="left" label-width="80">
        <n-form-item label="模板名称">
          <n-input v-model:value="formData.name" placeholder="请输入模板名称" />
        </n-form-item>
        <n-form-item label="检查项目">
          <n-dynamic-input v-model:value="formData.check_items" :on-create="() => ''" />
        </n-form-item>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { useMessage, NTag } from 'naive-ui'
import { useConfigStore } from '~/stores/config'

definePageMeta({
  layout: 'default',
})

const message = useMessage()
const store = useConfigStore()
const showModal = ref(false)
const editingId = ref<number | null>(null)

const formData = reactive({
  name: '',
  check_items: [''] as string[],
})

const columns = [
  { title: '模板名称', key: 'name' },
  {
    title: '检查项目', key: 'check_items',
    render: (row: any) => h('div', {}, (row.check_items || []).map((item: string) => h(NTag, { size: 'small', style: 'margin: 2px' }, { default: () => item }))),
  },
  { title: '更新时间', key: 'updated_at', render: (row: any) => row.updated_at?.slice(0, 10) ?? '' },
]

function openAddDialog() {
  editingId.value = null
  formData.name = ''
  formData.check_items = ['']
  showModal.value = true
}

async function handleSave() {
  if (!formData.name) {
    message.warning('请输入模板名称')
    return
  }
  try {
    await store.createInspectionTemplate(formData)
    message.success('保存成功')
    store.fetchInspectionTemplates()
    store.fetchChangelog({ entity_type: 'inspection_template' })
  } catch (e: any) {
    message.error(e?.data?.detail || '保存失败')
  }
}

onMounted(() => {
  store.fetchInspectionTemplates()
  store.fetchChangelog({ entity_type: 'inspection_template' })
})
</script>
