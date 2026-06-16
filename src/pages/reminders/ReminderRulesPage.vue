<script setup lang="ts">
import { onMounted } from 'vue'
import { useRemindersStore } from '@/stores/reminders'
import ReminderRuleForm from '@/components/reminders/ReminderRuleForm.vue'

const remindersStore = useRemindersStore()

onMounted(async () => {
  if (remindersStore.rules.length === 0) {
    await remindersStore.fetchRules()
  }
})
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl font-semibold text-gray-800">规则配置</h1>
    <ReminderRuleForm />
  </div>
</template>
