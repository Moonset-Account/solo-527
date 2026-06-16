import type { FilterParams } from '~/types'

export const useFilters = () => {
  const dateFrom = ref<string | null>(null)
  const dateTo = ref<string | null>(null)
  const responsiblePerson = ref<string | null>(null)
  const status = ref<string | null>(null)
  const page = ref(1)
  const pageSize = ref(20)

  const filters = computed<Partial<FilterParams>>(() => ({
    date_from: dateFrom.value,
    date_to: dateTo.value,
    responsible_person: responsiblePerson.value,
    status: status.value,
    page: page.value,
    page_size: pageSize.value,
  }))

  function resetFilters() {
    dateFrom.value = null
    dateTo.value = null
    responsiblePerson.value = null
    status.value = null
    page.value = 1
    pageSize.value = 20
  }

  function setPage(newPage: number) {
    page.value = newPage
  }

  function setPageSize(newSize: number) {
    pageSize.value = newSize
    page.value = 1
  }

  return {
    dateFrom,
    dateTo,
    responsiblePerson,
    status,
    page,
    pageSize,
    filters,
    resetFilters,
    setPage,
    setPageSize,
  }
}
