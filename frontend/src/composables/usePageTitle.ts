import { watch } from 'vue'
import { useRoute } from 'vue-router'

const DEFAULT_TITLE = '销售邮件知识检索助手'

export function usePageTitle(customTitle?: string) {
  const route = useRoute()

  function updateTitle() {
    const metaTitle = route.meta?.title as string | undefined
    const title = customTitle || metaTitle || DEFAULT_TITLE
    document.title = `${title} - ${DEFAULT_TITLE}`
  }

  if (customTitle) {
    updateTitle()
  } else {
    watch(
      () => [route.path, route.meta?.title],
      () => updateTitle(),
      { immediate: true }
    )
  }

  function setTitle(title: string) {
    document.title = `${title} - ${DEFAULT_TITLE}`
  }

  return { setTitle, updateTitle }
}
