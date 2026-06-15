import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getTodoStats } from '../api/stats'

export const useTodoStore = defineStore('todo', () => {
  const topicStats = ref({})
  const scriptStats = ref({})
  const abnormalStats = ref({})

  async function fetchTodoStats() {
    try {
      const res = await getTodoStats()
      if (res.data) {
        topicStats.value = res.data.topic || {}
        scriptStats.value = res.data.script || {}
        abnormalStats.value = res.data.abnormal || {}
      }
    } catch (e) {
      console.error('获取待办统计失败', e)
    }
  }

  return {
    topicStats,
    scriptStats,
    abnormalStats,
    fetchTodoStats
  }
})
