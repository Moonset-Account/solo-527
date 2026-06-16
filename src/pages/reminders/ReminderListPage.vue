<script setup lang="ts">
import { onMounted } from 'vue'
import { CheckCheck } from 'lucide-vue-next'
import { useRemindersStore } from '@/stores/reminders'
import ReminderList from '@/components/reminders/ReminderList.vue'

const remindersStore = useRemindersStore()

onMounted(async () => {
  if (remindersStore.reminders.length === 0) {
    await remindersStore.fetchReminders()
  }
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-gray-800">提醒列表</h1>
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-grayrose hover:text-rosegold transition-colors"
        @click="remindersStore.markAllAsRead()"
      >
        <CheckCheck class="w-4 h-4" />
        全部已读
      </button>
    </div>
    <ReminderList />
  </div>
</template>
