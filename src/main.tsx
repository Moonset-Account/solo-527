import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { runMigrations } from './api/migrate'
import { initializeConnections } from './api/client'
import './index.css'

const migrationResults = runMigrations()
console.log('[App] Data layer initialized:', migrationResults)

initializeConnections().then((status) => {
  console.log('[App] Database connections:', status)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
