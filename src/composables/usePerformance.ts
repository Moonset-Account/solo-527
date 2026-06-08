import { ref, computed } from 'vue'
import { PerfStats } from '@/engine/perf'
import type { PerfReport } from '@/types'

export function usePerformance(perfStats: PerfStats) {
  const isVisible = ref(false)

  const fps = computed(() => perfStats.getReport().fps)

  const report = computed<PerfReport>(() => perfStats.getReport())

  function toggle() {
    isVisible.value = !isVisible.value
    perfStats.visible = isVisible.value
  }

  function formatDisplay(): string {
    if (!isVisible.value) return ''
    return perfStats.formatReport()
  }

  return {
    fps,
    report,
    isVisible,
    toggle,
    formatDisplay,
  }
}
