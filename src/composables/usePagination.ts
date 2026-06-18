import { ref, computed } from 'vue'

export function usePagination(defaultPageSize = 20) {
  const page = ref(1)
  const pageSize = ref(defaultPageSize)
  const total = ref(0)

  const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

  const hasNext = computed(() => page.value < totalPages.value)
  const hasPrev = computed(() => page.value > 1)

  function goToPage(p: number) {
    page.value = Math.max(1, Math.min(p, totalPages.value))
  }

  function nextPage() {
    if (hasNext.value) page.value++
  }

  function prevPage() {
    if (hasPrev.value) page.value--
  }

  function setTotal(t: number) {
    total.value = t
  }

  function setPageSize(size: number) {
    pageSize.value = size
    page.value = 1
  }

  function reset() {
    page.value = 1
    total.value = 0
  }

  return {
    page, pageSize, total, totalPages, hasNext, hasPrev,
    goToPage, nextPage, prevPage, setTotal, setPageSize, reset,
  }
}
