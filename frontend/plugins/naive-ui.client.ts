import { setup } from '@css-render/vue3-ssr'
import type { NuxtSSRContext } from 'nuxt/app'

export default defineNuxtPlugin((nuxtApp) => {
  if (process.server) {
    const { collect } = setup(nuxtApp.vueApp)
    const originalRenderMeta = nuxtApp.ssrContext?.head?.renderMeta
    const ctx = nuxtApp.ssrContext as NuxtSSRContext & { head?: any }
    if (ctx.head) {
      ctx.head = ctx.head || {} as any
      ctx.head.renderMeta = () => {
        const headMeta = originalRenderMeta ? originalRenderMeta() : {}
        const { ids, styles } = collect()
        return {
          ...headMeta,
          headTags: [headMeta.headTags || '', styles].join(''),
          // use ids to avoid mismatching between client and server
          _cssRenderIds: ids,
        }
      }
    }
  }
})
