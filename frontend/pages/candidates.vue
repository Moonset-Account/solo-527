<template>
  <n-card :bordered="false">
    <template #header>
      <div class="header">
        <span>候选人管理</span>
        <n-input
          v-model:value="keyword"
          placeholder="搜索姓名/学校"
          clearable
          style="width: 240px"
          @keyup.enter="loadCandidates"
        >
          <template #prefix>
            <n-icon><SearchOutlined /></n-icon>
          </template>
        </n-input>
      </div>
    </template>

    <n-data-table
      :columns="columns"
      :data="candidates"
      :loading="loading"
      :row-key="(row: any) => row.id"
    />

    <n-pagination
      v-model:page="page"
      v-model:page-size="pageSize"
      :item-count="total"
      show-size-picker
      style="margin-top: 16px; justify-content: flex-end"
      @update:page="loadCandidates"
      @update:page-size="loadCandidates"
    />
  </n-card>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { SearchOutlined } from '@vicons/antd'
import { useMessage } from 'naive-ui'
import api from '~/utils/api'
import { formatDate } from '~/utils/dict'
import type { Candidate } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const message = useMessage()

const candidates = ref<Candidate[]>([])
const loading = ref(false)
const keyword = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '姓名', key: 'name' },
  { title: '邮箱', key: 'email' },
  { title: '手机号', key: 'phone' },
  { title: '学校', key: 'university' },
  { title: '专业', key: 'major' },
  { title: '学历', key: 'degree' },
  { title: '毕业年份', key: 'graduation_year' },
  { title: '来源渠道', key: 'source_channel' },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render(row: any) {
      return h('n-button', { size: 'small', quaternary: true, onClick: () => viewDetail(row.id) }, () => '详情')
    },
  },
]

async function loadCandidates() {
  loading.value = true
  try {
    const res = await api.get('/candidates', {
      params: {
        keyword: keyword.value || undefined,
        skip: (page.value - 1) * pageSize.value,
        limit: pageSize.value,
      },
    })
    candidates.value = res.data
  } catch (e) {
    message.error('加载失败')
  } finally {
    loading.value = false
  }
}

function viewDetail(id: number) {
  message.info('详情功能开发中')
}

onMounted(() => {
  loadCandidates()
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
