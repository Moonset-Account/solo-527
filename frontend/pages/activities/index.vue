<template>
  <NCard title="社团活动">
    <template #header-extra>
      <NSpace>
        <NInput v-model:value="searchKeyword" placeholder="搜索活动" style="width: 200px" @keyup.enter="fetchActivities" />
        <NButton @click="fetchActivities">搜索</NButton>
      </NSpace>
    </template>

    <NGrid :cols="3" :x-gap="16" :y-gap="16" v-if="activities.length">
      <NGridItem v-for="activity in activities" :key="activity.id">
        <NCard :title="activity.title" size="small" hoverable>
          <NText depth="2">{{ activity.description || '暂无描述' }}</NText>
          <template #footer>
            <NSpace justify="space-between" align="center">
              <NText depth="3" style="font-size: 12px">{{ activity.date || activity.created_at }}</NText>
              <NTag size="small">{{ activity.category || '活动' }}</NTag>
            </NSpace>
          </template>
        </NCard>
      </NGridItem>
    </NGrid>

    <NEmpty v-else description="暂无社团活动" />

    <NSpace justify="center" style="margin-top: 16px" v-if="hasMore">
      <NButton @click="loadMore">加载更多</NButton>
    </NSpace>
  </NCard>
</template>

<script setup lang="ts">
import { NCard, NGrid, NGridItem, NInput, NButton, NSpace, NText, NTag, NEmpty } from 'naive-ui'

const api = useApi()
const activities = ref<any[]>([])
const searchKeyword = ref('')
const currentPage = ref(1)
const hasMore = ref(false)

async function fetchActivities() {
  try {
    const params: Record<string, any> = {
      skip: 0,
      limit: 12
    }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    const res = await api.getClubActivities(params) as any
    activities.value = res.items || []
    hasMore.value = (res.total || 0) > 12
    currentPage.value = 1
  } catch {}
}

async function loadMore() {
  currentPage.value++
  try {
    const params: Record<string, any> = {
      skip: (currentPage.value - 1) * 12,
      limit: 12
    }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    const res = await api.getClubActivities(params) as any
    activities.value.push(...(res.items || []))
    hasMore.value = activities.value.length < (res.total || 0)
  } catch {}
}

onMounted(() => {
  fetchActivities()
})
</script>
