<template>
  <div>
    <StatsCards
      :pending="eventStore.displayStats.pending"
      :rectifying="eventStore.displayStats.rectifying"
      :reviewing="eventStore.stats.reviewing"
      :closed="eventStore.displayStats.closed"
    />
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
      <h2 style="font-size: 18px; font-weight: 600; color: #1a365d; margin: 0">最近事件</h2>
      <div style="display: flex; gap: 12px">
        <NButton type="default" @click="refreshAll">🔄 刷新</NButton>
        <NButton type="primary" @click="showForm = true">
          + 上报事件
        </NButton>
      </div>
    </div>
    <EventTable :events="eventStore.events" />
    <EventForm v-model:show="showForm" @submitted="handleSubmitted" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NButton } from 'naive-ui'
import StatsCards from '~/components/StatsCards.vue'
import EventTable from '~/components/EventTable.vue'
import EventForm from '~/components/EventForm.vue'

const eventStore = useEventStore()
const showForm = ref(false)

const refreshAll = async () => {
  await Promise.all([eventStore.fetchStats(), eventStore.fetchEvents()])
}

onMounted(async () => {
  await refreshAll()
})

const handleSubmitted = async () => {
  showForm.value = false
  await refreshAll()
}
</script>
