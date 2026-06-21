import { createApp } from 'vue'
import { createPinia } from 'pinia'
import naive from 'naive-ui'
import App from './App.vue'
import router from './router'
import './style.css'
import { useAppStore } from './stores/app'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

const appStore = useAppStore()
appStore.restoreFromStorage()

app.use(router)
app.use(naive)

app.mount('#app')
