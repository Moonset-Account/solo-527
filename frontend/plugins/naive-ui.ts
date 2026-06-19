import { setup } from '@css-render/vue3-ssr'
import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin((nuxtApp) => {
  if (process.server) {
    const { collect } = setup(nuxtApp.vueApp)
    const originalRenderMeta = nuxtApp.ssrContext?.head?.renderMeta
    nuxtApp.ssrContext = nuxtApp.ssrContext || {}
    nuxtApp.ssrContext.head = nuxtApp.ssrContext.head || {}
    nuxtApp.ssrContext.head.renderMeta = () => {
      if (!originalRenderMeta) {
        return {
          headTags: collect()
        }
      }
      const originalMeta = originalRenderMeta()
      const { headTags } = originalMeta
      const ssrStyle = collect()
      return {
        ...originalMeta,
        headTags: ssrStyle + headTags
      }
    }
  }
})
