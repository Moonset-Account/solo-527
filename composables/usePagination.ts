import { ref, computed } from 'vue'

interface PageInfo {
  page: number
  pageSize: number
  total: number
}

export function usePagination(defaultPageSize: number = 10) {
  const pageInfo = ref<PageInfo>({
    page: 1,
    pageSize: defaultPageSize,
    total: 0,
  })

  const totalPages = computed(() =>
    Math.ceil(pageInfo.value.total / pageInfo.value.pageSize) || 1
  )

  const setTotal = (total: number) => {
    pageInfo.value.total = total
  }

  const setPage = (page: number) => {
    pageInfo.value.page = page
  }

  const setPageSize = (size: number) => {
    pageInfo.value.pageSize = size
    pageInfo.value.page = 1
  }

  const nextPage = () => {
    if (pageInfo.value.page < totalPages.value) {
      pageInfo.value.page++
    }
  }

  const prevPage = () => {
    if (pageInfo.value.page > 1) {
      pageInfo.value.page--
    }
  }

  const reset = () => {
    pageInfo.value.page = 1
    pageInfo.value.total = 0
  }

  return {
    pageInfo,
    totalPages,
    setTotal,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    reset,
  }
}
