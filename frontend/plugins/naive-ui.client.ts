import { defineNuxtPlugin, useState } from 'nuxt/app'
import { setup } from '@css-render/vue3-ssr'
import { create, NConfigProvider, NMessageProvider, NDialogProvider, NNotificationProvider, NLoadingBarProvider } from 'naive-ui'

const naive = create({
  components: [NConfigProvider, NMessageProvider, NDialogProvider, NNotificationProvider, NLoadingBarProvider],
})

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(naive)

  if (process.server) {
    const { collect } = setup(nuxtApp.vueApp)
    const originalRenderMeta = nuxtApp.ssrContext?.renderMeta
    // @ts-ignore
    nuxtApp.ssrContext = nuxtApp.ssrContext || {}
    // @ts-ignore
    nuxtApp.ssrContext.renderMeta = () => {
      if (!originalRenderMeta) {
        return {
          headTags: collect(),
        }
      }
      const oldMeta = originalRenderMeta()
      return {
        ...oldMeta,
        // @ts-ignore
        headTags: (oldMeta.headTags || '') + collect(),
      }
    }
  }
})
