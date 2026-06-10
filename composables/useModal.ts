import { ref } from 'vue'

export function useModal<T = any>() {
  const visible = ref(false)
  const modalData = ref<T | null>(null)

  const open = (data?: T) => {
    if (data !== undefined) {
      modalData.value = data
    }
    visible.value = true
  }

  const close = () => {
    visible.value = false
    setTimeout(() => {
      modalData.value = null
    }, 300)
  }

  return {
    visible,
    modalData,
    open,
    close,
  }
}
