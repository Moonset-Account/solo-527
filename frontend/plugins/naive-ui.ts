import { setup } from '@css-render/vue3-ssr'
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  if (process.server) {
    const { collect } = setup(nuxtApp.vueApp)
    nuxtApp.hook('app:rendered', () => {
      const { head } = nuxtApp.ssrContext!
      if (head === undefined) return
      head.push(collect())
    })
  }
})
