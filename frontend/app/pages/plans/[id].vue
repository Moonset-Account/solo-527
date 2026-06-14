<template>
  <div>
    <n-page-header @back="router.back()" title="方案详情" style="margin-bottom: 16px">
      <template #extra>
        <n-space>
          <n-tag v-if="plan?.is_demo" type="warning" size="small">演示数据</n-tag>
          <n-tag :type="statusTagType(plan?.status)" size="small">{{ statusLabel(plan?.status) }}</n-tag>
        </n-space>
      </template>
    </n-page-header>

    <n-spin :show="plansStore.loading">
      <div v-if="plan">
        <n-card style="margin-bottom: 16px; padding: 0">
          <n-carousel :show-dots="true" dot-type="line" autoplay :interval="4000" style="height: 400px">
            <div v-for="(img, idx) in coverImages" :key="idx" style="height: 100%; width: 100%">
              <n-image :src="img" width="100%" height="100%" object-fit="cover" placeholder="loading" />
            </div>
          </n-carousel>
        </n-card>

        <n-card title="基本信息" size="small" style="margin-bottom: 16px">
          <n-descriptions :column="3" label-placement="left" bordered>
            <n-descriptions-item label="方案名称">{{ plan.name }}</n-descriptions-item>
            <n-descriptions-item label="客户">{{ plan.customer_name || '-' }}</n-descriptions-item>
            <n-descriptions-item label="面积">{{ plan.area }}㎡</n-descriptions-item>
            <n-descriptions-item label="装修风格">{{ plan.style || '-' }}</n-descriptions-item>
            <n-descriptions-item label="预算金额">
              <n-text strong style="color: #E8A838; font-size: 18px">¥{{ formatNumber(plan.estimated_budget) }}</n-text>
            </n-descriptions-item>
            <n-descriptions-item label="创建时间">{{ plan.created_at?.slice(0, 10) }}</n-descriptions-item>
          </n-descriptions>
        </n-card>

        <n-tabs v-model:value="activeTab" type="line" size="large" style="margin-bottom: 16px">
          <n-tab-pane name="description" tab="设计说明">
            <n-card size="small">
              <n-text style="white-space: pre-wrap; line-height: 1.8">
                {{ plan.design_description || defaultDescription }}
              </n-text>
            </n-card>
          </n-tab-pane>

          <n-tab-pane name="materials" tab="材料清单">
            <n-card size="small">
              <n-data-table
                :columns="materialColumns"
                :data="materials"
                :bordered="false"
                size="small"
                :pagination="{ pageSize: 10 }"
              />
              <n-space justify="end" style="margin-top: 16px">
                <n-text strong>材料总价: ¥{{ formatNumber(materialTotal) }}</n-text>
              </n-space>
            </n-card>
          </n-tab-pane>

          <n-tab-pane name="construction" tab="施工节点">
            <n-card size="small">
              <n-steps :current="2" vertical>
                <n-step
                  v-for="(node, idx) in constructionNodes"
                  :key="idx"
                  :title="node.name"
                  :description="`${node.description} | 预计 ${node.duration} 天`"
                />
              </n-steps>
              <n-space justify="end" style="margin-top: 16px">
                <n-text strong>总工期: {{ totalDuration }} 天</n-text>
              </n-space>
            </n-card>
          </n-tab-pane>

          <n-tab-pane name="renderings" tab="3D效果图">
            <n-card size="small">
              <n-grid :cols="3" :x-gap="12" :y-gap="12">
                <n-gi v-for="(img, idx) in renderings3D" :key="idx">
                  <n-image
                    :src="img"
                    width="100%"
                    height="200px"
                    object-fit="cover"
                    placeholder="loading"
                    style="border-radius: 4px"
                  />
                </n-gi>
              </n-grid>
            </n-card>
          </n-tab-pane>
        </n-tabs>
      </div>
      <n-empty v-else-if="!plansStore.loading" description="方案不存在" />
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from '#imports'
import { useMessage } from 'naive-ui'
import { useAuthStore } from '~/stores/auth'
import { usePlansStore } from '~/stores/plans'
import type { Plan, MaterialItem } from '~/types'

definePageMeta({
  layout: 'default',
})

const router = useRouter()
const route = useRoute()
const message = useMessage()
const authStore = useAuthStore()
const plansStore = usePlansStore()

const activeTab = ref('description')

const plan = computed(() => plansStore.currentPlan)

const coverImages = computed(() => {
  if (!plan.value) return []
  return plansStore.getPlanImages(plan.value)
})

const materials = computed<MaterialItem[]>(() => {
  if (!plan.value) return []
  return plansStore.getMaterials(plan.value)
})

const materialTotal = computed(() => {
  return materials.value.reduce((sum, m) => sum + (m.price || 0) * (m.quantity || 0), 0)
})

const constructionNodes = computed(() => {
  if (!plan.value) return []
  return plansStore.getConstructionNodes(plan.value)
})

const totalDuration = computed(() => {
  return constructionNodes.value.reduce((sum, n) => sum + (n.duration || 0), 0)
})

const renderings3D = computed(() => {
  if (!plan.value) return []
  return plansStore.get3DImages(plan.value)
})

const defaultDescription = `本方案为现代简约风格设计，整体以白色为主调，搭配原木色家具，营造温馨舒适的居家氛围。

设计亮点：
1. 开放式客餐厅设计，增强空间通透感
2. 入户玄关增加收纳功能
3. 主卧采用套间设计，配备独立衣帽间
4. 厨房采用U型布局，操作动线流畅
5. 全屋智能家居系统，提升生活品质

色彩搭配：
- 主色调：象牙白、米灰色
- 点缀色：原木色、雾霾蓝
- 软装：浅灰色沙发、原木茶几、抽象装饰画

材料选择注重环保与品质，所有板材均达到E0级环保标准，为您和家人的健康保驾护航。`

const materialColumns = [
  { title: '序号', key: 'index', width: 60, render: (_: any, index: number) => index + 1 },
  { title: '材料名称', key: 'name', width: 120 },
  { title: '品牌', key: 'brand', width: 100 },
  { title: '型号', key: 'model', width: 120 },
  { title: '数量', key: 'quantity', width: 80, render: (row: MaterialItem) => `${row.quantity} ${row.unit || ''}` },
  { title: '单价', key: 'price', width: 100, render: (row: MaterialItem) => `¥${formatNumber(row.price || 0)}` },
  { title: '小计', key: 'total', width: 120, render: (row: MaterialItem) => `¥${formatNumber((row.price || 0) * (row.quantity || 0))}` },
]

function statusLabel(status?: string) {
  const map: Record<string, string> = { draft: '草稿', active: '进行中', completed: '已完成' }
  return map[status ?? ''] ?? status ?? ''
}

function statusTagType(status?: string) {
  const map: Record<string, string> = { draft: 'default', active: 'info', completed: 'success' }
  return (map[status ?? ''] ?? 'default') as any
}

function formatNumber(num: number) {
  return num.toLocaleString('zh-CN')
}

async function loadData() {
  const id = Number(route.params.id)
  if (!id) {
    message.error('无效的方案ID')
    router.back()
    return
  }
  try {
    await plansStore.loadPlan(id)
  } catch (e: any) {
    message.error(e?.data?.detail || '加载方案详情失败')
  }
}

onMounted(() => {
  authStore.init()
  loadData()
})

onBeforeUnmount(() => {
  plansStore.clearCurrent()
})
</script>
