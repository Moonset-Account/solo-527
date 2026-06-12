import { setup } from '@css-render/vue3-plugin'
import naive from 'naive-ui'

export default defineNuxtPlugin((nuxtApp) => {
  const { install } = setup()
  nuxtApp.vueApp.use(naive)
  install(nuxtApp.vueApp)
})
