import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const DRILL_LEVELS = ['overall', 'vehicle', 'route', 'batch', 'box', 'customer']
const DRILL_LABELS = {
  overall: '整体趋势',
  vehicle: '车辆',
  route: '路线',
  batch: '批次',
  box: '保温箱',
  customer: '客户'
}

export function useDrilldown() {
  const router = useRouter()
  const drillPath = ref([{ level: 'overall', id: null, label: '整体趋势' }])

  const currentLevel = computed(() => drillPath.value[drillPath.value.length - 1])

  function drillDown(level, id, label) {
    const existingIdx = drillPath.value.findIndex(p => p.level === level)
    if (existingIdx >= 0) {
      drillPath.value = drillPath.value.slice(0, existingIdx + 1)
      drillPath.value[existingIdx] = { level, id, label: `${DRILL_LABELS[level]} ${label}` }
    } else {
      drillPath.value.push({ level, id, label: `${DRILL_LABELS[level]} ${label}` })
    }
    navigateByLevel(level, id)
  }

  function goBack(index) {
    drillPath.value = drillPath.value.slice(0, index + 1)
    const target = drillPath.value[index]
    navigateByLevel(target.level, target.id)
  }

  function navigateByLevel(level, id) {
    const routes = {
      overall: '/',
      vehicle: `/vehicles/${id}`,
      route: `/routes/${id}`,
      batch: `/batches/${id}`,
      box: `/batches/${id}`,
      customer: `/batches/${id}`
    }
    const path = routes[level] || '/'
    router.push(path)
  }

  function resetDrill() {
    drillPath.value = [{ level: 'overall', id: null, label: '整体趋势' }]
    router.push('/')
  }

  return { drillPath, currentLevel, drillDown, goBack, resetDrill, DRILL_LABELS }
}
