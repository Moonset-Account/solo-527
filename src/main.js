import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/global.scss'

if (window.location.pathname === '/login' || window.location.pathname !== '/') {
  window.history.replaceState(null, '', '/')
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
