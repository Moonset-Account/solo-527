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
          <NSpace vertical style="margin-top: 8px">
            <NText v-if="activity.organizer" depth="3" style="font-size: 12px">
              主办方：{{ activity.organizer }}
            </NText>
            <NText v-if="activity.location" depth="3" style="font-size: 12px">
              地点：{{ activity.location }}
            </NText>
          </NSpace>
          <template #footer>
            <NSpace justify="space-between" align="center">
              <NText depth="3" style="font-size: 12px">{{ activity.created_at }}</NText>
              <NTag size="small">{{ activity.status || '活动' }}</NTag>
            </NSpace>
          </template>
        </NCard>
      </NGridItem>
    </NGrid>

    <NEmpty v-else description="暂无社团活动" />
  </NCard>
</template>

<script setup lang="ts">
import { NCard, NGrid, NGridItem, NInput, NButton, NSpace, NText, NTag, NEmpty } from 'naive-ui'

const api = useApi()
const activities = ref<any[]>([])
const searchKeyword = ref('')

async function fetchActivities() {
  try {
    const params: Record<string, any> = {
      limit: 50
    }
    const res = await api.getActivities(params) as any
    let list = Array.isArray(res) ? res : (res.items || [])
    if (searchKeyword.value) {
      const kw = searchKeyword.value.toLowerCase()
      list = list.filter((a: any) =>
        (a.title || '').toLowerCase().includes(kw) ||
        (a.description || '').toLowerCase().includes(kw) ||
        (a.organizer || '').toLowerCase().includes(kw)
      )
    }
    activities.value = list
  } catch (e) {
    activities.value = []
  }
}

onMounted(() => {
  fetchActivities()
})
</script>
