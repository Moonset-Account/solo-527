<template>
  <div>
    <n-space justify="space-between" align="center" style="margin-bottom: 16px">
      <n-space>
        <n-input v-model:value="searchText" placeholder="搜索方案名称或客户" clearable style="width: 240px">
          <template #prefix>
            <n-icon><SearchOutline /></n-icon>
          </template>
        </n-input>
        <n-select v-model:value="styleFilter" :options="styleSelectOptions" placeholder="风格筛选" clearable style="width: 140px" />
        <n-select v-model:value="statusFilter" :options="statusOptions" placeholder="状态筛选" clearable style="width: 140px" />
      </n-space>
      <n-space>
        <n-button :loading="plansStore.loading" @click="loadData">
          <template #icon>
            <n-icon><RefreshOutline /></n-icon>
          </template>
          刷新
        </n-button>
      </n-space>
    </n-space>

    <n-spin :show="plansStore.loading">
      <n-grid :cols="3" :x-gap="16" :y-gap="16">
        <n-gi v-for="plan in displayPlans" :key="plan.id">
          <n-card hoverable style="cursor: pointer; overflow: hidden" @click="goToDetail(plan.id)">
            <div style="position: relative; height: 180px; margin: -16px -16px 0 -16px; overflow: hidden">
              <n-image
                :src="plansStore.getPlanCover(plan)"
                width="100%"
                height="100%"
                object-fit="cover"
                placeholder="loading"
                fallback-src="https://picsum.photos/400/300"
              />
              <n-tag
                v-if="plan.is_demo"
                type="warning"
                size="small"
                style="position: absolute; top: 8px; right: 8px"
              >演示</n-tag>
            </div>
            <div style="padding-top: 12px">
              <n-space justify="space-between" align="center" style="margin-bottom: 8px">
                <n-text strong style="font-size: 16px">{{ plan.name }}</n-text>
                <n-tag :type="statusTagType(plan.status)" size="small">{{ statusLabel(plan.status) }}</n-tag>
              </n-space>
              <n-descriptions :column="2" label-placement="left" size="small" :label-style="{ width: '60px' }">
                <n-descriptions-item label="客户">{{ plan.customer_name || '-' }}</n-descriptions-item>
                <n-descriptions-item label="面积">{{ plan.area }}㎡</n-descriptions-item>
                <n-descriptions-item label="风格">{{ plan.style || '-' }}</n-descriptions-item>
                <n-descriptions-item label="预算">¥{{ formatNumber(plan.estimated_budget) }}</n-descriptions-item>
              </n-descriptions>
            </div>
          </n-card>
        </n-gi>
      </n-grid>
      <n-empty v-if="displayPlans.length === 0 && !plansStore.loading" description="暂无方案数据" style="margin-top: 48px" />
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from '#imports'
import { useMessage } from 'naive-ui'
import { SearchOutline, RefreshOutline } from '@vicons/ionicons5'
import { useAuthStore } from '~/stores/auth'
import { usePlansStore } from '~/stores/plans'
import type { Plan } from '~/types'

definePageMeta({
  layout: 'default',
})

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()
const plansStore = usePlansStore()

const searchText = ref('')
const styleFilter = ref<string | null>(null)
const statusFilter = ref<string | null>(null)

const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '进行中', value: 'active' },
  { label: '已完成', value: 'completed' },
]

const styleSelectOptions = computed(() => {
  return plansStore.styleOptions
})

const displayPlans = computed(() => {
  let list = plansStore.plans
  if (searchText.value) {
    const keyword = searchText.value.toLowerCase()
    list = list.filter(p =>
      p.name.toLowerCase().includes(keyword) ||
      (p.customer_name && p.customer_name.toLowerCase().includes(keyword))
    )
  }
  if (styleFilter.value) {
    list = list.filter(p => p.style === styleFilter.value)
  }
  if (statusFilter.value) {
    list = list.filter(p => p.status === statusFilter.value)
  }
  return list
})

function statusLabel(status: string) {
  const map: Record<string, string> = { draft: '草稿', active: '进行中', completed: '已完成' }
  return map[status] ?? status
}

function statusTagType(status: string) {
  const map: Record<string, string> = { draft: 'default', active: 'info', completed: 'success' }
  return (map[status] ?? 'default') as any
}

function formatNumber(num: number) {
  return num.toLocaleString('zh-CN')
}

function goToDetail(id: number) {
  router.push(`/plans/${id}`)
}

async function loadData() {
  try {
    await plansStore.loadPlans({ page_size: 100 })
  } catch (e: any) {
    message.error(e?.data?.detail || '加载方案列表失败')
  }
}

onMounted(() => {
  authStore.init()
  loadData()
})
</script>
