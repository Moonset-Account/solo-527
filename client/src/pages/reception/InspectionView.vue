<template>
  <div>
    <PageHeader title="检测项目查看" subtitle="查看各检测模板的详细检测项目" />
    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :md="6">
        <a-card title="检测模板分类" class="template-card">
          <a-input
            v-model:value="searchText"
            placeholder="搜索检测项目"
            class="mb-4"
            allow-clear
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input>
          <a-menu
            v-model:selectedKeys="selectedTemplateId"
            :items="templateMenuItems"
            @click="handleTemplateSelect"
            class="template-menu"
          />
          <Empty v-if="!loading && templates.length === 0" description="暂无检测模板" />
        </a-card>
      </a-col>

      <a-col :xs="24" :md="18">
        <a-card :title="currentTemplateName" class="items-card">
          <a-table
            :columns="itemColumns"
            :data-source="filteredItems"
            :pagination="false"
            :loading="loading"
            row-key="id"
            size="middle"
          />
          <Empty v-if="!loading && selectedTemplate && filteredItems.length === 0" description="该模板暂无检测项目" />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { TableColumnsType, MenuProps } from 'ant-design-vue'
import { SearchOutlined } from '@ant-design/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import Empty from '@/components/Empty.vue'
import { getTemplateList, getTemplateDetail } from '@/api/templates'
import type { InspectionTemplate, InspectionItem } from '@/types'

const loading = ref(false)
const searchText = ref('')
const templates = ref<InspectionTemplate[]>([])
const selectedTemplateId = ref<string[]>([])
const selectedTemplate = ref<InspectionTemplate | null>(null)

const templateMenuItems = computed<MenuProps['items']>(() => {
  return templates.value.map((t) => ({
    key: String(t.id),
    label: t.name,
  }))
})

const currentTemplateName = computed(() => {
  return selectedTemplate.value?.name || '请选择检测模板'
})

const filteredItems = computed<InspectionItem[]>(() => {
  if (!selectedTemplate.value?.items) return []
  const items = selectedTemplate.value.items
  if (!searchText.value) return items
  const keyword = searchText.value.toLowerCase()
  return items.filter((item) => item.name.toLowerCase().includes(keyword))
})

const itemColumns: TableColumnsType = [
  { title: '检测项目', dataIndex: 'name', key: 'name', width: 200 },
  { title: '检测标准', dataIndex: 'standard', key: 'standard' },
  { title: '单位', dataIndex: 'unit', key: 'unit', width: 100 },
  { title: '参考值范围', dataIndex: 'id', key: 'range', width: 150, customRender: () => '详见检测报告' },
]

const fetchTemplates = async () => {
  try {
    loading.value = true
    const data = await getTemplateList({ page: 1, pageSize: 100 })
    templates.value = data.list
    if (data.list.length > 0 && selectedTemplateId.value.length === 0) {
      const defaultTemplate = data.list.find((t) => t.isDefault) || data.list[0]
      selectedTemplateId.value = [String(defaultTemplate.id)]
      await fetchTemplateDetail(defaultTemplate.id)
    }
  } catch (error) {
    console.error('Failed to fetch templates:', error)
  } finally {
    loading.value = false
  }
}

const fetchTemplateDetail = async (id: number) => {
  try {
    loading.value = true
    selectedTemplate.value = await getTemplateDetail(id)
  } catch (error) {
    console.error('Failed to fetch template detail:', error)
  } finally {
    loading.value = false
  }
}

const handleTemplateSelect = async ({ key }: { key: string }) => {
  await fetchTemplateDetail(Number(key))
}

onMounted(() => {
  fetchTemplates()
})
</script>

<style scoped>
.template-card {
  height: 100%;
}

.items-card {
  height: 100%;
}

.template-menu {
  border-right: none;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>
