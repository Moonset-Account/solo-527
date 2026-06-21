import { defineNuxtPlugin } from '#app'
import * as echarts from 'echarts'
import VChart from 'vue-echarts'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('VChart', VChart)
  return {
    provide: {
      echarts
    }
  }
})
