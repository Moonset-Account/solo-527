export const usePagination = (defaultPageSize: number = 20) => {
  const page = ref(1)
  const pageSize = ref(defaultPageSize)
  const total = ref(0)
  const loading = ref(false)

  const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages.value) {
      page.value = newPage
    }
  }

  const changePageSize = (newSize: number) => {
    pageSize.value = newSize
    page.value = 1
  }

  const setTotal = (newTotal: number) => {
    total.value = newTotal
  }

  const reset = () => {
    page.value = 1
    total.value = 0
  }

  const getParams = () => ({
    page: page.value,
    pageSize: pageSize.value
  })

  return {
    page,
    pageSize,
    total,
    totalPages,
    loading,
    changePage,
    changePageSize,
    setTotal,
    reset,
    getParams
  }
}
