import { ref } from 'vue'

interface ApiErrorData {
  message: string
  contactPerson?: string
  recordReference?: string
  [key: string]: unknown
}

export function useApiError() {
  const errorVisible = ref(false)
  const errorMessage = ref('')
  const errorContact = ref('')
  const errorRecordRef = ref('')

  function parseError(error: unknown): ApiErrorData | null {
    if (error && typeof error === 'object' && 'data' in error) {
      const errData = (error as any).data
      if (errData && typeof errData === 'object') {
        return errData as ApiErrorData
      }
    }
    const msg = error instanceof Error ? error.message : String(error)
    return { message: msg }
  }

  function showError(error: unknown, fallbackMessage: string = '操作失败') {
    const err = parseError(error)
    errorMessage.value = err?.message || fallbackMessage
    errorContact.value = err?.contactPerson || ''
    errorRecordRef.value = err?.recordReference || ''
    errorVisible.value = true
  }

  function hideError() {
    errorVisible.value = false
    errorMessage.value = ''
    errorContact.value = ''
    errorRecordRef.value = ''
  }

  async function withError<T>(
    fn: () => Promise<T>,
    fallbackMessage: string = '操作失败'
  ): Promise<T | null> {
    try {
      hideError()
      return await fn()
    } catch (error) {
      showError(error, fallbackMessage)
      return null
    }
  }

  return {
    errorVisible,
    errorMessage,
    errorContact,
    errorRecordRef,
    showError,
    hideError,
    withError,
    parseError,
  }
}
