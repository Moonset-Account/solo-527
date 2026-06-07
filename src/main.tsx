import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { runMigrations } from './api/migrate'
import './index.css'

const migrationResults = runMigrations()
console.log('[App] Data layer initialized:', migrationResults)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
