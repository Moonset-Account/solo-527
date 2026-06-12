import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import 'antd/dist/reset.css'
import { useUserStore } from './store'

const initStore = () => {
  const { token, user, isLoggedIn } = useUserStore.getState()
  if (token && user && isLoggedIn) {
    console.log('Store rehydrated successfully', { username: user.username })
  }
}

initStore()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
